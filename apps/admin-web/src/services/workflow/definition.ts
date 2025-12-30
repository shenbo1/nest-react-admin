import request from '@/utils/request';

export interface FlowDefinition {
  id: number;
  code: string;
  name: string;
  categoryId?: number;
  category?: {
    id: number;
    code: string;
    name: string;
    color?: string;
  };
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'DISABLED';
  flowData?: any;
  formData?: any;
  businessTable?: string;
  description?: string;
  remark?: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 查询流程定义列表
 */
export function queryFlowDefinitionList(params: {
  page?: number;
  pageSize?: number;
  code?: string;
  name?: string;
  categoryId?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'DISABLED';
}) {
  return request.get('/workflow/definition', { params });
}

/**
 * 获取可用流程列表
 */
export function queryAvailableFlowDefinitions(categoryId?: number) {
  return request.get('/workflow/definition/available', {
    params: categoryId ? { categoryId } : {}
  });
}

/**
 * 查询流程定义详情
 */
export function getFlowDefinition(id: number) {
  return request.get(`/workflow/definition/${id}`);
}

/**
 * 创建流程定义
 */
export function createFlowDefinition(data: Partial<FlowDefinition>) {
  return request.post('/workflow/definition', data);
}

/**
 * 更新流程定义
 */
export function updateFlowDefinition(id: number, data: Partial<FlowDefinition>) {
  return request.put(`/workflow/definition/${id}`, data);
}

/**
 * 删除流程定义
 */
export function deleteFlowDefinition(id: number) {
  return request.delete(`/workflow/definition/${id}`);
}

/**
 * 发布流程
 */
export function publishFlowDefinition(id: number) {
  return request.post(`/workflow/definition/${id}/publish`);
}

/**
 * 停用流程
 */
export function disableFlowDefinition(id: number) {
  return request.post(`/workflow/definition/${id}/disable`);
}

/**
 * 保存节点配置
 */
export function saveNodeConfigs(id: number, nodeConfigs: any[]) {
  return request.post(`/workflow/definition/${id}/node-configs`, {
    nodeConfigs,
  });
}

/**
 * 创建新版本
 */
export function createNewVersion(id: number) {
  return request.post<FlowDefinition>(`/workflow/definition/${id}/new-version`);
}