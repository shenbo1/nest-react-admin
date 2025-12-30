import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { TaskRejectedEvent } from '../../events/task-rejected.event';

/**
 * 任务驳回事件处理器
 */
@EventsHandler(TaskRejectedEvent)
export class TaskRejectedHandler implements IEventHandler<TaskRejectedEvent> {
  private readonly logger = new Logger(TaskRejectedHandler.name);

  async handle(event: TaskRejectedEvent) {
    this.logger.log(
      `任务驳回事件: taskId=${event.taskId}, instanceId=${event.instanceId}, ` +
        `rejector=${event.rejectorName}, comment=${event.comment || '无'}`,
    );

    // TODO: 通知流程发起人
    // 可以发送站内信、邮件等通知
  }
}
