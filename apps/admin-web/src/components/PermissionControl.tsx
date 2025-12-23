import { ReactNode } from 'react';
import { Empty } from 'antd';
import { useUserStore } from '@/stores/user';

interface PermissionControlProps {
  permission: string;
  children: ReactNode;
  /**
   * 权限不足时的处理方式
   * - 'hide': 隐藏内容（默认）
   * - 'show': 显示容器结构但不渲染children
   * - 'empty': 显示空状态提示
   * - 'custom': 使用自定义fallback
   */
  fallbackMode?: 'hide' | 'show' | 'empty' | 'custom';
  fallback?: ReactNode;
  emptyText?: string;
}

/**
 * 权限控制组件
 * 根据用户权限控制子组件的显示/隐藏
 * 提供多种权限不足时的处理方式
 */
export const PermissionControl: React.FC<PermissionControlProps> = ({
  permission,
  children,
  fallbackMode = 'empty',  // 修改默认值为 'empty'，避免空白页面
  fallback,
  emptyText = '您没有访问此内容的权限',
}) => {
  const { hasPermission } = useUserStore();
  const hasPerm = hasPermission(permission);

  // 有权限，正常显示
  if (hasPerm) {
    return <>{children}</>;
  }

  // 隐藏模式：不渲染任何内容
  if (fallbackMode === 'hide') {
    return null;
  }

  // 显示模式：渲染容器结构但不显示children
  if (fallbackMode === 'show') {
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  // 空状态模式：显示友好的空状态提示（默认）
  if (fallbackMode === 'empty') {
    return (
      <Empty
        description={emptyText}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // 自定义模式：使用提供的fallback
  return <>{fallback}</>;
};

export default PermissionControl;
