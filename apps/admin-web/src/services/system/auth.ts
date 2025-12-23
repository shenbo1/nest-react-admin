import request from '@/utils/request';

export interface LoginParams {
  username: string;
  password: string;
  code?: string;
  uuid?: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: number;
    username: string;
    nickname?: string;
    avatar?: string;
    email?: string;
    roles: string[];
    permissions: string[];
  };
}

export interface UserInfo {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  gender: string;
  dept?: {
    id: number;
    name: string;
  };
  roles: string[];
  permissions: string[];
}

export interface MenuItem {
  id: number;
  name: string;
  path?: string;
  component?: string;
  icon?: string;
  visible: boolean;
  children?: MenuItem[];
}

// 登录
export const login = (data: LoginParams): Promise<LoginResult> => {
  return request.post('/auth/login', data);
};

// 获取用户信息
export const getProfile = (): Promise<UserInfo> => {
  return request.get('/auth/profile');
};

// 获取路由菜单
export const getRouters = (): Promise<MenuItem[]> => {
  return request.get('/auth/routers');
};

// 退出登录
export const logout = (): Promise<void> => {
  return request.post('/auth/logout');
};
