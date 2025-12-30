import request from '@/utils/request';

// 任务状态
export type WfTaskStatus = 'PENDING' | 'COMPLETED';

// 任务结果
export type WfTaskResult = 'APPROVED' | 'REJECTED' | 'TRANSFERRED' | 'COUNTERSIGNED';

// 任务
export interface Task {
  id: number;
  taskNo: string;
  flowInstanceId: number;
  flowInstance?: {
    id: number;
    instanceNo: string;
    title: string;
    status: string;
    flowDefinition?: {
      id: number;
      code: string;
      name: string;
    };
    initiator?: {
      id: number;
      name: string;
    };
  };
  nodeId: string;
  nodeName: string;
  nodeType: 'START' | 'APPROVAL' | 'CC' | 'CONDITION' | 'END';
  assigneeId: number;
  assigneeName?: string;
  assignee?: {
    id: number;
    name: string;
    account: string;
  };
  status: WfTaskStatus;
  result?: WfTaskResult;
  comment?: string;
  formDataSnapshot?: Record<string, unknown>;
  formDataEditable?: Record<string, unknown>;
  dueTime?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 审批任务参数
export interface ApproveTaskParams {
  comment?: string;
  formData?: Record<string, unknown>;
}

// 驳回任务参数
export interface RejectTaskParams {
  comment?: string;
}

// 转办任务参数
export interface TransferTaskParams {
  targetUserId: number;
  comment?: string;
}

// 加签任务参数
export interface CountersignParams {
  userIds: number[];
  comment?: string;
}

/**
 * 查询待办任务列表
 */
export function queryPendingTasks(params: {
  page?: number;
  pageSize?: number;
  taskNo?: string;
  nodeName?: string;
  flowInstanceId?: number;
}) {
  return request.get<{
    list: Task[];
    total: number;
    page: number;
    pageSize: number;
  }>('/workflow/task/pending', { params });
}

/**
 * 查询已办任务列表
 */
export function queryCompletedTasks(params: {
  page?: number;
  pageSize?: number;
  taskNo?: string;
  nodeName?: string;
  flowInstanceId?: number;
  result?: WfTaskResult;
}) {
  return request.get<{
    list: Task[];
    total: number;
    page: number;
    pageSize: number;
  }>('/workflow/task/completed', { params });
}

/**
 * 查询任务详情
 */
export function getTask(id: number) {
  return request.get<Task>(`/workflow/task/${id}`);
}

/**
 * 查询任务历史
 */
export function getTaskHistory(flowInstanceId: number) {
  return request.get<{
    nodes: Array<{
      nodeId: string;
      nodeName: string;
      nodeType: string;
      status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED';
      tasks: Task[];
    }>;
  }>(`/workflow/task/history/${flowInstanceId}`);
}

/**
 * 审批通过
 */
export function approveTask(id: number, data?: ApproveTaskParams) {
  return request.post<Task>(`/workflow/task/${id}/approve`, data);
}

/**
 * 审批驳回
 */
export function rejectTask(id: number, data?: RejectTaskParams) {
  return request.post<Task>(`/workflow/task/${id}/reject`, data);
}

/**
 * 转办任务
 */
export function transferTask(id: number, data: TransferTaskParams) {
  return request.post<Task>(`/workflow/task/${id}/transfer`, data);
}

/**
 * 加签任务
 */
export function countersignTask(id: number, data: CountersignParams) {
  return request.post<Task>(`/workflow/task/${id}/countersign`, data);
}

/**
 * 催办任务
 */
export function urgeTask(id: number, comment?: string) {
  return request.post(`/workflow/task/${id}/urge`, { comment });
}

/**
 * 获取任务可编辑字段
 */
export function getTaskEditableFields(id: number) {
  return request.get<Record<string, unknown>>(`/workflow/task/${id}/editable-fields`);
}
