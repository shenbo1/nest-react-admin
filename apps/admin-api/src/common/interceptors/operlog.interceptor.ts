import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class OperLogInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params, ip } = request;
    const user = this.cls.get('user');

    // 只记录非 GET 请求
    const shouldLog = method !== 'GET' && !url.includes('/docs');

    // 操作名称映射
    const getOperName = (method: string, url: string) => {
      const action = {
        POST: '新增',
        PUT: '修改',
        DELETE: '删除',
        PATCH: '修改',
      }[method] || '未知';

      const module = url.split('/')[2] || '未知模块';
      return `${action} ${module}`;
    };

    const businessTypeMap: Record<string, number> = {
      POST: 1, // 新增
      PUT: 2,  // 修改
      DELETE: 3, // 删除
    };
    const businessType = businessTypeMap[method] || 0;

    // 准备操作日志数据
    const operLogData = {
      title: getOperName(method, url),
      businessType,
      method: `${method} ${url}`,
      requestMethod: method,
      operatorType: user ? 1 : 0, // 1=其他用户 0=系统
      operName: user?.username || 'anonymous',
      deptName: user?.dept?.name || '',
      operUrl: url,
      operIp: ip || request.ip || '',
      operLocation: '', // 可以在后续集成 IP 地理位置服务
      operParam: JSON.stringify({ body, query, params }).slice(0, 2000),
      jsonResult: '',
      status: 0, // 初始为成功，失败时会在 catchError 中更新
      errorMsg: '',
      operTime: new Date(),
      costTime: 0,
    };

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (data) => {
        if (shouldLog) {
          try {
            // 记录成功的操作日志
            await this.prisma.sysOperLog.create({
              data: {
                ...operLogData,
                jsonResult: JSON.stringify(data).slice(0, 2000),
                status: 1,
                costTime: Date.now() - startTime,
              },
            });
          } catch (error) {
            // 记录日志失败不应该影响主流程
            console.error('记录操作日志失败:', error);
          }
        }
      }),
      catchError(async (error, caught) => {
        if (shouldLog) {
          try {
            // 记录失败的操作日志
            await this.prisma.sysOperLog.create({
              data: {
                ...operLogData,
                status: 0,
                errorMsg: error.message?.slice(0, 500) || '未知错误',
                jsonResult: JSON.stringify(error?.response || {}).slice(0, 2000),
                costTime: Date.now() - startTime,
              },
            });
          } catch (logError) {
            console.error('记录操作日志失败:', logError);
          }
        }
        throw error;
      }),
    );
  }
}
