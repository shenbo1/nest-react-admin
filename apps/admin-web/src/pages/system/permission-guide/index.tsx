import { Card, Alert, Divider, Space } from 'antd';
import PermissionButton from '@/components/PermissionButton';
import PermissionControl from '@/components/PermissionControl';
import PermissionDebug from '@/components/PermissionDebug';
import { SYSTEM } from '@/constants/permissions';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const PermissionGuide: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card title="权限管理使用指南" extra={<InfoCircleOutlined />}>
        <Alert
          message="组件说明"
          description="本页面展示了各种权限控制组件的使用方法和效果"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <PermissionDebug />

        <Divider>1. PermissionButton 组件</Divider>
        <Card size="small" title="按钮级权限控制" style={{ marginBottom: 16 }}>
          <Space wrap>
            <PermissionButton
              permission={SYSTEM.USER.ADD}
              type="primary"
              icon={<PlusOutlined />}
            >
              新增用户（隐藏模式）
            </PermissionButton>

            <PermissionButton
              permission="system:user:edit"
              type="default"
              icon={<EditOutlined />}
              fallbackMode="disabled"
            >
              编辑用户（禁用模式）
            </PermissionButton>

            <PermissionButton
              permission="system:user:remove"
              danger
              icon={<DeleteOutlined />}
              fallbackMode="disabled"
            >
              删除用户（禁用模式）
            </PermissionButton>
          </Space>
        </Card>

        <Card size="small" title="代码示例" style={{ marginBottom: 16 }}>
          <pre style={{ margin: 0, padding: '16px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
{`// 隐藏模式（默认）
<PermissionButton permission="system:user:add" type="primary">
  新增用户
</PermissionButton>

// 禁用模式（显示但禁用）
<PermissionButton
  permission="system:user:edit"
  type="default"
  fallbackMode="disabled"
>
  编辑用户
</PermissionButton>`}
          </pre>
        </Card>

        <Divider>2. PermissionControl 组件</Divider>
        <Card size="small" title="内容级权限控制" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <h4>隐藏模式（默认）：</h4>
              <PermissionControl
                permission="system:user:list"
                fallbackMode="hide"
              >
                <div style={{ padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  ✅ 您有权限查看此内容
                </div>
              </PermissionControl>
            </div>

            <div>
              <h4>空状态模式：</h4>
              <PermissionControl
                permission="system:role:list"
                fallbackMode="empty"
                emptyText="您没有查看角色列表的权限"
              >
                <div style={{ padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  ✅ 您有权限查看角色列表
                </div>
              </PermissionControl>
            </div>

            <div>
              <h4>自定义模式：</h4>
              <PermissionControl
                permission="system:dept:list"
                fallbackMode="custom"
                fallback={
                  <div style={{ padding: '16px', background: '#fff2e8', border: '1px solid #ffd591' }}>
                    ⚠️ 您没有权限查看部门列表，请联系管理员
                  </div>
                }
              >
                <div style={{ padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  ✅ 您有权限查看部门列表
                </div>
              </PermissionControl>
            </div>
          </Space>
        </Card>

        <Card size="small" title="代码示例" style={{ marginBottom: 16 }}>
          <pre style={{ margin: 0, padding: '16px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
{`// 隐藏模式
<PermissionControl permission="system:user:list">
  <div>有权限的内容</div>
</PermissionControl>

// 空状态模式
<PermissionControl
  permission="system:role:list"
  fallbackMode="empty"
  emptyText="您没有查看角色列表的权限"
>
  <div>有权限的内容</div>
</PermissionControl>

// 自定义模式
<PermissionControl
  permission="system:dept:list"
  fallbackMode="custom"
  fallback={<div>权限不足的提示</div>}
>
  <div>有权限的内容</div>
</PermissionControl>`}
          </pre>
        </Card>

        <Divider>3. PermissionGuard 组件</Divider>
        <Card size="small" title="页面级权限守卫" style={{ marginBottom: 16 }}>
          <p>用于保护整个页面或重要区域，提供专业的403错误页面</p>
        </Card>

        <Card size="small" title="代码示例" style={{ marginBottom: 16 }}>
          <pre style={{ margin: 0, padding: '16px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
{`// 403错误页面（默认）
<PermissionGuard permission="system:user:list">
  <UserList />
</PermissionGuard>

// 返回首页
<PermissionGuard permission="system:role:list" fallbackType="home">
  <RoleList />
</PermissionGuard>

// 返回上一页
<PermissionGuard permission="system:menu:list" fallbackType="back">
  <MenuList />
</PermissionGuard>

// 隐藏模式
<PermissionGuard permission="system:dept:list" fallbackType="hide">
  <DeptList />
</PermissionGuard>`}
          </pre>
        </Card>

        <Divider>4. 路由级权限控制</Divider>
        <Card size="small" title="在路由中使用权限检查" style={{ marginBottom: 16 }}>
          <pre style={{ margin: 0, padding: '16px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
{`import AuthRoute from '@/components/AuthRoute';

<Route
  path="/user"
  element={
    <AuthRoute requiredPermission="system:user:list">
      <UserList />
    </AuthRoute>
  }
/>`}
          </pre>
        </Card>

        <Divider>5. 最佳实践</Divider>
        <Card size="small" title="使用建议">
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>
              <strong>按钮级权限：</strong>
              <ul>
                <li>使用默认的隐藏模式，避免界面混乱</li>
                <li>对于重要操作，可使用禁用模式让用户知道功能存在但无权限</li>
              </ul>
            </li>
            <li>
              <strong>内容级权限：</strong>
              <ul>
                <li>数据列表使用隐藏模式，避免权限泄露</li>
                <li>整个模块页面使用空状态模式，给用户明确提示</li>
                <li>重要内容使用自定义模式，提供联系方式</li>
              </ul>
            </li>
            <li>
              <strong>页面级权限：</strong>
              <ul>
                <li>使用 PermissionGuard 提供专业的403页面</li>
                <li>提供返回上一页或首页的选项</li>
              </ul>
            </li>
            <li>
              <strong>权限标识：</strong>
              <ul>
                <li>统一使用常量文件管理权限标识</li>
                <li>遵循 "模块:操作:资源" 的命名规范</li>
                <li>超级管理员使用 "*:*:*" 标识拥有所有权限</li>
              </ul>
            </li>
          </ul>
        </Card>

        <Divider>6. 权限优先级</Divider>
        <Card size="small" title="权限检查顺序">
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>路由级权限检查 - AuthRoute（最高优先级）</li>
            <li>页面级权限守卫 - PermissionGuard</li>
            <li>内容级权限控制 - PermissionControl</li>
            <li>按钮级权限控制 - PermissionButton（最低优先级）</li>
          </ol>
        </Card>
      </Card>
    </div>
  );
};

export default PermissionGuide;
