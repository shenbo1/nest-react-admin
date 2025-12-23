import { Card, Alert, Descriptions } from 'antd';
import { useUserStore } from '@/stores/user';

interface PermissionDebugProps {
  permission?: string;
}

/**
 * 权限调试组件
 * 用于查看当前用户的权限状态和调试权限问题
 */
export const PermissionDebug: React.FC<PermissionDebugProps> = ({
  permission = 'system:user:list',
}) => {
  const { userInfo, hasPermission } = useUserStore();

  const hasPerm = hasPermission(permission);

  return (
    <Card title="权限调试信息" size="small" style={{ marginBottom: 16 }}>
      <Alert
        message="调试信息"
        description="此组件用于查看当前用户的权限状态，帮助调试权限问题"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="用户名">
          {userInfo?.username || '未登录'}
        </Descriptions.Item>
        <Descriptions.Item label="用户ID">
          {userInfo?.id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="角色">
          {userInfo?.roles?.join(', ') || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="权限列表">
          {userInfo?.permissions?.length ? (
            <div style={{ maxHeight: '150px', overflow: 'auto' }}>
              {userInfo.permissions.map((perm) => (
                <div key={perm} style={{ marginBottom: '4px' }}>
                  {perm}
                </div>
              ))}
            </div>
          ) : (
            <span style={{ color: 'red' }}>⚠️ 无权限数据！</span>
          )}
        </Descriptions.Item>
        <Descriptions.Item label={`测试权限 "${permission}"`}>
          {hasPerm ? (
            <span style={{ color: 'green' }}>✅ 有权限</span>
          ) : (
            <span style={{ color: 'red' }}>❌ 无权限</span>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="超级管理员权限">
          {userInfo?.permissions?.includes('*:*:*') ? (
            <span style={{ color: 'green' }}>✅ 拥有所有权限</span>
          ) : (
            <span style={{ color: 'orange' }}>⚠️ 非超级管理员</span>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default PermissionDebug;
