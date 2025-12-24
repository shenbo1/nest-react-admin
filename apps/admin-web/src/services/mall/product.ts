import request from '@/utils/request';
import {
  ProductSpecGroup,
  ProductSpecValue,
  ProductSku,
  getProductSpecGroups,
  getProductSpecValues,
  getProductSkus,
  createProductSpecGroup,
  createProductSpecValue,
  createProductSku,
  bulkCreateProductSkus,
  updateProductSpecGroup,
  updateProductSpecValue,
  updateProductSku,
  deleteProductSpecGroup,
  deleteProductSpecValue,
  deleteProductSku,
} from '@/services/mall/product-sku';

// 导出所有SKU相关API
export {
  type ProductSpecGroup,
  type ProductSpecValue,
  type ProductSku,
  getProductSpecGroups,
  getProductSpecValues,
  getProductSkus,
  createProductSpecGroup,
  createProductSpecValue,
  createProductSku,
  bulkCreateProductSkus,
  updateProductSpecGroup,
  updateProductSpecValue,
  updateProductSku,
  deleteProductSpecGroup,
  deleteProductSpecValue,
  deleteProductSku,
};

export type ProductStatus = 'ON_SHELF' | 'OFF_SHELF' | 'DRAFT';

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
  status: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  code?: string;
  categoryId?: number;
  category?: Category;
  content?: string;
  /// 商品主图（单张）
  mainImage?: string;
  /// 商品附图/轮播图列表
  images?: string[];
  originalPrice?: number;
  /// 默认现价
  defaultPrice?: number;
  /// 默认库存
  defaultStock: number;
  sales: number;
  unit?: string;
  /// 默认重量(kg)
  defaultWeight?: number;
  specs?: any;
  sort: number;
  /// 销售状态
  status: ProductStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  /// 关联的 SKU 列表
  skus?: ProductSku[];
  /// 关联的规格组
  specGroups?: ProductSpecGroup[];
}

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: ProductStatus;
  categoryId?: number;
  code?: string;
}

export interface ProductForm {
  name: string;
  code?: string;
  categoryId?: number;
  content?: string;
  /// 商品主图（单张）
  mainImage?: string;
  /// 商品附图/轮播图列表
  images?: string[];
  originalPrice?: number;
  /// 默认现价
  defaultPrice?: number;
  /// 默认库存
  defaultStock?: number;
  sales?: number;
  unit?: string;
  /// 默认重量(kg)
  defaultWeight?: number;
  specs?: any;
  sort?: number;
  /// 销售状态
  status?: ProductStatus;
  remark?: string;
}

export const productApi = {
  /** 获取商品管理列表 */
  list(params?: ProductQuery) {
    return request.get<{ list: Product[]; total: number }>('/mall/product', { params });
  },

  /** 获取商品管理详情 */
  get(id: number) {
    return request.get<Product>(`/mall/product/${id}`);
  },

  /** 创建商品管理 */
  create(data: ProductForm) {
    return request.post<Product>('/mall/product', data);
  },

  /** 更新商品管理 */
  update(id: number, data: Partial<ProductForm>) {
    return request.put<Product>(`/mall/product/${id}`, data);
  },

  /** 删除商品管理 */
  delete(id: number) {
    return request.delete(`/mall/product/${id}`);
  },

  /** 切换商品状态 */
  toggleStatus(id: number) {
    return request.put<Product>(`/mall/product/${id}/toggle-status`);
  },

  /** 批量切换商品状态 */
  batchToggleStatus(ids: number[]) {
    return request.put<Product[]>('/mall/product/batch/toggle-status', { ids });
  },

  /** 复制商品 */
  duplicate(id: number) {
    return request.post<Product>(`/mall/product/${id}/duplicate`);
  },
};
