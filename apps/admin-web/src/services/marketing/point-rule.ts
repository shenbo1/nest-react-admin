import request from '@/utils/request';

export interface PointRule {
  id: number;
  code: string;
  name: string;
  type: 'SIGN_IN' | 'CONSUME' | 'REGISTER' | 'FIRST_ORDER' | 'BIRTHDAY';
  points: number;
  consumeUnit?: number;
  extraRules?: any;
  dailyLimit: number;
  totalLimit: number;
  validDays: number;
  startTime?: string;
  endTime?: string;
  status: 'ENABLED' | 'DISABLED';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PointRuleQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  type?: string;
  status?: string;
}

export interface PointRuleForm {
  code: string;
  name: string;
  type: 'SIGN_IN' | 'CONSUME' | 'REGISTER' | 'FIRST_ORDER' | 'BIRTHDAY';
  points: number;
  consumeUnit?: number;
  extraRules?: string;
  dailyLimit?: number;
  totalLimit?: number;
  validDays?: number;
  startTime?: string;
  endTime?: string;
  status?: 'ENABLED' | 'DISABLED';
  description?: string;
}

export const pointRuleApi = {
  /** 获取列表 */
  list(params?: PointRuleQuery) {
    return request.get<{ data: PointRule[]; total: number }>(
      '/marketing/point-rule',
      { params },
    );
  },

  /** 获取详情 */
  get(id: number) {
    return request.get<PointRule>(`/marketing/point-rule/${id}`);
  },

  /** 创建 */
  create(data: PointRuleForm) {
    return request.post<PointRule>('/marketing/point-rule', data);
  },

  /** 更新 */
  update(id: number, data: Partial<PointRuleForm>) {
    return request.put<PointRule>(`/marketing/point-rule/${id}`, data);
  },

  /** 删除 */
  delete(id: number) {
    return request.delete(`/marketing/point-rule/${id}`);
  },

  /** 切换状态 */
  toggleStatus(id: number) {
    return request.put(`/marketing/point-rule/${id}/toggle-status`);
  },
};
