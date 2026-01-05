import request from '@/utils/request';

export interface CouponTemplate {
  id: number;
  name: string;
  code: string;
  type: 'FULL_REDUCTION' | 'DISCOUNT' | 'NO_THRESHOLD';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  totalCount?: number;
  perLimitCount?: number;
  receiveStartTime?: string;
  receiveEndTime?: string;
  validType: 'DAYS' | 'FIXED';
  validStartTime?: string;
  validEndTime?: string;
  validDays?: number;
  scopeType?: 'ALL' | 'CATEGORY' | 'PRODUCT' | 'TAG';
  scopeIds?: string;
  stackable: boolean;
  status: 'ENABLED' | 'DISABLED';
  description?: string;
  distributedCount?: number;
  remainingCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponTemplateQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  type?: string;
  status?: string;
}

export interface CouponTemplateForm {
  name: string;
  type: 'FULL_REDUCTION' | 'DISCOUNT' | 'NO_THRESHOLD';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  totalCount?: number;
  perLimitCount?: number;
  receiveStartTime?: string;
  receiveEndTime?: string;
  validType: 'DAYS' | 'FIXED';
  validStartTime?: string;
  validEndTime?: string;
  validDays?: number;
  scopeType?: 'ALL' | 'CATEGORY' | 'PRODUCT' | 'TAG';
  scopeIds?: string;
  stackable?: boolean;
  status?: 'ENABLED' | 'DISABLED';
  description?: string;
}

export const couponTemplateApi = {
  /** 获取优惠券模板列表 */
  list(params?: CouponTemplateQuery) {
    return request.get<{ data: CouponTemplate[]; total: number }>(
      '/marketing/coupon-template',
      { params },
    );
  },

  /** 获取优惠券模板详情 */
  get(id: number) {
    return request.get<CouponTemplate>(`/marketing/coupon-template/${id}`);
  },

  /** 创建优惠券模板 */
  create(data: CouponTemplateForm) {
    return request.post<CouponTemplate>('/marketing/coupon-template', data);
  },

  /** 更新优惠券模板 */
  update(id: number, data: Partial<CouponTemplateForm>) {
    return request.put<CouponTemplate>(`/marketing/coupon-template/${id}`, data);
  },

  /** 删除优惠券模板 */
  delete(id: number) {
    return request.delete(`/marketing/coupon-template/${id}`);
  },

  /** 切换状态 */
  toggleStatus(id: number) {
    return request.put(`/marketing/coupon-template/${id}/toggle-status`);
  },

  /** 发放优惠券 */
  grant(id: number, data: { memberIds: number[]; grantBy?: string }) {
    return request.post(`/marketing/coupon-template/${id}/grant`, data);
  },
};
