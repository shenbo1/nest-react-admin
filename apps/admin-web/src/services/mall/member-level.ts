import request from '@/utils/request';

export interface MemberLevel {
  id: number;
  code: string;
  name: string;
  level: number;
  minGrowth: number;
  maxGrowth?: number;
  discountRate?: number;
  pointsRate?: number;
  benefits?: string;
  status: 'ENABLED' | 'DISABLED';
  sort: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberLevelOption {
  id: number;
  code: string;
  name: string;
  level: number;
}

export interface MemberLevelQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  code?: string;
  status?: 'ENABLED' | 'DISABLED';
}

export interface MemberLevelForm {
  code: string;
  name: string;
  level: number;
  minGrowth: number;
  maxGrowth?: number;
  discountRate?: number;
  pointsRate?: number;
  benefits?: string;
  status?: 'ENABLED' | 'DISABLED';
  sort?: number;
  remark?: string;
}

export const memberLevelApi = {
  /** 获取会员等级列表 */
  list(params?: MemberLevelQuery) {
    return request.get<{ data: MemberLevel[]; total: number }>(
      '/mall/member-level',
      { params },
    );
  },

  /** 获取会员等级选项（下拉用） */
  options() {
    return request.get<MemberLevelOption[]>('/mall/member-level/options');
  },

  /** 获取会员等级详情 */
  get(id: number) {
    return request.get<MemberLevel>(`/mall/member-level/${id}`);
  },

  /** 创建会员等级 */
  create(data: MemberLevelForm) {
    return request.post<MemberLevel>('/mall/member-level', data);
  },

  /** 更新会员等级 */
  update(id: number, data: Partial<MemberLevelForm>) {
    return request.put<MemberLevel>(`/mall/member-level/${id}`, data);
  },

  /** 删除会员等级 */
  delete(id: number) {
    return request.delete(`/mall/member-level/${id}`);
  },
};
