import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { TaskUrgedEvent } from '../../events/task-urged.event';

/**
 * 任务催办事件处理器
 */
@EventsHandler(TaskUrgedEvent)
export class TaskUrgedHandler implements IEventHandler<TaskUrgedEvent> {
  private readonly logger = new Logger(TaskUrgedHandler.name);

  async handle(event: TaskUrgedEvent) {
    this.logger.log(
      `任务催办事件: taskId=${event.taskId}, instanceId=${event.instanceId}, ` +
        `assignee=${event.assigneeName}, urger=${event.urgerName}, comment=${event.comment || '无'}`,
    );

    // TODO: 发送催办通知给任务处理人
    // 可以发送站内信、邮件、短信等通知
    // 通知内容：谁催办了哪个流程的哪个节点
  }
}