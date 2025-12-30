import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { WfTaskStatus } from '@prisma/client';

interface TimeoutTaskData {
  taskId: number;
  timeoutAction: 'AUTO_PASS' | 'AUTO_REJECT' | 'REMIND';
}

/**
 * 超时任务调度器
 */
@Injectable()
export class TimeoutSchedulerService {
  private readonly logger = new Logger(TimeoutSchedulerService.name);

  constructor(
    @InjectQueue('workflow-timeout') private timeoutQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 每分钟检查一次即将超时的任务
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkTimeoutTasks(): Promise<void> {
    this.logger.log('开始检查超时任务...');

    const now = new Date();
    const remindBefore = new Date(now.getTime() + 30 * 60 * 1000); // 30分钟后超时

    try {
      // 1. 查找设置了超时时间的待处理任务
      const tasks = await this.prisma.wfTask.findMany({
        where: {
          status: WfTaskStatus.PENDING,
          dueTime: {
            not: null,
          },
        },
        include: {
          flowInstance: {
            include: {
              flowDefinition: true,
            },
          },
        },
      });

      for (const task of tasks) {
        const dueTime = new Date(task.dueTime!);

        // flowDefinitionId 获取 通过 nodeId 和节点配置
        const nodeConfig = await this.prisma.wfNodeConfig.findFirst({
          where: {
            flowDefinitionId: task.flowInstance.flowDefinitionId,
            nodeId: task.nodeId,
            deleted: false,
          },
        });

        if (!nodeConfig?.timeLimit) {
          continue;
        }

        const timeoutAction = nodeConfig.timeoutAction || 'REMIND';

        // 2. 如果任务已超时，立即处理
        if (now >= dueTime) {
          this.logger.log(`任务 #${task.id} 已超时，加入处理队列`);
          await this.addTimeoutTask(task.id, timeoutAction);
        }
        // 3. 如果任务即将超时（30分钟内），发送提醒
        else if (now >= new Date(dueTime.getTime() - 30 * 60 * 1000)) {
          this.logger.log(`任务 #${task.id} 即将超时，发送提醒`);
          await this.addTimeoutTask(task.id, 'REMIND');
        }
      }

      this.logger.log(`本次共处理 ${tasks.length} 个任务的超时检查`);
    } catch (error) {
      this.logger.error(`检查超时任务失败: ${error.message}`);
    }
  }

  /**
   * 添加超时任务到队列
   */
  async addTimeoutTask(taskId: number, timeoutAction: string): Promise<void> {
    const jobData: TimeoutTaskData = {
      taskId,
      timeoutAction: timeoutAction as 'AUTO_PASS' | 'AUTO_REJECT' | 'REMIND',
    };

    // 延迟1秒执行，避免立即执行
    await this.timeoutQueue.add('timeout-task', jobData, {
      delay: 1000,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    this.logger.log(`已添加超时任务 #${taskId} 到队列，动作: ${timeoutAction}`);
  }

  /**
   * 为任务设置超时时间
   */
  async setTaskTimeout(taskId: number, timeoutHours: number): Promise<void> {
    const dueTime = new Date(Date.now() + timeoutHours * 60 * 60 * 1000);

    await this.prisma.wfTask.update({
      where: { id: taskId },
      data: { dueTime },
    });

    this.logger.log(`任务 #${taskId} 设置超时时间: ${dueTime.toISOString()}`);
  }

  /**
   * 取消任务超时
   */
  async cancelTaskTimeout(taskId: number): Promise<void> {
    await this.prisma.wfTask.update({
      where: { id: taskId },
      data: { dueTime: null },
    });

    this.logger.log(`任务 #${taskId} 已取消超时设置`);
  }

  /**
   * 每日凌晨清理已完成的任务超时记录
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupTimeoutTasks(): Promise<void> {
    this.logger.log('开始清理已完成的任务超时记录...');

    try {
      // 清理已完成的任务超时时间
      const result = await this.prisma.wfTask.updateMany({
        where: {
          status: {
            in: ['COMPLETED', 'CANCELLED'],
          },
          dueTime: {
            not: null,
          },
        },
        data: {
          dueTime: null,
        },
      });

      this.logger.log(`清理了 ${result.count} 个已完成的任务超时记录`);
    } catch (error) {
      this.logger.error(`清理超时记录失败: ${error.message}`);
    }
  }
}