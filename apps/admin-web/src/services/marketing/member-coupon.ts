import request from '@/utils/request';

export interface MemberCoupon {
  id: number;
  memberId: number;
  templateId: number;
  couponCode: string;
  source: 'USER_CLAIM' | 'SYSTEM_GRANT' | 'REGISTER' | 'FIRST_ORDER' | 'ACTIVITY';
  sourceId?: string;
  grantBy?: string;
  status: 'UNUSED' | 'USED' | 'EXPIRED' | 'FROZEN';
  receiveTime: string;
  validStartTime?: string;
  validEndTime?: string;
  useTime?: string;
  orderId?: string;
  orderNo?: string;
  discountAmount?: number;
  template?: {
    id: number;
    name: string;
    type: string;
    value: number;
    minAmount?: number;
  };
  member?: {
    id: number;
    nickname: string;
    phone: string;
  };
}

export interface MemberCouponQuery {
  page?: number;
  pageSize?: number;
  memberId?: number;
  templateId?: number;
  status?: string;
}

export const memberCouponApi = {
  /** 获取用户优惠券列表 */
  list(params?: MemberCouponQuery) {
    return request.get<{ data: MemberCoupon[]; total: number }>(
      '/marketing/member-coupon',
      { params },
    );
  },

  /** 获取用户优惠券详情 */
  get(id: number) {
    return request.get<MemberCoupon>(`/marketing/member-coupon/${id}`);
  },

  /** 禁用优惠券 */
  disable(id: number) {
    return request.put(`/marketing/member-coupon/${id}/disable`);
  },

  /** 核销优惠券 */
  use(
    id: number,
    data: { orderId?: number; orderNo?: string; discountAmount?: number },
  ) {
    return request.put(`/marketing/member-coupon/${id}/use`, data);
  },
};
