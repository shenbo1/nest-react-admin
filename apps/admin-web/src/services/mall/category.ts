import request from '@/utils/request';

export type CategoryStatus = 'ENABLED' | 'DISABLED';

export interface Category {
  id: number;
  name: string;
  code?: string;
  parentId?: number;
  ancestors?: string;
  level?: number;
  image?: string;
  content?: string;
  sort: number;
  status: CategoryStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: CategoryStatus;
  code?: string;
}

export interface CategoryForm {
  name: string;
  code?: string;
  parentId?: number;
  level?: number;
  image?: string;
  content?: string;
  sort?: number;
  status?: CategoryStatus;
  remark?: string;
}

/** 树形分类类型 */
export interface CategoryTree extends Omit<Category, 'children'> {
  children?: CategoryTree[];
  childrenCount?: number;
}

export const categoryApi = {
  /** 获取商品分类列表 - 树形结构 */
  list(params?: CategoryQuery) {
    return request.get<{ list: CategoryTree[]; total: number }>('/mall/category', { params });
  },

  /** 获取所有分类（用于下拉选择） */
  listForSelect() {
    return request.get<{ list: CategoryTree[] }>('/mall/category/all/select');
  },

  /** 获取商品分类详情 */
  get(id: number) {
    return request.get<Category>(`/mall/category/${id}`);
  },

  /** 创建商品分类 */
  create(data: CategoryForm) {
    return request.post<Category>('/mall/category', data);
  },

  /** 更新商品分类 */
  update(id: number, data: Partial<CategoryForm>) {
    return request.put<Category>(`/mall/category/${id}`, data);
  },

  /** 删除商品分类 */
  delete(id: number) {
    return request.delete(`/mall/category/${id}`);
  },

  /** 切换状态 */
  toggleStatus(id: number) {
    return request.put<Category>(`/mall/category/${id}/toggle-status`);
  },
};
