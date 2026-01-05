import request from '@/utils/request';

// 促销活动类型
export type PromotionType = 'FLASH_SALE' | 'TIME_DISCOUNT' | 'GROUP_BUY';

// 促销活动状态
export type PromotionStatus = 'NOT_STARTED' | 'RUNNING' | 'ENDED' | 'DISABLED';

// 促销活动接口
export interface Promotion {
  id: number;
  name: string;
  code: string;
  type: PromotionType;
  startTime: string;
  endTime: string;
  status: PromotionStatus;
  description?: string;
  rules?: Record<string, any>;
  priority: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

// 创建/更新表单
export interface PromotionForm {
  name: string;
  code: string;
  type: PromotionType;
  startTime: string;
  endTime: string;
  status?: PromotionStatus;
  description?: string;
  rules?: Record<string, any>;
  priority?: number;
}

// 查询参数
export interface PromotionQuery {
  name?: string;
  code?: string;
  type?: PromotionType;
  status?: PromotionStatus;
  page?: number;
  pageSize?: number;
}

// API 方法
export const promotionApi = {
  // 获取列表
  list(params?: PromotionQuery) {
    return request.get<{ data: Promotion[]; total: number }>(
      '/marketing/promotion',
      { params }
    );
  },

  // 获取详情
  get(id: number) {
    return request.get<Promotion>(`/marketing/promotion/${id}`);
  },

  // 创建
  create(data: PromotionForm) {
    return request.post<Promotion>('/marketing/promotion', data);
  },

  // 更新
  update(id: number, data: Partial<PromotionForm>) {
    return request.put<Promotion>(`/marketing/promotion/${id}`, data);
  },

  // 删除
  delete(id: number) {
    return request.delete(`/marketing/promotion/${id}`);
  },

  // 切换状态
  toggleStatus(id: number) {
    return request.put(`/marketing/promotion/${id}/toggle-status`);
  },

  // 结束活动
  endPromotion(id: number) {
    return request.put(`/marketing/promotion/${id}/end`);
  },
};
