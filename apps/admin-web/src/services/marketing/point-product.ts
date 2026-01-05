import request from '@/utils/request';

export interface PointProduct {
  id: number;
  name: string;
  code: string;
  image?: string;
  sort: number;
  points: number;
  price?: number;
  stock: number;
  exchangedCount: number;
  remainingStock: number;
  limitCount: number;
  startTime?: string;
  endTime?: string;
  productType: 'PHYSICAL' | 'VIRTUAL' | 'COUPON';
  relatedProductId?: number;
  relatedCouponId?: number;
  virtualContent?: string;
  status: 'ENABLED' | 'DISABLED';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PointProductQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  productType?: string;
  status?: string;
}

export interface PointProductForm {
  name: string;
  code: string;
  image?: string;
  sort?: number;
  points: number;
  price?: number;
  stock: number;
  limitCount?: number;
  startTime?: string;
  endTime?: string;
  productType: 'PHYSICAL' | 'VIRTUAL' | 'COUPON';
  relatedProductId?: number;
  relatedCouponId?: number;
  virtualContent?: string;
  status?: 'ENABLED' | 'DISABLED';
  description?: string;
}

export const pointProductApi = {
  /** 获取列表 */
  list(params?: PointProductQuery) {
    return request.get<{ data: PointProduct[]; total: number }>(
      '/marketing/point-product',
      { params },
    );
  },

  /** 获取详情 */
  get(id: number) {
    return request.get<PointProduct>(`/marketing/point-product/${id}`);
  },

  /** 创建 */
  create(data: PointProductForm) {
    return request.post<PointProduct>('/marketing/point-product', data);
  },

  /** 更新 */
  update(id: number, data: Partial<PointProductForm>) {
    return request.put<PointProduct>(`/marketing/point-product/${id}`, data);
  },

  /** 删除 */
  delete(id: number) {
    return request.delete(`/marketing/point-product/${id}`);
  },

  /** 切换状态 */
  toggleStatus(id: number) {
    return request.put(`/marketing/point-product/${id}/toggle-status`);
  },

  /** 下架 */
  offline(id: number) {
    return request.put(`/marketing/point-product/${id}/offline`);
  },
};
