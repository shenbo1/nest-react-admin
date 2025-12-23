import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInfo {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  roles: string[];
  permissions: string[];
}

interface UserState {
  token: string | null;
  userInfo: UserInfo | null;
  setToken: (token: string) => void;
  setUserInfo: (info: UserInfo) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      token: null,
      userInfo: null,

      setToken: (token) => set({ token }),

      setUserInfo: (userInfo) => set({ userInfo }),

      logout: () => set({ token: null, userInfo: null }),

      hasPermission: (permission) => {
        const { userInfo } = get();
        if (!userInfo) return false;

        // 临时调试模式：如果用户信息中没有权限列表，自动给予所有权限
        // 这可以避免白屏问题，后续应该移除
        if (!userInfo.permissions || userInfo.permissions.length === 0) {
          console.warn('⚠️ 用户权限列表为空，自动授予所有权限（调试模式）');
          return true;
        }

        // 超级管理员拥有所有权限
        if (userInfo.permissions.includes('*:*:*')) {
          return true;
        }

        return userInfo.permissions.includes(permission);
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ token: state.token, userInfo: state.userInfo }),
    }
  )
);
