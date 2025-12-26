import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '@/common/redis/redis.service';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface ApiMetric {
  path: string;
  method: string;
  totalCalls: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  lastCalledAt: Date | null;
}

export interface ApiCall {
  path: string;
  method: string;
  status: number;
  responseTime: number;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  userId?: number;
}

const API_METRICS_KEY = 'api:metrics:';
const API_CALLS_KEY = 'api:calls:recent';
const API_ERRORS_KEY = 'api:errors:recent';

@Injectable()
export class ApiMonitorService implements OnModuleInit {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // 初始化时清理过期数据
    await this.cleanupOldData();
  }

  /**
   * 记录 API 调用
   */
  async recordApiCall(call: ApiCall) {
    const key = `${API_METRICS_KEY}${call.method}:${call.path}`;
    const client = this.redis.getClient();

    // 使用 Redis Pipeline 批量操作
    const pipeline = client.pipeline();

    // 更新指标
    pipeline.hincrby(key, 'totalCalls', 1);
    pipeline.hincrbyfloat(key, 'totalResponseTime', call.responseTime);
    pipeline.hset(key, 'lastCalledAt', call.timestamp.toISOString());
    pipeline.hset(key, 'path', call.path);
    pipeline.hset(key, 'method', call.method);

    if (call.status >= 200 && call.status < 400) {
      pipeline.hincrby(key, 'successCount', 1);
    } else {
      pipeline.hincrby(key, 'errorCount', 1);
    }

    // 更新最小/最大响应时间
    const currentMin = await client.hget(key, 'minResponseTime');
    const currentMax = await client.hget(key, 'maxResponseTime');

    if (!currentMin || call.responseTime < parseFloat(currentMin)) {
      pipeline.hset(key, 'minResponseTime', call.responseTime.toString());
    }
    if (!currentMax || call.responseTime > parseFloat(currentMax)) {
      pipeline.hset(key, 'maxResponseTime', call.responseTime.toString());
    }

    // 设置过期时间（7天）
    pipeline.expire(key, 7 * 24 * 60 * 60);

    // 记录最近调用（保留最近1000条）
    const callData = JSON.stringify({
      ...call,
      timestamp: call.timestamp.toISOString(),
    });
    pipeline.lpush(API_CALLS_KEY, callData);
    pipeline.ltrim(API_CALLS_KEY, 0, 999);

    // 如果是错误，记录到错误列表
    if (call.status >= 400) {
      pipeline.lpush(API_ERRORS_KEY, callData);
      pipeline.ltrim(API_ERRORS_KEY, 0, 499);
    }

    await pipeline.exec();
  }

  /**
   * 获取 API 统计概览
   */
  async getApiOverview() {
    const client = this.redis.getClient();
    const keys = await client.keys(`${API_METRICS_KEY}*`);

    let totalCalls = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;

    for (const key of keys) {
      const metrics = await client.hgetall(key);
      totalCalls += parseInt(metrics.totalCalls || '0', 10);
      totalErrors += parseInt(metrics.errorCount || '0', 10);
      totalResponseTime += parseFloat(metrics.totalResponseTime || '0');
    }

    const avgResponseTime = totalCalls > 0 ? totalResponseTime / totalCalls : 0;
    const errorRate = totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0;

    // 获取今日调用统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = `api:daily:${today.toISOString().split('T')[0]}`;
    const todayCalls = parseInt((await client.get(todayKey)) || '0', 10);

    return {
      totalApis: keys.length,
      totalCalls,
      totalErrors,
      avgResponseTime: avgResponseTime.toFixed(2),
      errorRate: errorRate.toFixed(2),
      todayCalls,
    };
  }

  /**
   * 获取所有 API 指标列表
   */
  async getApiMetrics(): Promise<ApiMetric[]> {
    const client = this.redis.getClient();
    const keys = await client.keys(`${API_METRICS_KEY}*`);

    const metrics: ApiMetric[] = [];

    for (const key of keys) {
      const data = await client.hgetall(key);
      if (!data.path) continue;

      const totalCalls = parseInt(data.totalCalls || '0', 10);
      const totalResponseTime = parseFloat(data.totalResponseTime || '0');

      metrics.push({
        path: data.path,
        method: data.method || 'GET',
        totalCalls,
        successCount: parseInt(data.successCount || '0', 10),
        errorCount: parseInt(data.errorCount || '0', 10),
        avgResponseTime: totalCalls > 0 ? totalResponseTime / totalCalls : 0,
        minResponseTime: parseFloat(data.minResponseTime || '0'),
        maxResponseTime: parseFloat(data.maxResponseTime || '0'),
        lastCalledAt: data.lastCalledAt ? new Date(data.lastCalledAt) : null,
      });
    }

    // 按调用次数排序
    return metrics.sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * 获取最近 API 调用列表
   */
  async getRecentCalls(limit = 100) {
    const client = this.redis.getClient();
    const calls = await client.lrange(API_CALLS_KEY, 0, limit - 1);
    return calls.map((c) => JSON.parse(c));
  }

  /**
   * 获取最近错误列表
   */
  async getRecentErrors(limit = 100) {
    const client = this.redis.getClient();
    const errors = await client.lrange(API_ERRORS_KEY, 0, limit - 1);
    return errors.map((e) => JSON.parse(e));
  }

  /**
   * 获取慢接口列表
   */
  async getSlowApis(threshold = 1000) {
    const metrics = await this.getApiMetrics();
    return metrics
      .filter((m) => m.avgResponseTime > threshold)
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime);
  }

  /**
   * 获取高错误率接口
   */
  async getHighErrorRateApis(threshold = 5) {
    const metrics = await this.getApiMetrics();
    return metrics
      .filter((m) => {
        const errorRate = m.totalCalls > 0 ? (m.errorCount / m.totalCalls) * 100 : 0;
        return errorRate > threshold && m.totalCalls >= 10; // 至少10次调用
      })
      .map((m) => ({
        ...m,
        errorRate: ((m.errorCount / m.totalCalls) * 100).toFixed(2),
      }))
      .sort((a, b) => parseFloat(b.errorRate) - parseFloat(a.errorRate));
  }

  /**
   * 获取 API 调用趋势（最近24小时，按小时统计）
   */
  async getApiTrend() {
    const client = this.redis.getClient();
    const now = new Date();
    const trend = [];

    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = `api:hourly:${hour.toISOString().slice(0, 13)}`;
      const data = await client.hgetall(hourKey);

      trend.push({
        time: hour.toISOString().slice(0, 13) + ':00',
        calls: parseInt(data.calls || '0', 10),
        errors: parseInt(data.errors || '0', 10),
        avgResponseTime: parseFloat(data.avgResponseTime || '0'),
      });
    }

    return trend;
  }

  /**
   * 获取状态码分布
   */
  async getStatusCodeDistribution() {
    const client = this.redis.getClient();
    const distribution: Record<string, number> = {};

    const calls = await client.lrange(API_CALLS_KEY, 0, -1);
    for (const callStr of calls) {
      const call = JSON.parse(callStr);
      const statusGroup = `${Math.floor(call.status / 100)}xx`;
      distribution[statusGroup] = (distribution[statusGroup] || 0) + 1;
    }

    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
    }));
  }

  /**
   * 清除 API 统计数据
   */
  async clearMetrics() {
    const client = this.redis.getClient();
    const keys = await client.keys(`${API_METRICS_KEY}*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    await client.del(API_CALLS_KEY);
    await client.del(API_ERRORS_KEY);
    return { cleared: keys.length + 2 };
  }

  /**
   * 清理过期数据
   */
  private async cleanupOldData() {
    const client = this.redis.getClient();

    // 清理7天前的每日统计
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyKeys = await client.keys('api:daily:*');
    for (const key of dailyKeys) {
      const dateStr = key.replace('api:daily:', '');
      if (new Date(dateStr) < sevenDaysAgo) {
        await client.del(key);
      }
    }

    // 清理24小时前的小时统计
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const hourlyKeys = await client.keys('api:hourly:*');
    for (const key of hourlyKeys) {
      const dateStr = key.replace('api:hourly:', '') + ':00:00.000Z';
      if (new Date(dateStr) < oneDayAgo) {
        await client.del(key);
      }
    }
  }
}
