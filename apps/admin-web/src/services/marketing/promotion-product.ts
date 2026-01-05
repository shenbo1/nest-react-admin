import request from '@/utils/request';

// 促销商品状态
export type PromotionProductStatus = 'ENABLED' | 'DISABLED';

// 促销商品接口
export interface PromotionProduct {
  id: number;
  promotionId: number;
  productId: number;
  skuId?: number;
  originalPrice: number;
  activityPrice: number;
  activityStock: number;
  soldCount: number;
  limitCount: number;
  sort: number;
  status: PromotionProductStatus;
  createdAt: string;
  updatedAt: string;
  remainingStock?: number;
  discountRate?: number;
  promotion?: {
    id: number;
    name: string;
    code: string;
    type: string;
    status: string;
  };
}

// 创建表单
export interface CreatePromotionProductForm {
  promotionId: number;
  productId: number;
  skuId?: number;
  originalPrice: number;
  activityPrice: number;
  activityStock: number;
  limitCount?: number;
  sort?: number;
  status?: PromotionProductStatus;
}

// 更新表单
export interface UpdatePromotionProductForm {
  originalPrice?: number;
  activityPrice?: number;
  activityStock?: number;
  limitCount?: number;
  sort?: number;
  status?: PromotionProductStatus;
}

// 查询参数
export interface PromotionProductQuery {
  promotionId?: number;
  productId?: number;
  status?: PromotionProductStatus;
  page?: number;
  pageSize?: number;
}

// 活动商品统计
export interface PromotionStats {
  totalProducts: number;
  enabledProducts: number;
  totalStock: number;
  totalSold: number;
  remainingStock: number;
  soldRate: number;
}

// API 方法
export const promotionProductApi = {
  // 获取列表
  list(params?: PromotionProductQuery) {
    return request.get<{ data: PromotionProduct[]; total: number }>(
      '/marketing/promotion-product',
      { params }
    );
  },

  // 获取详情
  get(id: number) {
    return request.get<PromotionProduct>(`/marketing/promotion-product/${id}`);
  },

  // 创建
  create(data: CreatePromotionProductForm) {
    return request.post<PromotionProduct>('/marketing/promotion-product', data);
  },

  // 批量创建
  batchCreate(promotionId: number, products: Omit<CreatePromotionProductForm, 'promotionId'>[]) {
    return request.post(`/marketing/promotion-product/batch/${promotionId}`, products);
  },

  // 更新
  update(id: number, data: UpdatePromotionProductForm) {
    return request.put<PromotionProduct>(`/marketing/promotion-product/${id}`, data);
  },

  // 删除
  delete(id: number) {
    return request.delete(`/marketing/promotion-product/${id}`);
  },

  // 切换状态
  toggleStatus(id: number) {
    return request.put(`/marketing/promotion-product/${id}/toggle-status`);
  },

  // 获取活动统计
  getStats(promotionId: number) {
    return request.get<PromotionStats>(`/marketing/promotion-product/stats/${promotionId}`);
  },
};
