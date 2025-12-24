import request from '@/utils/request';

export interface Member {
  id: number;
  username: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  gender?: string;
  birthday?: string;
  level: number;
  points: number;
  balance?: number;
  totalAmount?: number;
  status: number;
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
  status?: number;
  phone?: string;
}

export interface MemberForm {
  username: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  gender?: string;
  birthday?: string;
  level?: number;
  points?: number;
  balance?: number;
  status?: number;
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
};
