import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  WfNodeType,
  WfInstanceStatus,
  WfTaskStatus,
  WfApprovalType,
  Prisma,
} from '@prisma/client';
import { WfEmptyAssigneeAction, AssigneeInfo } from '../types';
import { AssigneeResolverService } from './assignee-resolver.service';
import { ConditionEvaluatorService } from './condition-evaluator.service';
import { FlowData, FlowNode, FlowEdge } from '../types';

@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assigneeResolver: AssigneeResolverService,
    private readonly conditionEvaluator: ConditionEvaluatorService,
  ) {}

  /**
   * 生成任务编号
   */
  private generateTaskNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TK${dateStr}${random}`;
  }

  /**
   * 获取节点的业务类型（兼容 type 和 data.nodeType 两种格式）
   */
  private getNodeType(node: FlowNode): string {
    // 优先使用 data.nodeType（前端设计器保存的格式）
    const dataNodeType = (node as any).data?.nodeType;
    if (dataNodeType) {
      return dataNodeType;
    }
    // 回退到 type 字段
    return node.type;
  }

  /**
   * 启动流程
   */
  async startFlow(instanceId: number, formData: Record<string, unknown>) {
    const instance = await this.prisma.wfFlowInstance.findUnique({
      where: { id: instanceId },
      include: {
        flowDefinition: {
          include: { nodeConfigs: { where: { deleted: false } } },
        },
      },
    });

    if (!instance) {
      throw new Error(`流程实例 #${instanceId} 不存在`);
    }

    const flowData = instance.flowDefinition.flowData as unknown as FlowData;
    if (!flowData?.nodes?.length) {
      throw new Error('流程图数据无效');
    }

    // 找到开始节点
    const startNode = flowData.nodes.find(
      (n) => this.getNodeType(n) === 'START',
    );
    if (!startNode) {
      throw new Error('流程缺少开始节点');
    }

    // 找到开始节点的下一个节点
    const nextNodes = this.getNextNodes(flowData, startNode.id);
    if (nextNodes.length === 0) {
      throw new Error('开始节点没有后续节点');
    }

    // 推进到下一个节点
    await this.executeNodes(instance.id, nextNodes, flowData, formData);
  }

  /**
   * 推进流程
   */
  async advanceFlow(
    instanceId: number,
    currentNodeId: string,
    result: 'APPROVED' | 'REJECTED',
  ) {
    if (result === 'REJECTED') {
      // 驳回已在 task.service 中处理
      return;
    }

    const instance = await this.prisma.wfFlowInstance.findUnique({
      where: { id: instanceId },
      include: {
        flowDefinition: {
          include: { nodeConfigs: { where: { deleted: false } } },
        },
        tasks: { where: { deleted: false } },
      },
    });

    if (!instance || instance.status !== WfInstanceStatus.RUNNING) {
      return;
    }

    const flowData = instance.flowDefinition.flowData as unknown as FlowData;
    const nodeConfig = instance.flowDefinition.nodeConfigs.find(
      (c) => c.nodeId === currentNodeId,
    );

    // 检查会签是否完成
    if (nodeConfig?.approvalType === WfApprovalType.AND_SIGN) {
      const pendingCount = instance.tasks.filter(
        (t) => t.nodeId === currentNodeId && t.status === WfTaskStatus.PENDING,
      ).length;

      if (pendingCount > 0) {
        // 还有待处理的会签任务，不推进
        this.logger.log(`节点 ${currentNodeId} 会签未完成，剩余 ${pendingCount} 个任务`);
        return;
      }
    }

    // 获取下一个节点
    const nextNodes = this.getNextNodes(flowData, currentNodeId);

    if (nextNodes.length === 0) {
      this.logger.warn(`节点 ${currentNodeId} 没有后续节点`);
      return;
    }

    // 执行下一个节点
    const formData = (instance.formDataSnapshot || {}) as Record<string, unknown>;
    await this.executeNodes(instanceId, nextNodes, flowData, formData);
  }

  /**
   * 获取下一个节点
   */
  private getNextNodes(flowData: FlowData, nodeId: string): FlowNode[] {
    const outEdges = flowData.edges.filter((e) => e.source === nodeId);
    return outEdges
      .map((e) => flowData.nodes.find((n) => n.id === e.target))
      .filter((n): n is FlowNode => n !== undefined);
  }

  /**
   * 执行节点
   */
  private async executeNodes(
    instanceId: number,
    nodes: FlowNode[],
    flowData: FlowData,
    formData: Record<string, unknown>,
  ) {
    for (const node of nodes) {
      await this.executeNode(instanceId, node, flowData, formData);
    }
  }

  /**
   * 执行单个节点
   */
  private async executeNode(
    instanceId: number,
    node: FlowNode,
    flowData: FlowData,
    formData: Record<string, unknown>,
  ) {
    const nodeType = this.getNodeType(node);
    this.logger.log(`执行节点: ${node.id} (${nodeType})`);

    switch (nodeType) {
      case 'END':
        await this.handleEndNode(instanceId);
        break;

      case 'APPROVAL':
        await this.handleApprovalNode(instanceId, node, flowData, formData);
        break;

      case 'CONDITION':
        await this.handleConditionNode(instanceId, node, flowData, formData);
        break;

      case 'PARALLEL':
        await this.handleParallelNode(instanceId, node, flowData, formData);
        break;

      case 'JOIN':
        await this.handleJoinNode(instanceId, node, flowData, formData);
        break;

      default:
        this.logger.warn(`未知节点类型: ${nodeType}`);
    }
  }

  /**
   * 处理结束节点
   */
  private async handleEndNode(instanceId: number) {
    const now = new Date();
    const instance = await this.prisma.wfFlowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) return;

    const duration = Math.floor(
      (now.getTime() - instance.startTime.getTime()) / 1000,
    );

    await this.prisma.wfFlowInstance.update({
      where: { id: instanceId },
      data: {
        status: WfInstanceStatus.COMPLETED,
        endTime: now,
        duration,
        currentNodeIds: [],
      },
    });

    this.logger.log(`流程 #${instanceId} 完成`);
  }

  /**
   * 处理审批节点
   */
  private async handleApprovalNode(
    instanceId: number,
    node: FlowNode,
    flowData: FlowData,
    formData: Record<string, unknown>,
  ) {
    const instance = await this.prisma.wfFlowInstance.findUnique({
      where: { id: instanceId },
      include: {
        flowDefinition: {
          include: { nodeConfigs: { where: { deleted: false } } },
        },
      },
    });

    if (!instance) return;

    const nodeConfig = instance.flowDefinition.nodeConfigs.find(
      (c) => c.nodeId === node.id,
    );

    // 解析审批人
    const assignees = await this.assigneeResolver.resolve(
      nodeConfig,
      instance.initiatorId,
      instance.initiatorDeptId,
      formData,
    );

    if (assignees.length === 0) {
      // 处理审批人为空的情况
      await this.assigneeResolver.handleEmptyAssignee(
        instanceId,
        node,
        nodeConfig,
      );

      // 如果是 SKIP 策略，自动推进到下一个节点
      const emptyAction = nodeConfig?.emptyAssigneeAction;
      if (emptyAction === WfEmptyAssigneeAction.SKIP) {
        const nextNodes = this.getNextNodes(flowData, node.id);
        if (nextNodes.length > 0) {
          await this.executeNodes(instanceId, nextNodes, flowData, formData);
        }
      }
      return;
    }

    // 计算超时时间
    let dueTime: Date | undefined;
    if (nodeConfig?.timeLimit) {
      dueTime = new Date(Date.now() + nodeConfig.timeLimit * 60 * 60 * 1000);
    }

    // 创建审批任务
    const tasks = await Promise.all(
      assignees.map((assignee) =>
        this.prisma.wfTask.create({
          data: {
            taskNo: this.generateTaskNo(),
            flowInstanceId: instanceId,
            nodeId: node.id,
            nodeName: nodeConfig?.nodeName || node.data.label,
            nodeType: WfNodeType.APPROVAL,
            status: WfTaskStatus.PENDING,
            assigneeId: assignee.id,
            assigneeName: assignee.name,
            assigneeDeptId: assignee.deptId,
            assigneeDeptName: assignee.deptName,
            dueTime,
          },
        }),
      ),
    );

    // 更新当前节点
    await this.prisma.wfFlowInstance.update({
      where: { id: instanceId },
      data: { currentNodeIds: [node.id] },
    });

    // 处理抄送
    const ccConfig = nodeConfig?.ccConfig as { enable?: boolean } | undefined;
    if (ccConfig?.enable) {
      await this.handleCc(instance, node, nodeConfig);
    }

    this.logger.log(
      `创建了 ${tasks.length} 个审批任务，节点: ${node.id}`,
    );
  }

  /**
   * 处理抄送
   */
  async handleCc(instance: any, node: FlowNode, nodeConfig: any) {
    const ccConfig = nodeConfig.ccConfig;
    if (!ccConfig?.enable) return;

    let ccUsers: AssigneeInfo[] = [];

    // 使用公共的 resolve 方法
    const ccNodeConfig = {
      assigneeType: ccConfig.type === 'SPECIFIC_USER' ? 'SPECIFIC_USER' : 'ROLE',
      assigneeConfig: {
        userIds: ccConfig.userIds || [],
        roleIds: ccConfig.roleIds || [],
      },
    } as any;

    ccUsers = await this.assigneeResolver.resolve(
      ccNodeConfig,
      instance.initiatorId,
      instance.initiatorDeptId,
      {},
    );

    if (ccUsers.length === 0) return;

    // 获取当前节点的任务信息
    const currentTask = await this.prisma.wfTask.findFirst({
      where: {
        flowInstanceId: instance.id,
        nodeId: node.id,
        deleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 创建抄送记录
    await this.prisma.wfCopyRecord.createMany({
      data: ccUsers.map((user) => ({
        flowInstanceId: instance.id,
        taskId: currentTask?.id,
        userId: user.id,
        userName: user.name,
      })),
    });

    this.logger.log(`为节点 ${node.id} 创建了 ${ccUsers.length} 个抄送记录`);
  }

  /**
   * 处理条件节点
   */
  private async handleConditionNode(
    instanceId: number,
    node: FlowNode,
    flowData: FlowData,
    formData: Record<string, unknown>,
  ) {
    const instance = await this.prisma.wfFlowInstance.findUnique({
      where: { id: instanceId },
      include: {
        flowDefinition: {
          include: { nodeConfigs: { where: { deleted: false } } },
        },
      },
    });

    if (!instance) return;

    // 获取条件边
    const outEdges = flowData.edges.filter((e) => e.source === node.id);

    // 评估每个分支的条件
    let matchedEdge: FlowEdge | undefined;
    for (const edge of outEdges) {
      const condition = edge.data?.condition;
      if (!condition) {
        // 无条件的边作为默认分支
        if (!matchedEdge) {
          matchedEdge = edge;
        }
        continue;
      }

      if (this.conditionEvaluator.evaluate(condition, formData)) {
        matchedEdge = edge;
        break;
      }
    }

    if (!matchedEdge) {
      this.logger.warn(`条件节点 ${node.id} 没有匹配的分支`);
      return;
    }

    // 推进到匹配的分支
    const nextNode = flowData.nodes.find((n) => n.id === matchedEdge!.target);
    if (nextNode) {
      await this.executeNode(instanceId, nextNode, flowData, formData);
    }
  }

  /**
   * 处理并行网关
   */
  private async handleParallelNode(
    instanceId: number,
    node: FlowNode,
    flowData: FlowData,
    formData: Record<string, unknown>,
  ) {
    const nextNodes = this.getNextNodes(flowData, node.id);

    // 记录并行分支数
    const instance = await this.prisma.wfFlowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) return;

    const variables = (instance.variables || {}) as Record<string, unknown>;
    variables[`parallel_${node.id}_total`] = nextNodes.length;
    variables[`parallel_${node.id}_completed`] = 0;

    await this.prisma.wfFlowInstance.update({
      where: { id: instanceId },
      data: { variables: variables as Prisma.InputJsonValue },
    });

    // 并行执行所有分支
    await this.executeNodes(instanceId, nextNodes, flowData, formData);
  }

  /**
   * 处理汇聚网关
   */
  private async handleJoinNode(
    instanceId: number,
    node: FlowNode,
    flowData: FlowData,
    formData: Record<string, unknown>,
  ) {
    // 查找对应的并行网关
    const inEdges = flowData.edges.filter((e) => e.target === node.id);

    const instance = await this.prisma.wfFlowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) return;

    const variables = (instance.variables || {}) as Record<string, unknown>;

    // 简化实现：检查所有进入边的节点是否都已完成
    // 实际实现需要更复杂的逻辑来追踪并行分支

    // 推进到下一个节点
    const nextNodes = this.getNextNodes(flowData, node.id);
    await this.executeNodes(instanceId, nextNodes, flowData, formData);
  }
}
