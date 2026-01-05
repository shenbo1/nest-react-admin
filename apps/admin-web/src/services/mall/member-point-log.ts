import request from '@/utils/request';

export type PointChangeType = 'EARN' | 'USE' | 'REFUND' | 'ADJUST';

export interface MemberPointLog {
  id: number;
  memberId: number;
  type: PointChangeType;
  points: number;
  beforePoints: number;
  afterPoints: number;
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
    points: number;
  };
}

export interface MemberPointLogQuery {
  page?: number;
  pageSize?: number;
  memberId?: number;
  type?: PointChangeType;
  startTime?: string;
  endTime?: string;
}

export interface CreateMemberPointLogDto {
  memberId: number;
  type: PointChangeType;
  points: number;
  orderId?: number;
  remark?: string;
}

export const memberPointLogApi = {
  /** 获取积分流水列表 */
  list(params?: MemberPointLogQuery) {
    return request.get<{ data: MemberPointLog[]; total: number }>(
      '/mall/member-point-log',
      { params },
    );
  },

  /** 获取会员的积分流水 */
  listByMember(memberId: number) {
    return request.get<MemberPointLog[]>(
      `/mall/member-point-log/member/${memberId}`,
    );
  },

  /** 调整会员积分 */
  adjust(data: CreateMemberPointLogDto) {
    return request.post<MemberPointLog>('/mall/member-point-log', data);
  },
};
