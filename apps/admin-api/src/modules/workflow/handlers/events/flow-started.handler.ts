import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { WfLogAction } from '@prisma/client';
import { FlowStartedEvent } from '../../events/flow-started.event';

/**
 * 流程启动事件处理器
 */
@EventsHandler(FlowStartedEvent)
export class FlowStartedHandler implements IEventHandler<FlowStartedEvent> {
  private readonly logger = new Logger(FlowStartedHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: FlowStartedEvent) {
    this.logger.log(
      `流程启动事件: instanceId=${event.instanceId}, ` +
        `initiator=${event.initiatorName}, flow=${event.flowDefinitionName}`,
    );

    // 记录日志
    await this.prisma.wfFlowLog.create({
      data: {
        flowInstanceId: event.instanceId,
        action: WfLogAction.START,
        toStatus: 'RUNNING',
        operatorId: event.initiatorId,
        operatorName: event.initiatorName,
        comment: `发起流程: ${event.flowDefinitionName}`,
      },
    });
  }
}
