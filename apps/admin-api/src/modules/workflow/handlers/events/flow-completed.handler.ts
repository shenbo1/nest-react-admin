import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { FlowCompletedEvent } from '../../events/flow-completed.event';

/**
 * 流程完成事件处理器
 */
@EventsHandler(FlowCompletedEvent)
export class FlowCompletedHandler implements IEventHandler<FlowCompletedEvent> {
  private readonly logger = new Logger(FlowCompletedHandler.name);

  async handle(event: FlowCompletedEvent) {
    this.logger.log(
      `流程完成事件: instanceId=${event.instanceId}, duration=${event.duration}秒`,
    );

    // TODO: 通知流程发起人流程已完成
    // 可以触发业务回调（如果有配置）
  }
}
