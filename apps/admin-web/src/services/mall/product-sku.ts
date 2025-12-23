import request from '@/utils/request';

// 规格组相关API
export interface ProductSpecGroup {
  id: number;
  productId: number;
  name: string;
  sort: number;
  specValues: ProductSpecValue[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductSpecValue {
  id: number;
  specGroupId: number;
  name: string;
  sort: number;
  specGroup: ProductSpecGroup;
  createdAt: string;
  updatedAt: string;
}

// 获取规格组列表
export const getProductSpecGroups = (params: { productId: number }) => {
  return request.get<{ data: ProductSpecGroup[] }>('/mall/product-spec-group', {
    params,
  });
};

// 创建规格组
export const createProductSpecGroup = (data: { productId: number; name: string; sort?: number }) => {
  return request.post<{ data: ProductSpecGroup }>('/mall/product-spec-group', data);
};

// 更新规格组
export const updateProductSpecGroup = (id: number, data: { name?: string; sort?: number }) => {
  return request.put<{ data: ProductSpecGroup }>(`/mall/product-spec-group/${id}`, data);
};

// 删除规格组
export const deleteProductSpecGroup = (id: number) => {
  return request.delete(`/mall/product-spec-group/${id}`);
};

// 规格值相关API
// 获取规格值列表
export const getProductSpecValues = (params: { specGroupId: number }) => {
  return request.get<{ data: ProductSpecValue[] }>('/mall/product-spec-value', {
    params,
  });
};

// 创建规格值
export const createProductSpecValue = (data: { specGroupId: number; name: string; sort?: number }) => {
  return request.post<{ data: ProductSpecValue }>('/mall/product-spec-value', data);
};

// 批量创建规格值
export const bulkCreateProductSpecValues = (data: Array<{ specGroupId: number; name: string; sort?: number }>) => {
  return request.post('/mall/product-spec-value/bulk', data);
};

// 更新规格值
export const updateProductSpecValue = (id: number, data: { name?: string; sort?: number }) => {
  return request.put<{ data: ProductSpecValue }>(`/mall/product-spec-value/${id}`, data);
};

// 删除规格值
export const deleteProductSpecValue = (id: number) => {
  return request.delete(`/mall/product-spec-value/${id}`);
};

// 批量删除规格值
export const bulkDeleteProductSpecValues = (data: { ids: number[] }) => {
  return request.delete('/mall/product-spec-value/bulk', {
    data,
  });
};

// SKU相关API
export interface ProductSku {
  id: number;
  productId: number;
  skuCode: string;
  specCombination: Record<string, string>;
  price: number;
  stock: number;
  weight?: number;
  sales: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

// 获取SKU列表
export const getProductSkus = (params: { productId: number }) => {
  return request.get<{ data: ProductSku[] }>('/mall/product-sku', {
    params,
  });
};

// 创建SKU
export const createProductSku = (data: {
  productId: number;
  skuCode: string;
  specCombination: Record<string, string>;
  price: number;
  stock: number;
  weight?: number;
  sales?: number;
  images?: string[];
}) => {
  return request.post<{ data: ProductSku }>('/mall/product-sku', data);
};

// 批量创建SKU
export const bulkCreateProductSkus = (data: Array<{
  productId: number;
  skuCode: string;
  specCombination: Record<string, string>;
  price: number;
  stock: number;
  weight?: number;
  sales?: number;
  images?: string[];
}>) => {
  return request.post('/mall/product-sku/bulk', data);
};

// 更新SKU
export const updateProductSku = (id: number, data: {
  skuCode?: string;
  specCombination?: Record<string, string>;
  price?: number;
  stock?: number;
  weight?: number;
  sales?: number;
  images?: string[];
}) => {
  return request.put<{ data: ProductSku }>(`/mall/product-sku/${id}`, data);
};

// 删除SKU
export const deleteProductSku = (id: number) => {
  return request.delete(`/mall/product-sku/${id}`);
};

// 批量删除SKU
export const bulkDeleteProductSkus = (data: { ids: number[] }) => {
  return request.delete('/mall/product-sku/bulk', {
    data,
  });
};
