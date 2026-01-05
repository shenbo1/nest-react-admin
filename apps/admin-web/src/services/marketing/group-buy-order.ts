import request from '@/utils/request';

// 拼团订单状态
export type GroupBuyOrderStatus = 'WAITING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

// 拼团成员简要信息
export interface GroupBuyMemberBrief {
  id: number;
  memberId: number;
  isLeader: boolean;
  payStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
}

// 拼团订单接口
export interface GroupBuyOrder {
  id: number;
  groupNo: string;
  promotionId: number;
  promotionProductId: number;
  productId: number;
  skuId?: number;
  leaderId: number;
  requiredCount: number;
  currentCount: number;
  groupPrice: number;
  status: GroupBuyOrderStatus;
  startTime: string;
  expireTime: string;
  successTime?: string;
  failReason?: string;
  createdAt: string;
  updatedAt: string;
  remainingTime?: number;
  progress?: number;
  paidCount?: number;
  promotion?: {
    id: number;
    name: string;
    code: string;
  };
  members?: GroupBuyMemberBrief[];
}

// 查询参数
export interface GroupBuyOrderQuery {
  groupNo?: string;
  promotionId?: number;
  productId?: number;
  leaderId?: number;
  status?: GroupBuyOrderStatus;
  page?: number;
  pageSize?: number;
}

// 统计数据
export interface GroupBuyOrderStats {
  waiting: number;
  success: number;
  failed: number;
  cancelled: number;
  total: number;
}

// API 方法
export const groupBuyOrderApi = {
  // 获取列表
  list(params?: GroupBuyOrderQuery) {
    return request.get<{ data: GroupBuyOrder[]; total: number }>(
      '/marketing/group-buy-order',
      { params }
    );
  },

  // 获取统计数据
  getStats() {
    return request.get<GroupBuyOrderStats>('/marketing/group-buy-order/stats');
  },

  // 获取详情
  get(id: number) {
    return request.get<GroupBuyOrder>(`/marketing/group-buy-order/${id}`);
  },

  // 取消拼团
  cancel(id: number) {
    return request.put<GroupBuyOrder>(`/marketing/group-buy-order/${id}/cancel`);
  },

  // 手动成团
  manualFinish(id: number) {
    return request.put<GroupBuyOrder>(`/marketing/group-buy-order/${id}/manual-finish`);
  },
};
