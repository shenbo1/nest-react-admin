import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/common/prisma/prisma.service';
import { GetFlowProgressQuery } from '../../../queries/instance/get-flow-progress.query';
import { WfTaskStatus, WfTaskResult } from '@prisma/client';

interface FlowProgressNode {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED';
  assigneeId?: number;
  assigneeName?: string;
  result?: string;
  comment?: string;
  startTime?: string;
  endTime?: string;
  tasks?: Array<{
    id: number;
    taskNo: string;
    assigneeId?: number | null;
    assigneeName?: string | null;
    status: string;
    result?: string | null;
    comment?: string | null;
    completedAt?: string;
  }>;
}

/**
 * 获取流程进度查询处理器
 */
@QueryHandler(GetFlowProgressQuery)
export class GetFlowProgressHandler
  implements IQueryHandler<GetFlowProgressQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetFlowProgressQuery): Promise<FlowProgressNode[]> {
    const { instanceId } = query;

    // 获取流程实例
    const instance = await this.prisma.wfFlowInstance.findUnique({
      where: { id: instanceId },
      include: {
        flowDefinition: true,
        tasks: {
          where: { deleted: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!instance) {
      throw new Error('流程实例不存在');
    }

    const flowData = instance.flowDefinition.flowData as any;
    const nodes = flowData?.nodes || [];
    const edges = flowData?.edges || [];

    // 按流程执行顺序排序节点（拓扑排序）
    const sortedNodes = this.topologicalSort(nodes, edges);

    // 构建节点进度信息
    const progressNodes: FlowProgressNode[] = [];
    const nodeTaskMap = new Map<string, typeof instance.tasks>();

    // 按节点ID分组任务
    instance.tasks.forEach((task) => {
      if (!nodeTaskMap.has(task.nodeId)) {
        nodeTaskMap.set(task.nodeId, []);
      }
      nodeTaskMap.get(task.nodeId)!.push(task);
    });

    // 获取当前节点ID列表（JSON数组）
    const currentNodeIds = (instance.currentNodeIds as string[] | null) || [];

    // 遍历排序后的节点，构建进度信息
    for (const node of sortedNodes) {
      const tasks = nodeTaskMap.get(node.id) || [];
      // 获取节点类型（兼容 type 和 data.nodeType 两种格式）
      const nodeType = node.data?.nodeType || node.type;
      let status: FlowProgressNode['status'] = 'PENDING';
      let assigneeId: number | undefined;
      let assigneeName: string | undefined;
      let result: string | undefined;
      let comment: string | undefined;
      let startTime: string | undefined;
      let endTime: string | undefined;

      // 开始节点：流程已发起则视为已完成
      if (nodeType === 'START') {
        status = 'COMPLETED';
        startTime = instance.startTime?.toISOString();
        endTime = instance.startTime?.toISOString();
      } else if (nodeType === 'END') {
        // 结束节点：流程已结束则视为已完成
        if (instance.status === 'COMPLETED') {
          status = 'COMPLETED';
          startTime = instance.endTime?.toISOString();
          endTime = instance.endTime?.toISOString();
        } else if (instance.status === 'RUNNING') {
          status = 'PENDING';
        }
      } else if (tasks.length > 0) {
        // 有任务记录
        const pendingTasks = tasks.filter(t => t.status === WfTaskStatus.PENDING);
        const completedTasks = tasks.filter(t => t.status === WfTaskStatus.COMPLETED);

        if (pendingTasks.length > 0) {
          // 有待处理任务
          status = 'RUNNING';
          assigneeId = pendingTasks[0].assigneeId ?? undefined;
          assigneeName = pendingTasks[0].assigneeName || undefined;
          startTime = pendingTasks[0].createdAt.toISOString();
        } else if (completedTasks.length > 0) {
          // 已完成
          status = 'COMPLETED';
          const lastCompleted = completedTasks[completedTasks.length - 1];
          result = lastCompleted.result || undefined;
          comment = lastCompleted.comment || undefined;
          startTime = tasks[0].createdAt.toISOString();
          endTime = lastCompleted.completedTime?.toISOString();
        }
      } else if (currentNodeIds.includes(node.id)) {
        // 当前正在运行的节点，但没有任务（可能是空审批人跳过）
        status = 'RUNNING';
      }

      // 检查是否是已跳过的节点
      if (status === 'PENDING' && this.isNodeSkipped(node.id, instance, edges)) {
        status = 'SKIPPED';
      }

      progressNodes.push({
        nodeId: node.id,
        nodeName: node.data?.label || node.name || '未命名节点',
        nodeType: node.type,
        status,
        assigneeId,
        assigneeName,
        result,
        comment,
        startTime,
        endTime,
        tasks: tasks.map(t => ({
          id: t.id,
          taskNo: t.taskNo,
          assigneeId: t.assigneeId,
          assigneeName: t.assigneeName,
          status: t.status,
          result: t.result,
          comment: t.comment,
          completedAt: t.completedTime?.toISOString(),
        })),
      });
    }

    return progressNodes;
  }

  /**
   * 判断节点是否被跳过
   */
  private isNodeSkipped(
    nodeId: string,
    instance: any,
    edges: any[],
  ): boolean {
    // 简化实现：检查是否有从该节点出发的路径被走过
    // 实际实现可能需要更复杂的图算法
    const outEdges = edges.filter(e => e.source === nodeId);

    for (const edge of outEdges) {
      const targetTasks = instance.tasks.filter(
        (t: any) => t.nodeId === edge.target && t.status !== 'PENDING',
      );
      if (targetTasks.length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * 拓扑排序：按流程执行顺序排列节点
   * 从开始节点出发，按边的连接关系排序
   */
  private topologicalSort(nodes: any[], edges: any[]): any[] {
    if (!nodes.length) return [];

    // 构建邻接表和入度表
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const nodeMap = new Map<string, any>();

    // 初始化
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
      adjacencyList.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // 构建邻接表和计算入度
    edges.forEach(edge => {
      const source = edge.source;
      const target = edge.target;
      if (adjacencyList.has(source) && nodeMap.has(target)) {
        adjacencyList.get(source)!.push(target);
        inDegree.set(target, (inDegree.get(target) || 0) + 1);
      }
    });

    // 找到开始节点（入度为0且类型为START，或入度为0的第一个节点）
    const queue: string[] = [];
    const startNode = nodes.find(n =>
      (n.data?.nodeType === 'START' || n.type === 'START')
    );

    if (startNode) {
      queue.push(startNode.id);
    } else {
      // 如果没有明确的开始节点，找入度为0的节点
      nodes.forEach(node => {
        if (inDegree.get(node.id) === 0) {
          queue.push(node.id);
        }
      });
    }

    // BFS 拓扑排序
    const result: any[] = [];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (node) {
        result.push(node);
      }

      // 遍历邻接节点
      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const newInDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newInDegree);
        if (newInDegree === 0 && !visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    // 如果有节点未被访问（可能存在环或孤立节点），按原顺序添加
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        result.push(node);
      }
    });

    return result;
  }
}
