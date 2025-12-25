import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SYSTEM_JOB_QUEUE } from '@/common/constants/queues';

@Processor(SYSTEM_JOB_QUEUE)
export class JobProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    const startedAt = new Date();
    const jobId = job.data?.jobId as number | undefined;
    const jobName = job.data?.jobName as string | undefined;
    const trigger = (job.data?.trigger as string | undefined) ?? 'CRON';
    const jobType = (job.data?.jobType as string | undefined) ?? 'SYSTEM';
    const operator = (job.data?.triggeredBy as string | undefined) ?? 'system';
    const requestPayload =
      jobType === 'HTTP'
        ? {
            method: job.data?.httpMethod ?? 'GET',
            url: job.data?.httpUrl,
            headers: job.data?.httpHeaders ?? null,
            payload: job.data?.payload ?? null,
          }
        : job.data?.payload ?? null;
    let logId: number | null = null;

    if (jobId) {
      const log = await this.prisma.sysJobLog.create({
        data: {
          jobId,
          jobName: jobName ?? job.name,
          handler: job.name,
          trigger,
          status: 'RUNNING',
          message: '任务开始执行',
          payload: requestPayload,
          createdBy: operator,
          startedAt,
        },
      });
      logId = log.id;
    }

    try {
      const result =
        jobType === 'HTTP'
          ? await this.executeHttp(job.data)
          : await this.execute(job.name, job.data?.payload);
      const finishedAt = new Date();

      if (logId) {
        await this.prisma.sysJobLog.update({
          where: { id: logId },
          data: {
            status: 'SUCCESS',
            message: '任务执行成功',
            result,
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            updatedBy: operator,
          },
        });
      }

      if (jobId) {
        await this.prisma.sysJob
          .update({
            where: { id: jobId },
            data: { lastRunAt: finishedAt },
          })
          .catch(() => undefined);
      }

      return result;
    } catch (error: any) {
      const finishedAt = new Date();

      if (logId) {
        await this.prisma.sysJobLog.update({
          where: { id: logId },
          data: {
            status: 'FAILED',
            message: '任务执行失败',
            error: error?.message ?? '未知错误',
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            updatedBy: operator,
          },
        });
      }

      if (jobId) {
        await this.prisma.sysJob
          .update({
            where: { id: jobId },
            data: { lastRunAt: finishedAt },
          })
          .catch(() => undefined);
      }

      throw error;
    }
  }

  private async execute(handler: string, payload: any) {
    switch (handler) {
      case 'system:heartbeat':
        return {
          ok: true,
          timestamp: new Date().toISOString(),
          payload,
        };
      default:
        throw new Error(`未注册的任务处理器: ${handler}`);
    }
  }

  private async executeHttp(data: any) {
    const method = (data?.httpMethod ?? 'GET').toUpperCase();
    const url = data?.httpUrl as string | undefined;
    if (!url) {
      throw new Error('HTTP 任务缺少请求地址');
    }

    const headers = (data?.httpHeaders ?? {}) as Record<string, string>;
    let requestUrl = url;
    let body: string | undefined;
    const payload = data?.payload;

    if (method === 'GET' || method === 'HEAD') {
      if (payload && typeof payload === 'object') {
        const urlObj = new URL(url);
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            urlObj.searchParams.append(key, String(value));
          }
        });
        requestUrl = urlObj.toString();
      }
    } else if (payload !== undefined) {
      body = JSON.stringify(payload);
      if (!headers['content-type'] && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(requestUrl, {
      method,
      headers,
      body,
    });

    const text = await response.text();
    let dataResult: any = text;
    try {
      dataResult = text ? JSON.parse(text) : null;
    } catch {
      dataResult = text;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data: dataResult,
    };
  }
}
