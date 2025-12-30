import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CallbackService } from '../../services/callback.service';
import { FlowStartedEvent } from '../../events/flow-started.event';
import { FlowCompletedEvent } from '../../events/flow-completed.event';
import { TaskApprovedEvent } from '../../events/task-approved.event';
import { TaskRejectedEvent } from '../../events/task-rejected.event';
import { TaskUrgedEvent } from '../../events/task-urged.event';
import { CallbackPayload, BusinessCallback } from '../../types/callback.types';

/**
 * 业务回调事件处理器
 */
@EventsHandler(FlowStartedEvent, FlowCompletedEvent, TaskApprovedEvent, TaskRejectedEvent, TaskUrgedEvent)
export class CallbackHandler implements IEventHandler<any> {
  private readonly logger = new Logger(CallbackHandler.name);

  constructor(private readonly callbackService: CallbackService) {}

  async handle(event: any) {
    try {
      // 获取流程实例ID
      const flowInstanceId = this.getFlowInstanceId(event);

      // 构建回调payload
      const payload = this.buildCallbackPayload(event);

      // 获取回调配置
      const callbacks = await this.callbackService.getCallbacksForFlow(payload.flowDefinitionId);

      if (callbacks.length === 0) {
        return; // 没有配置回调
      }

      // 执行回调
      await this.callbackService.executeCallback(
        flowInstanceId,
        payload.eventType,
        payload,
        callbacks,
      );
    } catch (error) {
      this.logger.error(`处理业务回调失败: ${error.message}`);
      // 回调失败不影响主流程
    }
  }

  /**
   * 获取流程实例ID
   */
  private getFlowInstanceId(event: any): number {
    if (event instanceof FlowStartedEvent) {
      return event.instanceId;
    } else if (event instanceof FlowCompletedEvent) {
      return event.instanceId;
    } else if (event instanceof TaskApprovedEvent || event instanceof TaskRejectedEvent) {
      // 需要从任务信息中获取流程实例ID
      return event.instanceId;
    } else if (event instanceof TaskUrgedEvent) {
      return event.instanceId;
    }

    throw new Error('未知的事件类型');
  }

  /**
   * 构建回调payload
   */
  private buildCallbackPayload(event: any): CallbackPayload {
    const basePayload: Partial<CallbackPayload> = {
      timestamp: new Date().toISOString(),
    };

    if (event instanceof FlowStartedEvent) {
      return {
        ...basePayload,
        eventType: 'flow_started',
        flowInstanceId: event.instanceId,
        flowDefinitionId: event.flowDefinitionId,
        flowDefinitionName: event.flowDefinitionName,
        initiator: {
          id: event.initiatorId,
          name: event.initiatorName,
        },
        status: 'RUNNING',
      } as CallbackPayload;
    } else if (event instanceof FlowCompletedEvent) {
      return {
        ...basePayload,
        eventType: 'flow_completed',
        flowInstanceId: event.instanceId,
        status: 'COMPLETED',
        duration: event.duration,
      } as CallbackPayload;
    } else if (event instanceof TaskApprovedEvent) {
      return {
        ...basePayload,
        eventType: 'task_approved',
        flowInstanceId: event.instanceId,
        task: {
          id: event.taskId,
          nodeId: event.nodeId,
          nodeName: event.nodeName,
          assigneeId: event.approverId,
          assigneeName: event.approverName,
          result: 'APPROVED',
          comment: event.comment,
        },
        status: 'RUNNING',
      } as CallbackPayload;
    } else if (event instanceof TaskRejectedEvent) {
      return {
        ...basePayload,
        eventType: 'task_rejected',
        flowInstanceId: event.instanceId,
        task: {
          id: event.taskId,
          nodeId: event.nodeId,
          nodeName: event.nodeName,
          assigneeId: event.rejectorId,
          assigneeName: event.rejectorName,
          result: 'REJECTED',
          comment: event.comment,
        },
        status: 'REJECTED',
      } as CallbackPayload;
    } else if (event instanceof TaskUrgedEvent) {
      return {
        ...basePayload,
        eventType: 'task_urged',
        flowInstanceId: event.instanceId,
        task: {
          id: event.taskId,
          nodeId: event.nodeId,
          nodeName: event.nodeName,
          assigneeId: event.assigneeId,
          assigneeName: event.assigneeName,
        },
        status: 'RUNNING',
      } as CallbackPayload;
    }

    throw new Error('未知的事件类型');
  }
}

/**
 * 注意：由于需要从任务事件获取流程实例信息，
 * 我们需要修改事件类，使其包含流程实例ID
 */