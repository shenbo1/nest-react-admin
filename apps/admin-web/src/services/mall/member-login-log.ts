import request from '@/utils/request';

export interface MemberLoginLog {
  id: number;
  memberId: number;
  ipaddr?: string;
  loginLocation?: string;
  browser?: string;
  os?: string;
  status: string;
  msg?: string;
  loginTime: string;
  createdAt: string;
  member?: {
    id: number;
    username: string;
    nickname?: string;
    phone?: string;
    avatar?: string;
  };
}

export interface MemberLoginLogQuery {
  page?: number;
  pageSize?: number;
  memberId?: number;
  ipaddr?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
}

export const memberLoginLogApi = {
  /** 获取登录日志列表 */
  list(params?: MemberLoginLogQuery) {
    return request.get<{ data: MemberLoginLog[]; total: number }>(
      '/mall/member-login-log',
      { params },
    );
  },

  /** 获取会员的登录日志 */
  listByMember(memberId: number) {
    return request.get<MemberLoginLog[]>(
      `/mall/member-login-log/member/${memberId}`,
    );
  },

  /** 删除登录日志 */
  delete(id: number) {
    return request.delete(`/mall/member-login-log/${id}`);
  },

  /** 批量删除登录日志 */
  batchDelete(ids: number[]) {
    return request.delete('/mall/member-login-log/batch', { data: { ids } });
  },

  /** 清空登录日志 */
  clear() {
    return request.delete('/mall/member-login-log/clear/all');
  },
};
