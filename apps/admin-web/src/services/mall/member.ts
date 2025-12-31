import request from '@/utils/request';

export interface Member {
  id: number;
  username: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthday?: string;
  memberLevelId?: number;
  points: number;
  balance?: number;
  totalAmount?: number;
  status: 'ENABLED' | 'DISABLED';
  lastLoginTime?: string;
  lastLoginIp?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberQuery {
  page?: number;
  pageSize?: number;
  username?: string;
  status?: 'ENABLED' | 'DISABLED';
  phone?: string;
}

export interface MemberForm {
  username: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthday?: string;
  memberLevelId?: number;
  points?: number;
  balance?: number;
  status?: 'ENABLED' | 'DISABLED';
  remark?: string;
}

export const memberApi = {
  /** 获取会员管理列表 */
  list(params?: MemberQuery) {
    return request.get<{ list: Member[]; total: number }>('/mall/member', { params });
  },

  /** 获取会员管理详情 */
  get(id: number) {
    return request.get<Member>(`/mall/member/${id}`);
  },

  /** 创建会员管理 */
  create(data: MemberForm) {
    return request.post<Member>('/mall/member', data);
  },

  /** 更新会员管理 */
  update(id: number, data: Partial<MemberForm>) {
    return request.put<Member>(`/mall/member/${id}`, data);
  },

  /** 删除会员管理 */
  delete(id: number) {
    return request.delete(`/mall/member/${id}`);
  },

  /** 批量删除会员 */
  batchDelete(ids: number[]) {
    return request.delete('/mall/member/batch', { data: { ids } });
  },

  /** 切换会员状态 */
  toggleStatus(id: number) {
    return request.put<Member>(`/mall/member/${id}/status`);
  },
};
