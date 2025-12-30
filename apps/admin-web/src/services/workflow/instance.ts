import request from '@/utils/request';

// 流程实例状态
export type WfInstanceStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'TERMINATED';

// 流程实例
export interface FlowInstance {
  id: number;
  instanceNo: string;
  flowDefinitionId: number;
  flowDefinition?: {
    id: number;
    code: string;
    name: string;
    version: number;
  };
  title: string;
  status: WfInstanceStatus;
  initiatorId: number;
  initiator?: {
    id: number;
    name: string;
    account: string;
    deptId?: number;
    deptName?: string;
  };
  currentNodeId?: string;
  currentNodeName?: string;
  currentAssignees?: string; // 当前审批人（多人用逗号分隔）
  formData?: Record<string, unknown>;
  businessId?: string;
  businessNo?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

// 任务
export interface Task {
  id: number;
  taskNo: string;
  flowInstanceId: number;
  nodeId: string;
  nodeName: string;
  nodeType: 'START' | 'APPROVAL' | 'CC' | 'CONDITION' | 'END';
  assigneeId: number;
  assignee?: {
    id: number;
    name: string;
    account: string;
  };
  status: 'PENDING' | 'COMPLETED';
  result?: 'APPROVED' | 'REJECTED' | 'TRANSFERRED' | 'COUNTERSIGNED';
  comment?: string;
  formDataSnapshot?: Record<string, unknown>;
  dueTime?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 启动流程参数
export interface StartFlowParams {
  flowDefinitionId: number;
  title: string;
  formData?: Record<string, unknown>;
  businessId?: string;
  businessNo?: string;
  remark?: string;
}

/**
 * 查询流程实例列表
 */
export function queryFlowInstances(params: {
  page?: number;
  pageSize?: number;
  instanceNo?: string;
  title?: string;
  flowDefinitionId?: number;
  status?: WfInstanceStatus;
  initiatorId?: number;
  businessId?: string;
}) {
  return request.get<{
    list: FlowInstance[];
    total: number;
    page: number;
    pageSize: number;
  }>('/workflow/instance', { params });
}

/**
 * 查询我发起的流程
 */
export function queryMyInitiatedFlows(params: {
  page?: number;
  pageSize?: number;
  status?: WfInstanceStatus;
}) {
  return request.get<{
    list: FlowInstance[];
    total: number;
    page: number;
    pageSize: number;
  }>('/workflow/instance/my-initiated', { params });
}

/**
 * 查询流程实例详情
 */
export function getFlowInstance(id: number) {
  return request.get<FlowInstance>(`/workflow/instance/${id}`);
}

/**
 * 启动流程
 */
export function startFlow(data: StartFlowParams) {
  return request.post<FlowInstance>('/workflow/instance/start', data);
}

/**
 * 取消流程
 */
export function cancelFlow(id: number, reason?: string) {
  return request.post(`/workflow/instance/${id}/cancel`, { reason });
}

/**
 * 终止流程
 */
export function terminateFlow(id: number, reason?: string) {
  return request.post(`/workflow/instance/${id}/terminate`, { reason });
}

/**
 * 获取流程进度（节点列表）
 */
export function getFlowProgress(id: number) {
  return request.get<Array<{
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
      assigneeId: number;
      assigneeName: string;
      status: string;
      result?: string;
      comment?: string;
      completedAt?: string;
    }>;
  }>>(`/workflow/instance/${id}/progress`);
}
