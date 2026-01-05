import request from '@/utils/request';

export interface MemberAddress {
  id: number;
  memberId: number;
  receiver: string;
  phone: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postalCode?: string;
  address: string;
  isDefault: boolean;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: number;
    username: string;
    nickname?: string;
    phone?: string;
  };
}

export interface MemberAddressQuery {
  page?: number;
  pageSize?: number;
  memberId?: number;
  receiver?: string;
  phone?: string;
}

export interface MemberAddressForm {
  memberId: number;
  receiver: string;
  phone: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postalCode?: string;
  address: string;
  isDefault?: boolean;
  remark?: string;
}

export const memberAddressApi = {
  /** 获取收货地址列表 */
  list(params?: MemberAddressQuery) {
    return request.get<{ data: MemberAddress[]; total: number }>(
      '/mall/member-address',
      { params },
    );
  },

  /** 获取会员的所有收货地址 */
  listByMember(memberId: number) {
    return request.get<MemberAddress[]>(`/mall/member-address/member/${memberId}`);
  },

  /** 获取收货地址详情 */
  get(id: number) {
    return request.get<MemberAddress>(`/mall/member-address/${id}`);
  },

  /** 创建收货地址 */
  create(data: MemberAddressForm) {
    return request.post<MemberAddress>('/mall/member-address', data);
  },

  /** 更新收货地址 */
  update(id: number, data: Partial<MemberAddressForm>) {
    return request.put<MemberAddress>(`/mall/member-address/${id}`, data);
  },

  /** 删除收货地址 */
  delete(id: number) {
    return request.delete(`/mall/member-address/${id}`);
  },

  /** 设置默认地址 */
  setDefault(id: number) {
    return request.put<MemberAddress>(`/mall/member-address/${id}/set-default`);
  },
};
