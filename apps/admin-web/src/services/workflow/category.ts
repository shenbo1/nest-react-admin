import request from '@/utils/request';

export interface Category {
  id: number;
  code: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: number;
  level: number;
  sort: number;
  status: 'ENABLED' | 'DISABLED';
  remark?: string;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  childrenCount?: number;
  key?: number;
}

export interface CategoryTreeNode extends Category {
  children?: CategoryTreeNode[];
}

/**
 * 查询分类列表（树形结构）
 */
export function queryCategoryList(params?: {
  code?: string;
  name?: string;
  status?: 'ENABLED' | 'DISABLED';
}) {
  return request.get('/workflow/category', { params });
}

/**
 * 查询分类树（用于下拉选择）
 */
export function queryCategoryTree() {
  return request.get('/workflow/category/all/select');
}

/**
 * 查询分类详情
 */
export function getCategory(id: number) {
  return request.get(`/workflow/category/${id}`);
}

/**
 * 创建分类
 */
export function createCategory(data: Partial<Category>) {
  return request.post('/workflow/category', data);
}

/**
 * 更新分类
 */
export function updateCategory(id: number, data: Partial<Category>) {
  return request.put(`/workflow/category/${id}`, data);
}

/**
 * 删除分类
 */
export function deleteCategory(id: number) {
  return request.delete(`/workflow/category/${id}`);
}

/**
 * 批量删除分类
 */
export function batchDeleteCategory(ids: number[]) {
  return request.delete(`/workflow/category/batch/${ids.join(',')}`);
}

/**
 * 更新分类状态
 */
export function updateCategoryStatus(id: number, status: 'ENABLED' | 'DISABLED') {
  return request.put(`/workflow/category/${id}/status/${status}`);
}

/**
 * 扁平化树形结构（用于级联选择）
 */
export function flattenCategoryTree(tree: CategoryTreeNode[]): Category[] {
  const result: Category[] = [];

  function traverse(node: CategoryTreeNode, parentNames: string[] = []) {
    const nodeWithPath = {
      ...node,
      fullPath: parentNames.length > 0 ? `${parentNames.join(' / ')} / ${node.name}` : node.name,
    };
    result.push(nodeWithPath);

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        traverse(child, [...parentNames, node.name]);
      });
    }
  }

  tree.forEach(node => traverse(node));
  return result;
}

/**
 * 获取分类级联选项（带缩进显示层级）
 */
export function getCategoryCascaderOptions(tree: CategoryTreeNode[]): Array<{
  value: number;
  label: string;
  children?: any[];
}> {
  function convert(node: CategoryTreeNode, level: number = 0): any {
    return {
      value: node.id,
      label: '　'.repeat(level) + node.name,
      children: node.children?.map(child => convert(child, level + 1)),
    };
  }

  return tree.map(node => convert(node));
}
