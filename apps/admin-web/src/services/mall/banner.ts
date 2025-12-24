import request from '@/utils/request';

export type BannerStatus = 'ENABLED' | 'DISABLED';

export interface Banner {
  id: number;
  name: string;
  code?: string;
  image: string;
  linkUrl?: string;
  type: number;
  position?: string;
  startTime?: string;
  endTime?: string;
  content?: string;
  sort: number;
  status: BannerStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BannerQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: BannerStatus;
  code?: string;
}

export interface BannerForm {
  name: string;
  code?: string;
  image: string;
  linkUrl?: string;
  type?: number;
  position?: string;
  startTime?: string;
  endTime?: string;
  content?: string;
  sort?: number;
  status?: BannerStatus;
  remark?: string;
}

export const bannerApi = {
  /** 获取运营配置列表 */
  list(params?: BannerQuery) {
    return request.get<{ list: Banner[]; total: number }>('/mall/banner', { params });
  },

  /** 获取运营配置详情 */
  get(id: number) {
    return request.get<Banner>(`/mall/banner/${id}`);
  },

  /** 创建运营配置 */
  create(data: BannerForm) {
    return request.post<Banner>('/mall/banner', data);
  },

  /** 更新运营配置 */
  update(id: number, data: Partial<BannerForm>) {
    return request.put<Banner>(`/mall/banner/${id}`, data);
  },

  /** 删除运营配置 */
  delete(id: number) {
    return request.delete(`/mall/banner/${id}`);
  },

  /** 切换状态 */
  toggleStatus(id: number) {
    return request.put<Banner>(`/mall/banner/${id}/toggle-status`);
  },
};
