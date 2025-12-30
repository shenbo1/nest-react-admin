import { Injectable, Logger } from '@nestjs/common';
import { CallbackPayload } from '../types/callback.types';

/**
 * 订单审批业务回调处理示例
 *
 * 场景：当订单审批流程完成后，自动更新订单状态
 */
@Injectable()
export class OrderApprovalService {
  private readonly logger = new Logger(OrderApprovalService.name);

  /**
   * 处理订单审批回调
   */
  async handleOrderApprovalCallback(payload: CallbackPayload): Promise<void> {
    // 检查是否是订单相关的流程
    if (!this.isOrderFlow(payload)) {
      return;
    }

    this.logger.log(`处理订单审批回调: ${payload.eventType}, 订单ID: ${payload.businessId}`);

    try {
      switch (payload.eventType) {
        case 'flow_started':
          await this.handleOrderApprovalStarted(payload);
          break;
        case 'flow_completed':
          await this.handleOrderApprovalCompleted(payload);
          break;
        case 'flow_rejected':
          await this.handleOrderApprovalRejected(payload);
          break;
        case 'flow_cancelled':
          await this.handleOrderApprovalCancelled(payload);
          break;
        case 'task_approved':
          await this.handleOrderTaskApproved(payload);
          break;
        case 'task_rejected':
          await this.handleOrderTaskRejected(payload);
          break;
        default:
          this.logger.warn(`未知的订单审批事件类型: ${payload.eventType}`);
      }
    } catch (error) {
      this.logger.error(`处理订单审批回调失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 判断是否是订单流程
   */
  private isOrderFlow(payload: CallbackPayload): boolean {
    // 1. 检查流程定义名称是否包含订单
    if (payload.flowDefinitionName?.toLowerCase().includes('订单')) {
      return true;
    }

    // 2. 检查业务表是否是订单表
    // 这里假设业务表字段在扩展数据中
    if (payload.businessTable === 'orders') {
      return true;
    }

    // 3. 检查业务ID格式（假设订单ID以ORD开头）
    if (payload.businessId?.startsWith('ORD')) {
      return true;
    }

    return false;
  }

  /**
   * 处理订单审批开始
   */
  private async handleOrderApprovalStarted(payload: CallbackPayload): Promise<void> {
    this.logger.log(`订单 ${payload.businessId} 开始审批流程`);

    // TODO: 调用订单服务更新订单状态
    // 例如：将订单状态更新为 "审批中"
    await this.updateOrderStatus(payload.businessId!, 'APPROVING', {
      flowInstanceId: payload.flowInstanceId,
      approver: payload.initiator.name,
    });
  }

  /**
   * 处理订单审批完成
   */
  private async handleOrderApprovalCompleted(payload: CallbackPayload): Promise<void> {
    this.logger.log(`订单 ${payload.businessId} 审批完成，已通过`);

    // 更新订单状态为 "已审批"
    await this.updateOrderStatus(payload.businessId!, 'APPROVED', {
      approvedAt: new Date().toISOString(),
      duration: payload.duration,
    });

    // 触发后续业务逻辑
    await this.triggerPostApprovalActions(payload.businessId!);
  }

  /**
   * 处理订单审批被拒绝
   */
  private async handleOrderApprovalRejected(payload: CallbackPayload): Promise<void> {
    this.logger.log(`订单 ${payload.businessId} 审批被拒绝`);

    // 更新订单状态为 "已拒绝"
    await this.updateOrderStatus(payload.businessId!, 'REJECTED', {
      rejectedAt: new Date().toISOString(),
      reason: '审批被拒绝',
    });

    // 通知相关人员
    await this.notifyOrderRejection(payload.businessId!);
  }

  /**
   * 处理订单审批被取消
   */
  private async handleOrderApprovalCancelled(payload: CallbackPayload): Promise<void> {
    this.logger.log(`订单 ${payload.businessId} 审批被取消`);

    // 更新订单状态为 "已取消"
    await this.updateOrderStatus(payload.businessId!, 'CANCELLED', {
      cancelledAt: new Date().toISOString(),
      reason: '审批流程被取消',
    });
  }

  /**
   * 处理订单任务通过
   */
  private async handleOrderTaskApproved(payload: CallbackPayload): Promise<void> {
    if (!payload.task) return;

    this.logger.log(`订单 ${payload.businessId} 的 ${payload.task.nodeName} 节点已通过，审批人: ${payload.task.assigneeName}`);

    // 记录审批历史
    await this.addOrderApprovalHistory(payload.businessId!, {
      nodeId: payload.task.nodeId,
      nodeName: payload.task.nodeName,
      approverId: payload.task.assigneeId,
      approverName: payload.task.assigneeName,
      result: 'APPROVED',
      comment: payload.task.comment,
      approvedAt: new Date().toISOString(),
    });

    // 如果是特定节点，执行特殊逻辑
    if (payload.task.nodeName === '财务审批') {
      await this.handleFinancialApproval(payload.businessId!);
    } else if (payload.task.nodeName === '总经理审批') {
      await this.handleManagerApproval(payload.businessId!);
    }
  }

  /**
   * 处理订单任务被拒绝
   */
  private async handleOrderTaskRejected(payload: CallbackPayload): Promise<void> {
    if (!payload.task) return;

    this.logger.log(`订单 ${payload.businessId} 的 ${payload.task.nodeName} 节点被拒绝，审批人: ${payload.task.assigneeName}`);

    // 记录审批历史
    await this.addOrderApprovalHistory(payload.businessId!, {
      nodeId: payload.task.nodeId,
      nodeName: payload.task.nodeName,
      approverId: payload.task.assigneeId,
      approverName: payload.task.assigneeName,
      result: 'REJECTED',
      comment: payload.task.comment,
      rejectedAt: new Date().toISOString(),
    });
  }

  /**
   * 更新订单状态
   */
  private async updateOrderStatus(
    orderId: string,
    status: string,
    extraData?: any,
  ): Promise<void> {
    // TODO: 实际项目中这里应该调用订单服务
    this.logger.log(`更新订单 ${orderId} 状态为: ${status}`, extraData);

    // 模拟调用订单服务
    // await this.orderService.updateStatus(orderId, status, extraData);
  }

  /**
   * 触发审批通过后的动作
   */
  private async triggerPostApprovalActions(orderId: string): Promise<void> {
    this.logger.log(`触发订单 ${orderId} 审批通过后的动作`);

    // 1. 发送通知给相关人员
    await this.sendOrderApprovalNotification(orderId);

    // 2. 更新库存（如果是采购订单）
    await this.updateInventoryForOrder(orderId);

    // 3. 触发生成相关单据
    await this.generateRelatedDocuments(orderId);

    // 4. 记录操作日志
    await this.logOrderAction(orderId, '审批通过，触发后续动作');
  }

  /**
   * 通知订单被拒绝
   */
  private async notifyOrderRejection(orderId: string): Promise<void> {
    this.logger.log(`通知订单 ${orderId} 被拒绝`);

    // TODO: 发送通知给订单创建人、相关业务人员
    // 可以集成消息中心、邮件、短信等
  }

  /**
   * 添加订单审批历史
   */
  private async addOrderApprovalHistory(
    orderId: string,
    history: any,
  ): Promise<void> {
    this.logger.log(`添加订单 ${orderId} 审批历史`, history);

    // TODO: 保存审批历史到订单服务
    // await this.orderService.addApprovalHistory(orderId, history);
  }

  /**
   * 处理财务审批
   */
  private async handleFinancialApproval(orderId: string): Promise<void> {
    this.logger.log(`处理订单 ${orderId} 的财务审批`);

    // 1. 检查订单金额
    // 2. 验证预算
    // 3. 更新财务状态
    // 4. 记录财务审批意见
  }

  /**
   * 处理总经理审批
   */
  private async handleManagerApproval(orderId: string): Promise<void> {
    this.logger.log(`处理订单 ${orderId} 的总经理审批`);

    // 1. 检查订单重要性
    // 2. 更新管理层审批状态
    // 3. 记录审批意见
  }

  /**
   * 发送订单审批通知
   */
  private async sendOrderApprovalNotification(orderId: string): Promise<void> {
    this.logger.log(`发送订单 ${orderId} 审批通过通知`);

    // TODO: 发送通知给相关人员
    // - 订单创建人
    // - 业务部门
    // - 财务部门（如果需要）
  }

  /**
   * 更新订单相关库存
   */
  private async updateInventoryForOrder(orderId: string): Promise<void> {
    this.logger.log(`更新订单 ${orderId} 相关库存`);

    // 只有采购订单才需要更新库存
    // TODO: 调用库存服务
  }

  /**
   * 生成相关单据
   */
  private async generateRelatedDocuments(orderId: string): Promise<void> {
    this.logger.log(`为订单 ${orderId} 生成相关单据`);

    // 根据订单类型生成不同的单据
    // - 采购订单：采购合同、入库单
    // - 销售订单：销售合同、出库单
    // - 费用申请：费用报销单
  }

  /**
   * 记录订单操作日志
   */
  private async logOrderAction(orderId: string, action: string): Promise<void> {
    this.logger.log(`记录订单 ${orderId} 操作: ${action}`);

    // TODO: 保存操作日志
    // await this.orderService.logAction(orderId, action);
  }
}

/**
 * 使用示例：
 *
 * 1. 在流程定义中配置回调
 * {
 *   "callbacks": [{
 *     "url": "http://order-service/api/orders/callback",
 *     "method": "POST",
 *     "conditions": [{
 *       "type": "status",
 *       "operator": "in",
 *       "value": ["COMPLETED", "REJECTED"]
 *     }]
 *   }]
 * }
 *
 * 2. 在业务服务中处理回调
 * @Injectable()
 * export class OrderService {
 *   constructor(private orderApprovalService: OrderApprovalService) {}
 *
 *   async handleWorkflowCallback(payload: CallbackPayload) {
 *     await this.orderApprovalService.handleOrderApprovalCallback(payload);
 *   }
 * }
 */