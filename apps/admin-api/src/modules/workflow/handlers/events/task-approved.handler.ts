import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { TaskApprovedEvent } from '../../events/task-approved.event';

/**
 * 任务通过事件处理器
 */
@EventsHandler(TaskApprovedEvent)
export class TaskApprovedHandler implements IEventHandler<TaskApprovedEvent> {
  private readonly logger = new Logger(TaskApprovedHandler.name);

  async handle(event: TaskApprovedEvent) {
    this.logger.log(
      `任务通过事件: taskId=${event.taskId}, instanceId=${event.instanceId}, ` +
        `approver=${event.approverName}`,
    );

    // TODO: 发送通知给下一节点审批人
    // 通知逻辑可以在这里实现，或者发布新的通知事件
  }
}
