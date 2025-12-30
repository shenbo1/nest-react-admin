import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { WfTaskStatus, WfLogAction, WfTaskResult } from '@prisma/client';
import { CommandBus } from '@nestjs/cqrs';
import { ApproveTaskCommand } from '../commands/task/approve-task.command';

interface TimeoutTaskData {
  taskId: number;
  timeoutAction: 'AUTO_PASS' | 'AUTO_REJECT' | 'REMIND';
}

/**
 * 任务超时处理器
 */
@Processor('workflow-timeout')
export class TimeoutTaskProcessor extends WorkerHost {
  private readonly logger = new Logger(TimeoutTaskProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
  ) {
    super();
  }

  async process(job: Job<TimeoutTaskData>): Promise<void> {
    const { taskId, timeoutAction } = job.data;

    this.logger.log(`处理超时任务 #${taskId}, 动作: ${timeoutAction}`);

    // 获取任务信息
    const task = await this.prisma.wfTask.findUnique({
      where: { id: taskId },
      include: {
        flowInstance: true,
      },
    });

    if (!task) {
      this.logger.warn(`任务 #${taskId} 不存在`);
      return;
    }

    if (task.status !== WfTaskStatus.PENDING) {
      this.logger.log(`任务 #${taskId} 状态不是待处理，跳过处理`);
      return;
    }

    // 检查是否已超时
    const now = new Date();
    const dueTime = task.dueTime ? new Date(task.dueTime) : null;

    if (!dueTime || now < dueTime) {
      this.logger.log(`任务 #${taskId} 还未到超时时间`);
      return;
    }

    try {
      switch (timeoutAction) {
        case 'AUTO_PASS':
          await this.autoApprove(task);
          break;
        case 'AUTO_REJECT':
          await this.autoReject(task);
          break;
        case 'REMIND':
          await this.sendRemind(task);
          break;
        default:
          this.logger.warn(`未知的超时动作: ${timeoutAction}`);
      }
    } catch (error) {
      this.logger.error(`处理超时任务失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 自动通过
   */
  private async autoApprove(task: any): Promise<void> {
    this.logger.log(`自动通过任务 #${task.id}`);

    // 执行自动通过命令
    await this.commandBus.execute(
      new ApproveTaskCommand(
        task.id,
        0, // 系统用户ID
        '系统超时自动通过',
        {
          comment: '超时自动通过',
          formData: {},
        },
      ),
    );

    // 记录日志
    await this.prisma.wfFlowLog.create({
      data: {
        flowInstanceId: task.flowInstanceId,
        taskId: task.id,
        nodeId: task.nodeId,
        nodeName: task.nodeName,
        action: WfLogAction.AUTO,
        operatorId: 0,
        operatorName: '系统',
        comment: '任务超时自动通过',
        toStatus: WfTaskStatus.COMPLETED,
      },
    });
  }

  /**
   * 自动驳回
   */
  private async autoReject(task: any): Promise<void> {
    this.logger.log(`自动驳回任务 #${task.id}`);

    // 更新任务状态
    await this.prisma.wfTask.update({
      where: { id: task.id },
      data: {
        status: WfTaskStatus.COMPLETED,
        result: WfTaskResult.REJECTED,
        comment: '超时自动驳回',
        completedTime: new Date(),
      },
    });

    // 记录日志
    await this.prisma.wfFlowLog.create({
      data: {
        flowInstanceId: task.flowInstanceId,
        taskId: task.id,
        nodeId: task.nodeId,
        nodeName: task.nodeName,
        action: WfLogAction.AUTO,
        operatorId: 0,
        operatorName: '系统',
        comment: '任务超时自动驳回',
        toStatus: WfTaskStatus.COMPLETED,
      },
    });

    // 发布任务驳回事件
    // TODO: 发布 TaskRejectedEvent
  }

  /**
   * 发送催办提醒
   */
  private async sendRemind(task: any): Promise<void> {
    this.logger.log(`发送催办提醒给任务 #${task.id} 的处理人`);

    // 记录催办日志
    await this.prisma.wfFlowLog.create({
      data: {
        flowInstanceId: task.flowInstanceId,
        taskId: task.id,
        nodeId: task.nodeId,
        nodeName: task.nodeName,
        action: WfLogAction.URGE,
        operatorId: 0,
        operatorName: '系统',
        comment: '任务即将超时，请及时处理',
        toStatus: task.status,
      },
    });

    // TODO: 发送通知给处理人
    // 可以集成消息中心、邮件、短信等
  }
}