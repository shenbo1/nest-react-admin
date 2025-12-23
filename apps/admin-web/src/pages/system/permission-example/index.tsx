import { Card, Alert, Divider } from 'antd';
import PermissionButton from '@/components/PermissionButton';
import PermissionControl from '@/components/PermissionControl';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const PermissionExample: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card title="权限管理示例">
        <Alert
          title="权限说明"
          description={
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>PermissionButton: 根据权限显示/隐藏按钮</li>
              <li>PermissionControl: 根据权限显示/隐藏任意内容</li>
              <li>MenuPermission: 专门用于菜单权限控制</li>
              <li>AuthRoute: 路由级权限控制</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Divider>按钮级权限控制</Divider>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <PermissionButton
            permission="system:user:add"
            type="primary"
            icon={<PlusOutlined />}
          >
            新增用户
          </PermissionButton>

          <PermissionButton
            permission="system:user:edit"
            type="default"
            icon={<EditOutlined />}
          >
            编辑用户
          </PermissionButton>

          <PermissionButton
            permission="system:user:remove"
            danger
            icon={<DeleteOutlined />}
          >
            删除用户
          </PermissionButton>
        </div>

        <Divider>内容级权限控制</Divider>
        <PermissionControl
          permission="system:user:list"
          fallback={<Alert title="您没有权限查看用户列表" type="warning" />}
        >
          <Alert title="您有权限查看用户列表" type="success" />
        </PermissionControl>

        <Divider>多重权限检查（需要所有权限）</Divider>
        <div>
          <p>检查是否同时拥有多个权限：</p>
          <PermissionControl permission="system:user:list">
            <PermissionControl permission="system:role:list">
              <Alert title="您同时拥有用户列表和角色列表权限" type="success" />
            </PermissionControl>
          </PermissionControl>
        </div>

        <Divider>权限检查示例代码</Divider>
        <Card size="small" title="使用示例">
          <pre style={{ margin: 0, padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
{`// 1. 权限按钮
<PermissionButton permission="system:user:add" type="primary">
  新增用户
</PermissionButton>

// 2. 权限内容控制
<PermissionControl
  permission="system:user:list"
  fallback={<div>没有权限</div>}
>
  <div>有权限的内容</div>
</PermissionControl>

// 3. 路由权限控制
<Route
  path="/user"
  element={
    <AuthRoute requiredPermission="system:user:list">
      <UserList />
    </AuthRoute>
  }
/>

// 4. 在组件中检查权限
const { hasPermission } = useUserStore();
if (hasPermission('system:user:edit')) {
  // 显示编辑功能
}`}
          </pre>
        </Card>
      </Card>
    </div>
  );
};

export default PermissionExample;
