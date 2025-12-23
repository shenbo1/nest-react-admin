import { ReactNode } from 'react';
import { Result, Button } from 'antd';
import { useUserStore } from '@/stores/user';
import { useNavigate } from 'react-router-dom';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  /**
   * 权限不足时的处理方式
   * - '403': 显示403错误页面（默认）
   * - 'back': 返回上一页
   * - 'home': 返回首页
   * - 'hide': 隐藏内容
   */
  fallbackType?: '403' | 'back' | 'home' | 'hide';
}

/**
 * 页面级权限守卫组件
 * 用于保护整个页面或重要区域
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallbackType = '403',
}) => {
  const { hasPermission } = useUserStore();
  const navigate = useNavigate();

  const hasPerm = hasPermission(permission);

  // 有权限，正常显示
  if (hasPerm) {
    return <>{children}</>;
  }

  // 隐藏模式
  if (fallbackType === 'hide') {
    return null;
  }

  // 返回上一页
  if (fallbackType === 'back') {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有访问此页面的权限。"
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            返回上一页
          </Button>
        }
      />
    );
  }

  // 返回首页
  if (fallbackType === 'home') {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有访问此页面的权限。"
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
        }
      />
    );
  }

  // 403错误页面（默认）
  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有访问此页面的权限。"
      extra={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <Button type="primary" onClick={() => navigate(-1)}>
            返回上一页
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
        </div>
      }
    />
  );
};

export default PermissionGuard;
