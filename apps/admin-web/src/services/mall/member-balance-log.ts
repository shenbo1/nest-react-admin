import request from '@/utils/request';

export type BalanceChangeType = 'RECHARGE' | 'CONSUME' | 'REFUND' | 'ADJUST';

export interface MemberBalanceLog {
  id: number;
  memberId: number;
  type: BalanceChangeType;
  amount: number;
  beforeAmount: number;
  afterAmount: number;
  expireTime?: string;
  orderId?: number;
  remark?: string;
  createdAt: string;
  member?: {
    id: number;
    username: string;
    nickname?: string;
    phone?: string;
    avatar?: string;
    balance: number;
  };
}

export interface MemberBalanceLogQuery {
  page?: number;
  pageSize?: number;
  memberId?: number;
  type?: BalanceChangeType;
  startTime?: string;
  endTime?: string;
}

export interface CreateMemberBalanceLogDto {
  memberId: number;
  type: BalanceChangeType;
  amount: number;
  orderId?: number;
  remark?: string;
}

export const memberBalanceLogApi = {
  /** 获取余额流水列表 */
  list(params?: MemberBalanceLogQuery) {
    return request.get<{ data: MemberBalanceLog[]; total: number }>(
      '/mall/member-balance-log',
      { params },
    );
  },

  /** 获取会员的余额流水 */
  listByMember(memberId: number) {
    return request.get<MemberBalanceLog[]>(
      `/mall/member-balance-log/member/${memberId}`,
    );
  },

  /** 调整会员余额 */
  adjust(data: CreateMemberBalanceLogDto) {
    return request.post<MemberBalanceLog>('/mall/member-balance-log', data);
  },
};
