import { ReactNode } from 'react';
import { useUserStore } from '@/stores/user';

interface MenuPermissionProps {
  permission: string;
  children: ReactNode;
}

/**
 * 菜单权限控制组件
 * 用于控制菜单项的显示/隐藏
 */
export const MenuPermission: React.FC<MenuPermissionProps> = ({
  permission,
  children,
}) => {
  const { hasPermission } = useUserStore();

  if (!hasPermission(permission)) {
    return null;
  }

  return <>{children}</>;
};

export default MenuPermission;
