# 前端权限管理说明

## 更新记录

### 2025-12-20
- ✅ 完善了权限管理系统，增加了路由级权限控制
- ✅ 为所有系统管理页面（用户、角色、菜单、部门、字典）添加了按钮级权限控制
- ✅ 优化了 PermissionControl 组件的默认行为，从 'hide' 改为 'empty'，避免空白页面
- ✅ 为 PermissionButton 组件添加了 'disabled' 模式，提供更好的用户体验
- ✅ 在 App.tsx 中为所有路由添加了 AuthRoute 权限守卫
- ✅ 创建了完整的权限管理指南页面和调试组件

## 概述

前端权限管理系统提供了多层次的权限控制，包括：
- 路由级权限控制（AuthRoute）
- 页面级权限守卫（PermissionGuard）
- 菜单级权限控制（MenuPermission）
- 按钮级权限控制（PermissionButton）
- 内容级权限控制（PermissionControl）

## 🎨 权限控制组件

### 1. PermissionButton（权限按钮）

用于控制按钮的显示/隐藏，支持两种权限不足时的处理方式。

#### 隐藏模式（默认）
```tsx
import PermissionButton from '@/components/PermissionButton';

<PermissionButton
  permission="system:user:add"
  type="primary"
  icon={<PlusOutlined />}
  onClick={handleAdd}
>
  新增用户
</PermissionButton>
```

#### 禁用模式（显示但禁用）
```tsx
<PermissionButton
  permission="system:user:edit"
  type="default"
  icon={<EditOutlined />}
  fallbackMode="disabled"  // 显示按钮但禁用，并显示权限提示
>
  编辑用户
</PermissionButton>
```

**属性说明：**
- `permission`: 必需，权限标识字符串
- `children`: 按钮文本
- `fallbackMode`: 可选，权限不足时的处理方式
  - `'hide'`: 隐藏按钮（默认）
  - `'disabled'`: 显示按钮但禁用，并显示权限提示
- 其他属性继承自 Ant Design Button 组件

### 2. PermissionControl（权限控制）

用于控制任意内容的显示/隐藏，提供多种权限不足时的处理方式。

#### 隐藏模式（默认）
```tsx
<PermissionControl permission="system:user:list">
  <div>有权限的内容</div>
</PermissionControl>
```

#### 空状态模式
```tsx
<PermissionControl
  permission="system:role:list"
  fallbackMode="empty"
  emptyText="您没有查看角色列表的权限"
>
  <div>有权限的内容</div>
</PermissionControl>
```

#### 自定义模式
```tsx
<PermissionControl
  permission="system:dept:list"
  fallbackMode="custom"
  fallback={<div>权限不足，请联系管理员</div>}
>
  <div>有权限的内容</div>
</PermissionControl>
```

**属性说明：**
- `permission`: 必需，权限标识字符串
- `children`: 有权限时显示的内容
- `fallbackMode`: 可选，权限不足时的处理方式
  - `'hide'`: 隐藏内容
  - `'show'`: 显示容器结构但不渲染children
  - `'empty'`: 显示空状态提示（**默认**）
  - `'custom'`: 使用自定义fallback
- `fallback`: 可选，自定义fallback内容
- `emptyText`: 可选，空状态提示文本

> ⚠️ **重要**：默认行为已改为 `empty` 模式，避免出现空白页面。如果没有权限，会显示友好的空状态提示。

### 3. PermissionGuard（权限守卫）

用于页面级权限保护，提供专业的403错误页面。

```tsx
import PermissionGuard from '@/components/PermissionGuard';

// 403错误页面（默认）
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
```

**属性说明：**
- `permission`: 必需，权限标识字符串
- `children`: 受保护的组件
- `fallbackType`: 可选，权限不足时的处理方式
  - `'403'`: 显示403错误页面（默认）
  - `'back'`: 返回上一页
  - `'home'`: 返回首页
  - `'hide'`: 隐藏内容

### 4. MenuPermission（菜单权限）

专门用于菜单项的权限控制。

```tsx
import MenuPermission from '@/components/MenuPermission';

<MenuPermission permission="system:user:list">
  <Menu.Item key="user">用户管理</Menu.Item>
</MenuPermission>
```

### 5. AuthRoute（路由权限）

用于路由级别的权限控制，只有拥有权限的用户才能访问指定路由。

```tsx
import AuthRoute from '@/components/AuthRoute';

<Route
  path="/user"
  element={
    <AuthRoute requiredPermission="system:user:list">
      <UserList />
    </AuthRoute>
  }
/>
```

**属性说明：**
- `requiredPermission`: 必需，访问路由所需的权限
- `children`: 路由组件

### 6. useUserStore（权限检查）

在组件中直接进行权限检查。

```tsx
import { useUserStore } from '@/stores/user';

const { hasPermission } = useUserStore();

if (hasPermission('system:user:edit')) {
  // 显示编辑功能
}
```

## 📋 权限标识规范

权限标识采用 `模块:操作:资源` 的格式，例如：
- `system:user:list` - 查看用户列表
- `system:user:add` - 新增用户
- `system:user:edit` - 编辑用户
- `system:user:remove` - 删除用户
- `system:role:list` - 查看角色列表
- `*:*:*` - 超级管理员，拥有所有权限

## 💡 使用示例

### 1. 表格操作列（推荐使用禁用模式）

```tsx
{
  title: '操作',
  valueType: 'option',
  render: (_, record) => (
    <Space>
      <PermissionButton
        permission="system:user:edit"
        type="link"
        onClick={() => handleEdit(record)}
        fallbackMode="disabled"  // 让用户知道按钮存在但没有权限
      >
        编辑
      </PermissionButton>
      <Popconfirm onConfirm={() => handleDelete(record.id)}>
        <PermissionButton
          permission="system:user:remove"
          danger
          type="link"
          fallbackMode="disabled"
        >
          删除
        </PermissionButton>
      </Popconfirm>
    </Space>
  ),
}
```

### 2. 工具栏按钮

```tsx
<ProTable
  toolBarRender={() => [
    <PermissionButton
      key="add"
      permission="system:user:add"
      type="primary"
      icon={<PlusOutlined />}
      onClick={handleAdd}
    >
      新增用户
    </PermissionButton>,
  ]}
/>
```

### 3. 内容区域权限控制

```tsx
// 数据列表使用隐藏模式
<PermissionControl permission="system:user:list">
  <Table dataSource={data} />
</PermissionControl>

// 整个模块使用空状态模式
<PermissionControl
  permission="system:role:list"
  fallbackMode="empty"
  emptyText="您没有查看角色列表的权限，请联系管理员"
>
  <RoleList />
</PermissionControl>
```

### 4. 页面级权限保护

```tsx
// 使用 PermissionGuard 保护整个页面
<PermissionGuard permission="system:user:list">
  <UserList />
</PermissionGuard>
```

### 5. 嵌套权限检查

```tsx
<PermissionControl permission="system:user:list">
  <PermissionControl permission="system:role:list">
    <div>同时拥有用户和角色权限才能看到</div>
  </PermissionControl>
</PermissionControl>
```

## 🍽️ 菜单权限管理

### 动态菜单

系统支持从后端获取动态菜单，并基于用户权限进行过滤：

```tsx
// 在 BasicLayout 中实现
useEffect(() => {
  // 获取用户路由菜单
  const routers = await getRouters();
  // 根据权限过滤菜单
  const filteredMenus = filterMenusByPermission(routers);
  setMenuData(filteredMenus);
}, [userInfo]);
```

### 硬编码菜单（备选方案）

如果无法获取动态菜单，系统提供硬编码菜单作为备选方案：

```tsx
const defaultMenuItems = [
  {
    key: '/system/user',
    label: '用户管理',
    permission: SYSTEM.USER.LIST,
  },
  // ...
];
```

## 🎯 最佳实践

### 1. 选择合适的权限控制方式

| 场景 | 推荐组件 | 推荐模式 |
|------|----------|----------|
| 重要操作按钮（如删除） | PermissionButton | `disabled` - 让用户知道功能存在但无权限 |
| 常规操作按钮（如编辑） | PermissionButton | `disabled` - 提供友好的用户体验 |
| 数据列表 | PermissionControl | `hide` - 避免权限信息泄露 |
| 整个模块页面 | PermissionGuard | `403` - 提供专业的403页面 |
| 权限敏感内容 | PermissionControl | `empty` + `custom` - 提供联系方式 |
| 路由保护 | AuthRoute | 默认模式 |

### 2. 权限标识管理

- ✅ 统一在 `constants/permissions.ts` 中管理权限标识
- ✅ 遵循 `模块:操作:资源` 的命名规范
- ✅ 使用 TypeScript 类型检查避免拼写错误

### 3. 用户体验优化

- ✅ 对于重要功能，使用 `disabled` 模式而非 `hide` 模式
- ✅ 提供清晰的权限不足提示信息
- ✅ 在403页面提供返回上一页或首页的选项
- ✅ 使用空状态页面替代空白页面

## ⚠️ 注意事项

1. **权限标识必须与后端保持一致**：前端权限标识需要与后端返回的权限列表匹配

2. **超级管理员权限**：拥有 `*:*:*` 权限的用户可以看到所有内容

3. **权限检查优先级**（从高到低）：
   - 路由权限检查 - AuthRoute
   - 页面级权限守卫 - PermissionGuard
   - 内容级权限控制 - PermissionControl
   - 按钮级权限控制 - PermissionButton

4. **性能优化**：权限检查基于 Zustand 状态管理，性能良好

5. **缓存机制**：用户权限信息会持久化到本地存储，刷新页面后自动恢复

## 🔧 故障排除

### 1. 权限不生效

检查项：
- [ ] 权限标识是否正确（检查常量文件）
- [ ] 用户是否真正拥有该权限（检查后端返回的权限列表）
- [ ] 权限缓存是否需要刷新
- [ ] 组件是否正确导入和使用

### 2. 按钮显示但无法点击

可能原因：
- 使用了 `disabled` 模式，这是正常行为
- 检查 `fallbackMode` 属性设置

### 3. 菜单不显示

检查项：
- [ ] 菜单项是否配置了正确的权限
- [ ] 用户权限列表是否包含菜单权限
- [ ] 菜单可见性设置
- [ ] 是否使用了正确的权限常量

### 4. 页面访问被拒绝

检查项：
- [ ] 路由是否配置了正确的权限要求
- [ ] 用户权限列表是否包含路由权限
- [ ] AuthRoute 或 PermissionGuard 组件是否正确使用

### 5. 权限提示不友好

优化建议：
- 使用 `disabled` 模式替代 `hide` 模式
- 为空状态提供自定义提示信息
- 在403页面提供导航选项

## 🚀 扩展功能

### 1. 权限缓存

用户权限信息存储在 Zustand store 中，支持持久化：

```tsx
export const useUserStore = create<UserState>()(
  persist(
    // ... store 配置
    {
      name: 'user-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
```

### 2. 权限更新

当用户权限发生变化时，需要更新权限缓存：

```tsx
const { setUserInfo } = useUserStore();

// 重新获取用户信息（包含最新权限）
const userData = await getProfile();
setUserInfo(userData);
```

### 3. 权限验证中间件

可以在路由层面添加权限验证中间件，自动检查路由权限。
