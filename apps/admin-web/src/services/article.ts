import request from '@/utils/request';

export interface Article {
  id: number;
  name: string;
  code?: string;
  content?: string;
  sort: number;
  status: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: string;
}

export interface ArticleForm {
  name: string;
  code?: string;
  content?: string;
  sort?: number;
  status?: string;
  remark?: string;
}

export const articleApi = {
  /** 获取article管理列表 */
  list(params?: ArticleQuery) {
    return request.get<{ list: Article[]; total: number }>('/article', { params });
  },

  /** 获取article管理详情 */
  get(id: number) {
    return request.get<Article>(`/article/${id}`);
  },

  /** 创建article管理 */
  create(data: ArticleForm) {
    return request.post<Article>('/article', data);
  },

  /** 更新article管理 */
  update(id: number, data: Partial<ArticleForm>) {
    return request.put<Article>(`/article/${id}`, data);
  },

  /** 删除article管理 */
  delete(id: number) {
    return request.delete(`/article/${id}`);
  },

  /** 切换状态 */
  toggleStatus(id: number) {
    return request.put<Article>(`/article/${id}/toggle-status`);
  },
};
