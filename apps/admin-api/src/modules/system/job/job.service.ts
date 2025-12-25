import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PaginatedResult } from '@/common/dto';
import { Status, JobType } from '@prisma/client';
import cronParser from 'cron-parser';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { QueryJobLogDto } from './dto/query-job-log.dto';
import { SYSTEM_JOB_QUEUE } from '@/common/constants/queues';

const JOB_ID_PREFIX = 'sys-job-';

@Injectable()
export class JobService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(SYSTEM_JOB_QUEUE) private readonly queue: Queue,
  ) {}

  private buildRepeatJobId(id: number) {
    return `${JOB_ID_PREFIX}${id}`;
  }

  private getNextRunAtFromCron(cron: string) {
    try {
      const interval = cronParser.parseExpression(cron);
      return interval.next().toDate();
    } catch {
      return null;
    }
  }

  private async addRepeatableJob(job: any) {
    if (job.status !== 'ENABLED') {
      return;
    }

    await this.queue.upsertJobScheduler(
      this.buildRepeatJobId(job.id),
      { pattern: job.cron },
      {
        name: job.handler,
        data: {
          jobId: job.id,
          jobName: job.name,
          payload: job.payload,
          jobType: job.type,
          httpMethod: job.httpMethod,
          httpUrl: job.httpUrl,
          httpHeaders: job.httpHeaders,
          trigger: 'CRON',
        },
        opts: {
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
    );
  }

  private async removeRepeatableJob(job: any) {
    try {
      const schedulerId = this.buildRepeatJobId(job.id);
      const schedulers = await this.queue.getJobSchedulers();
      const scheduler = schedulers.find(
        (entry) => entry.id === schedulerId && entry.name === job.handler,
      );

      await this.queue.removeJobScheduler(schedulerId);

      if (scheduler?.key) {
        const delayedJobs = await this.queue.getJobs(['delayed']);
        for (const delayed of delayedJobs) {
          if (delayed.repeatJobKey === scheduler.key) {
            await delayed.remove();
          }
        }
      }
    } catch (error) {
      // ignore missing schedulers
    }
  }

  async create(createJobDto: CreateJobDto) {
    const job = await this.prisma.sysJob.create({
      data: {
        name: createJobDto.name,
        type: createJobDto.type ?? JobType.SYSTEM,
        handler: createJobDto.handler,
        httpMethod: createJobDto.httpMethod,
        httpUrl: createJobDto.httpUrl,
        httpHeaders: createJobDto.httpHeaders,
        cron: createJobDto.cron,
        payload: createJobDto.payload,
        status: createJobDto.status ?? Status.ENABLED,
        remark: createJobDto.remark,
      },
    });

    await this.addRepeatableJob(job);

    return job;
  }

  async findAll(query: QueryJobDto) {
    const { page = 1, pageSize = 10, name, handler, status } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };

    if (name) {
      where.name = { contains: name };
    }
    if (handler) {
      where.handler = { contains: handler };
    }
    if (status) {
      where.status = status;
    }

    const [data, total, schedulers] = await Promise.all([
      this.prisma.sysJob.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysJob.count({ where }),
      this.queue.getJobSchedulers(),
    ]);

    const withNextRunAt = data.map((item) => {
      const scheduler = schedulers.find(
        (entry) =>
          entry.id === this.buildRepeatJobId(item.id) &&
          entry.name === item.handler,
      );

      return {
        ...item,
        nextRunAt: scheduler?.next
          ? new Date(scheduler.next)
          : this.getNextRunAtFromCron(item.cron),
      };
    });

    return new PaginatedResult(withNextRunAt, total, page, pageSize);
  }

  async findOne(id: number) {
    const job = await this.prisma.sysJob.findFirst({
      where: { id, deleted: false },
    });

    if (!job) {
      throw new NotFoundException('任务不存在');
    }

    const schedulers = await this.queue.getJobSchedulers();
    const scheduler = schedulers.find(
      (entry) =>
        entry.id === this.buildRepeatJobId(job.id) &&
        entry.name === job.handler,
    );

    return {
      ...job,
      nextRunAt: scheduler?.next
        ? new Date(scheduler.next)
        : this.getNextRunAtFromCron(job.cron),
    };
  }

  async update(id: number, updateJobDto: UpdateJobDto) {
    const job = await this.prisma.sysJob.findFirst({
      where: { id, deleted: false },
    });

    if (!job) {
      throw new NotFoundException('任务不存在');
    }

    await this.removeRepeatableJob(job);

    const updated = await this.prisma.sysJob.update({
      where: { id },
      data: {
        name: updateJobDto.name,
        type: updateJobDto.type ?? job.type,
        handler: updateJobDto.handler,
        httpMethod: updateJobDto.httpMethod,
        httpUrl: updateJobDto.httpUrl,
        httpHeaders: updateJobDto.httpHeaders,
        cron: updateJobDto.cron,
        payload: updateJobDto.payload,
        status: updateJobDto.status ?? job.status,
        remark: updateJobDto.remark,
      },
    });

    await this.addRepeatableJob(updated);

    return updated;
  }

  async updateStatus(id: number, status: Status) {
    if (![Status.ENABLED, Status.DISABLED].includes(status)) {
      throw new BadRequestException('无效的状态值');
    }

    const job = await this.prisma.sysJob.findFirst({
      where: { id, deleted: false },
    });

    if (!job) {
      throw new NotFoundException('任务不存在');
    }

    await this.removeRepeatableJob(job);

    const updated = await this.prisma.sysJob.update({
      where: { id },
      data: { status },
    });

    await this.addRepeatableJob(updated);

    return updated;
  }

  async runOnce(id: number, operator?: string) {
    const job = await this.prisma.sysJob.findFirst({
      where: { id, deleted: false },
    });

    if (!job) {
      throw new NotFoundException('任务不存在');
    }

    if (job.status !== Status.ENABLED) {
      throw new BadRequestException('任务已停用，无法执行');
    }

    await this.queue.add(
      job.handler,
      {
        jobId: job.id,
        jobName: job.name,
        payload: job.payload,
        jobType: job.type,
        httpMethod: job.httpMethod,
        httpUrl: job.httpUrl,
        httpHeaders: job.httpHeaders,
        trigger: 'MANUAL',
        triggeredBy: operator ?? 'system',
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    return { message: '任务已触发执行' };
  }

  async remove(id: number) {
    const job = await this.prisma.sysJob.findFirst({
      where: { id, deleted: false },
    });

    if (!job) {
      throw new NotFoundException('任务不存在');
    }

    await this.removeRepeatableJob(job);

    await this.prisma.sysJob.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });

    return { message: '删除成功' };
  }

  async findLogs(id: number, query: QueryJobLogDto) {
    const { page = 1, pageSize = 10, status, trigger } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { jobId: id };
    if (status) {
      where.status = status;
    }
    if (trigger) {
      where.trigger = trigger;
    }

    const [data, total] = await Promise.all([
      this.prisma.sysJobLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.sysJobLog.count({ where }),
    ]);

    return new PaginatedResult(data, total, page, pageSize);
  }
}
