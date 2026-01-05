import request from '@/utils/request';

// 支付状态
export type GroupBuyPayStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

// 拼团成员接口
export interface GroupBuyMember {
  id: number;
  groupOrderId: number;
  memberId: number;
  isLeader: boolean;
  orderId?: number;
  orderNo?: string;
  payStatus: GroupBuyPayStatus;
  payTime?: string;
  refundTime?: string;
  refundReason?: string;
  joinTime: string;
  createdAt: string;
  updatedAt: string;
  groupOrder?: {
    id: number;
    groupNo: string;
    status: string;
    requiredCount: number;
    currentCount: number;
    groupPrice: number;
  };
}

// 查询参数
export interface GroupBuyMemberQuery {
  groupOrderId?: number;
  memberId?: number;
  isLeader?: boolean;
  payStatus?: GroupBuyPayStatus;
  page?: number;
  pageSize?: number;
}

// 统计数据
export interface GroupBuyMemberStats {
  unpaid: number;
  paid: number;
  refunded: number;
  leaders: number;
  total: number;
}

// API 方法
export const groupBuyMemberApi = {
  // 获取列表
  list(params?: GroupBuyMemberQuery) {
    return request.get<{ data: GroupBuyMember[]; total: number }>(
      '/marketing/group-buy-member',
      { params }
    );
  },

  // 获取统计数据
  getStats() {
    return request.get<GroupBuyMemberStats>('/marketing/group-buy-member/stats');
  },

  // 获取详情
  get(id: number) {
    return request.get<GroupBuyMember>(`/marketing/group-buy-member/${id}`);
  },

  // 获取指定团单的成员
  getByOrder(groupOrderId: number) {
    return request.get<GroupBuyMember[]>(`/marketing/group-buy-member/by-order/${groupOrderId}`);
  },
};
