import request from '@/utils/request';

// ========== 通用类型 ==========
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
}

// ========== 用户管理 ==========
export interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  phone?: string;
  gender: string;
  status: string;
  avatar?: string;
  deptId?: number;
  dept?: Dept;
  roles?: { role: Role }[];
  createdAt: string;
}

export interface CreateUserParams {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  phone?: string;
  gender?: string;
  status?: string;
  deptId?: number;
  roleIds?: number[];
  remark?: string;
}

export interface QueryUserParams extends QueryParams {
  username?: string;
  phone?: string;
  status?: string;
  deptId?: number;
}

export const userApi = {
  list: (params: QueryUserParams): Promise<PaginatedResult<User>> =>
    request.get('/system/user', { params }),
  get: (id: number): Promise<User> => request.get(`/system/user/${id}`),
  create: (data: CreateUserParams): Promise<User> =>
    request.post('/system/user', data),
  update: (id: number, data: Partial<CreateUserParams>): Promise<User> =>
    request.put(`/system/user/${id}`, data),
  delete: (id: number): Promise<void> => request.delete(`/system/user/${id}`),
  resetPassword: (id: number, password: string): Promise<void> =>
    request.put(`/system/user/${id}/resetPwd`, { password }),
  changeStatus: (id: number, status: string): Promise<void> =>
    request.put(`/system/user/${id}/status`, { status }),
  toggleStatus: (id: number): Promise<User> =>
    request.put(`/system/user/${id}/toggle-status`),
};

// ========== 角色管理 ==========
export interface Role {
  id: number;
  name: string;
  key: string;
  sort: number;
  dataScope: string;
  status: string;
  remark?: string;
  menus?: { menu: Menu }[];
  createdAt: string;
}

export interface CreateRoleParams {
  name: string;
  key: string;
  sort?: number;
  dataScope?: string;
  status?: string;
  remark?: string;
  menuIds?: number[];
}

export interface QueryRoleParams extends QueryParams {
  name?: string;
  key?: string;
  status?: string;
}

export const roleApi = {
  list: (params: QueryRoleParams): Promise<PaginatedResult<Role>> =>
    request.get('/system/role', { params }),
  simple: (): Promise<{ id: number; name: string; key: string }[]> =>
    request.get('/system/role/simple'),
  get: (id: number): Promise<Role> => request.get(`/system/role/${id}`),
  create: (data: CreateRoleParams): Promise<Role> =>
    request.post('/system/role', data),
  update: (id: number, data: Partial<CreateRoleParams>): Promise<Role> =>
    request.put(`/system/role/${id}`, data),
  delete: (id: number): Promise<void> => request.delete(`/system/role/${id}`),
  toggleStatus: (id: number): Promise<Role> =>
    request.put(`/system/role/${id}/toggle-status`),
};

// ========== 菜单管理 ==========
export interface Menu {
  id: number;
  parentId: number;
  name: string;
  path?: string;
  component?: string;
  perms?: string;
  type: string;
  icon?: string;
  sort: number;
  visible: boolean;
  status: string;
  children?: Menu[];
  createdAt: string;
}

export interface CreateMenuParams {
  name: string;
  parentId?: number;
  type: string;
  path?: string;
  component?: string;
  perms?: string;
  icon?: string;
  sort?: number;
  visible?: boolean;
  status?: string;
}

export const menuApi = {
  list: (): Promise<Menu[]> => request.get('/system/menu'),
  treeSelect: (): Promise<Menu[]> => request.get('/system/menu/treeselect'),
  get: (id: number): Promise<Menu> => request.get(`/system/menu/${id}`),
  create: (data: CreateMenuParams): Promise<Menu> =>
    request.post('/system/menu', data),
  update: (id: number, data: Partial<CreateMenuParams>): Promise<Menu> =>
    request.put(`/system/menu/${id}`, data),
  delete: (id: number): Promise<void> => request.delete(`/system/menu/${id}`),
  toggleStatus: (id: number): Promise<Menu> =>
    request.put(`/system/menu/${id}/toggle-status`),
};

// ========== 部门管理 ==========
export interface Dept {
  id: number;
  parentId: number;
  name: string;
  sort: number;
  leader?: string;
  phone?: string;
  email?: string;
  status: string;
  children?: Dept[];
  createdAt: string;
}

export interface CreateDeptParams {
  name: string;
  parentId?: number;
  sort?: number;
  leader?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export const deptApi = {
  list: (): Promise<Dept[]> => request.get('/system/dept'),
  treeSelect: (): Promise<Dept[]> => request.get('/system/dept/treeselect'),
  get: (id: number): Promise<Dept> => request.get(`/system/dept/${id}`),
  create: (data: CreateDeptParams): Promise<Dept> =>
    request.post('/system/dept', data),
  update: (id: number, data: Partial<CreateDeptParams>): Promise<Dept> =>
    request.put(`/system/dept/${id}`, data),
  delete: (id: number): Promise<void> => request.delete(`/system/dept/${id}`),
  toggleStatus: (id: number): Promise<Dept> =>
    request.put(`/system/dept/${id}/toggle-status`),
};

// ========== 字典管理 ==========
export interface DictType {
  id: number;
  name: string;
  type: string;
  status: string;
  remark?: string;
  createdAt: string;
}

export interface DictData {
  id: number;
  dictType: string;
  label: string;
  value: string;
  sort: number;
  cssClass?: string;
  listClass?: string;
  isDefault: boolean;
  status: string;
  remark?: string;
}

export const dictApi = {
  // 字典类型
  listType: (params: QueryParams & { name?: string; type?: string; status?: string }): Promise<PaginatedResult<DictType>> =>
    request.get('/system/dict/type', { params }),
  getType: (id: number): Promise<DictType> => request.get(`/system/dict/type/${id}`),
  createType: (data: { name: string; type: string; status?: string; remark?: string }): Promise<DictType> =>
    request.post('/system/dict/type', data),
  updateType: (id: number, data: Partial<{ name: string; type: string; status?: string; remark?: string }>): Promise<DictType> =>
    request.put(`/system/dict/type/${id}`, data),
  deleteType: (id: number): Promise<void> => request.delete(`/system/dict/type/${id}`),

  // 字典数据
  listData: (params: QueryParams & { dictType?: string; label?: string; status?: string }): Promise<PaginatedResult<DictData>> =>
    request.get('/system/dict/data', { params }),
  getDataByType: (dictType: string): Promise<DictData[]> =>
    request.get(`/system/dict/data/type/${dictType}`),
  getData: (id: number): Promise<DictData> => request.get(`/system/dict/data/${id}`),
  createData: (data: Partial<DictData>): Promise<DictData> =>
    request.post('/system/dict/data', data),
  updateData: (id: number, data: Partial<DictData>): Promise<DictData> =>
    request.put(`/system/dict/data/${id}`, data),
  deleteData: (id: number): Promise<void> => request.delete(`/system/dict/data/${id}`),
};

// ========== 代码生成 ==========
export interface CodegenRequest {
  moduleName: string;
  cnName?: string;
  menuId?: number;
}

export interface CodegenResult {
  moduleName: string;
  cnName: string;
  menuId: number;
  createdFiles: string[];
  configFiles: string[];
  updatedFiles: string[];
  nextSteps: string[];
}

export const codegenApi = {
  generate: (data: CodegenRequest): Promise<CodegenResult> =>
    request.post('/system/codegen/generate', data),
};
