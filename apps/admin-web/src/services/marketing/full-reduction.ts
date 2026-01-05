import request from '@/utils/request';

// 满减规则项
export interface FullReductionRuleItem {
  minAmount: number;
  reduceAmount: number;
}

// 满减活动接口
export interface FullReductionActivity {
  id: number;
  name: string;
  code: string;
  rules: FullReductionRuleItem[];
  stackable: boolean;
  priority: number;
  exclusive: boolean;
  startTime: string;
  endTime: string;
  scopeType: 'ALL' | 'CATEGORY' | 'PRODUCT';
  scopeIds?: number[];
  memberLevelIds?: number[];
  limitPerMember: number;
  firstOrderOnly: boolean;
  status: 'NOT_STARTED' | 'RUNNING' | 'ENDED' | 'DISABLED';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建/更新表单
export interface FullReductionForm {
  name: string;
  code: string;
  rules: FullReductionRuleItem[];
  stackable?: boolean;
  priority?: number;
  exclusive?: boolean;
  startTime: string;
  endTime: string;
  scopeType: 'ALL' | 'CATEGORY' | 'PRODUCT';
  scopeIds?: number[];
  memberLevelIds?: number[];
  limitPerMember?: number;
  firstOrderOnly?: boolean;
  description?: string;
}

// 查询参数
export interface FullReductionQuery {
  name?: string;
  code?: string;
  status?: string;
  scopeType?: string;
  page?: number;
  pageSize?: number;
}

// API 方法
export const fullReductionApi = {
  // 获取列表
  list(params?: FullReductionQuery) {
    return request.get<{ data: FullReductionActivity[]; total: number }>(
      '/marketing/full-reduction',
      { params }
    );
  },

  // 获取详情
  get(id: number) {
    return request.get<FullReductionActivity>(`/marketing/full-reduction/${id}`);
  },

  // 创建
  create(data: FullReductionForm) {
    return request.post<FullReductionActivity>('/marketing/full-reduction', data);
  },

  // 更新
  update(id: number, data: Partial<FullReductionForm>) {
    return request.put<FullReductionActivity>(`/marketing/full-reduction/${id}`, data);
  },

  // 删除
  delete(id: number) {
    return request.delete(`/marketing/full-reduction/${id}`);
  },

  // 切换状态
  toggleStatus(id: number) {
    return request.put(`/marketing/full-reduction/${id}/toggle-status`);
  },
};
