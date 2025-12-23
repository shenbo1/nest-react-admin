import { Button, ButtonProps, Tooltip } from 'antd';
import { useUserStore } from '@/stores/user';

interface PermissionButtonProps extends ButtonProps {
  permission: string;
  children: React.ReactNode;
  /**
   * 权限不足时的处理方式
   * - 'hide': 隐藏按钮（默认）
   * - 'disabled': 显示按钮但禁用，并显示提示
   */
  fallbackMode?: 'hide' | 'disabled';
}

/**
 * 权限按钮组件
 * 支持两种模式：
 * 1. 隐藏模式（默认）：没有权限时不显示按钮
 * 2. 禁用模式：显示按钮但禁用，并显示权限提示
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  children,
  fallbackMode = 'hide',
  ...props
}) => {
  const { hasPermission } = useUserStore();
  const hasPerm = hasPermission(permission);

  // 隐藏模式：没有权限时不显示
  if (!hasPerm && fallbackMode === 'hide') {
    return null;
  }

  // 禁用模式：显示但禁用
  if (!hasPerm && fallbackMode === 'disabled') {
    return (
      <Tooltip title="您没有此操作的权限，请联系管理员">
        <Button {...props} disabled>
          {children}
        </Button>
      </Tooltip>
    );
  }

  return <Button {...props}>{children}</Button>;
};

export default PermissionButton;
