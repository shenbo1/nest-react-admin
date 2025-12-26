import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiMonitorService } from './api-monitor.service';
import { RedisService } from '@/common/redis/redis.service';

@Injectable()
export class ApiMonitorInterceptor implements NestInterceptor {
  constructor(
    private readonly apiMonitorService: ApiMonitorService,
    private readonly redis: RedisService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, originalUrl, ip, headers } = request;
    const startTime = Date.now();

    // 跳过静态资源和监控端点
    if (
      originalUrl.startsWith('/metrics') ||
      originalUrl.startsWith('/health') ||
      originalUrl.includes('/docs')
    ) {
      return next.handle();
    }

    const recordCall = async (status: number) => {
      const responseTime = Date.now() - startTime;
      const userId = request.user?.id;

      // 记录 API 调用
      await this.apiMonitorService.recordApiCall({
        path: this.normalizePath(originalUrl),
        method,
        status,
        responseTime,
        timestamp: new Date(),
        ip: this.getClientIp(request),
        userAgent: headers['user-agent'],
        userId,
      });

      // 更新小时统计
      await this.updateHourlyStats(responseTime, status >= 400);

      // 更新每日统计
      await this.updateDailyStats();
    };

    return next.handle().pipe(
      tap(async () => {
        await recordCall(response.statusCode);
      }),
      catchError(async (error) => {
        const status = error.status || error.statusCode || 500;
        await recordCall(status);
        throw error;
      }),
    );
  }

  /**
   * 规范化路径（将动态参数替换为占位符）
   */
  private normalizePath(url: string): string {
    // 移除查询参数
    const path = url.split('?')[0];

    // 替换数字ID为 :id
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9]{24}/gi, '/:id') // MongoDB ObjectId
      .replace(/\/[a-f0-9-]{36}/gi, '/:uuid'); // UUID
  }

  /**
   * 获取客户端IP
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.ip ||
      ''
    );
  }

  /**
   * 更新小时统计
   */
  private async updateHourlyStats(responseTime: number, isError: boolean) {
    const client = this.redis.getClient();
    const hourKey = `api:hourly:${new Date().toISOString().slice(0, 13)}`;

    const pipeline = client.pipeline();
    pipeline.hincrby(hourKey, 'calls', 1);
    if (isError) {
      pipeline.hincrby(hourKey, 'errors', 1);
    }
    pipeline.hincrbyfloat(hourKey, 'totalResponseTime', responseTime);
    pipeline.expire(hourKey, 25 * 60 * 60); // 25小时过期

    await pipeline.exec();

    // 计算平均响应时间
    const data = await client.hgetall(hourKey);
    const calls = parseInt(data.calls || '1', 10);
    const totalTime = parseFloat(data.totalResponseTime || '0');
    await client.hset(hourKey, 'avgResponseTime', (totalTime / calls).toString());
  }

  /**
   * 更新每日统计
   */
  private async updateDailyStats() {
    const client = this.redis.getClient();
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `api:daily:${today}`;

    await client.incr(dailyKey);
    await client.expire(dailyKey, 8 * 24 * 60 * 60); // 8天过期
  }
}
