import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useUserStore } from '@/stores/user';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 扩展 request 对象，添加泛型方法
interface RequestMethod<T = any> {
  <R = T>(url: string, config?: any): Promise<R>;
}

const requestWithTypes = request as {
  get: RequestMethod;
  post: RequestMethod;
  put: RequestMethod;
  delete: RequestMethod;
};

export default requestWithTypes;

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response;

    // 如果响应包含 code 字段，按业务逻辑处理
    if (data.code !== undefined && data.code !== 200) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }

    // 返回 data.data（业务数据）
    return data.data;
  },
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      const { status, data } = error.response;

      // 获取当前路径，避免在登录页面重复重定向
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath === '/login';
      switch (status) {
        case 401:
          // 在登录页面时，不执行重定向，让登录组件自己处理错误
          if (!isLoginPage) {
            message.error('登录已过期，请重新登录');
            useUserStore.getState().logout();
            window.location.href = '/login';
          }
          break;
        case 403:
          message.error('没有操作权限');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error(data?.message || '服务器内部错误');
          break;
        default:
          message.error(data?.message || '请求失败');
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求配置错误');
    }

    return Promise.reject(error);
  },
);
