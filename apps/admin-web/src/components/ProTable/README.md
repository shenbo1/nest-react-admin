# 通用 ProTable 组件

自动处理分页参数转换的 ProTable 封装组件。

## 特性

- ✅ 自动处理 `current` → `page` 参数转换
- ✅ 支持简单 API 模式
- ✅ 支持自定义请求函数模式
- ✅ 支持所有 ProTable 原生属性
- ✅ 暴露 `ref` 支持手动刷新

## 使用方法

### 1. 简单 API 模式（推荐）

直接传入 API 地址即可：

```tsx
import { useRef } from 'react';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { PlusOutlined } from '@ant-design/icons';
import PermissionButton from '@/components/PermissionButton';
import { SYSTEM } from '@/constants/permissions';

const NoticeList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);

  const columns: ProColumns<Notice>[] = [
    {
      title: '标题',
      dataIndex: 'title',
    },
    // ... 更多列
  ];

  return (
    <ProTable<Notice>
      ref={tableRef}
      api="/system/notice"
      columns={columns}
      rowKey="id"
      scroll={{ x: 800 }}
      search={{ labelWidth: 'auto' }}
      pagination={{
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条`,
      }}
      toolBarRender={() => [
        <PermissionButton
          key="add"
          permission={SYSTEM.NOTICE.ADD}
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {}}
        >
          新增公告
        </PermissionButton>,
      ]}
    />
  );
};
```

### 2. 刷新表格数据

使用 `ref` 刷新表格：

```tsx
// 创建
const saveMutation = useMutation({
  mutationFn: async (values) => {
    await request.post('/system/notice', values);
  },
  onSuccess: () => {
    message.success('创建成功');
    tableRef.current?.reload(); // 刷新表格
  },
});

// 删除
const deleteMutation = useMutation({
  mutationFn: async (id) => {
    await request.delete(`/system/notice/${id}`);
  },
  onSuccess: () => {
    message.success('删除成功');
    tableRef.current?.reload();
  },
});
```

### 3. 自定义请求函数模式

当需要特殊处理时：

```tsx
const columns: ProColumns<User>[] = [
  // 列定义
];

const fetchUsers = async (params: any) => {
  const result = await request.get('/system/user', { params });
  return {
    data: result.data,
    total: result.total,
    success: true,
  };
};

<ProTable<User>
  request={fetchUsers}
  columns={columns}
  rowKey="id"
/>
```

## API

### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `api` | `string` | API 接口地址（可选） |
| `request` | `function` | 自定义请求函数（可选） |
| `columns` | `ProColumns<T>[]` | 列配置 |
| `rowKey` | `string \| function` | 行键 |
| `ref` | `ProTableRef` | 表格操作引用 |
| 其他 | - | 所有 ProTable 原生属性 |

### Ref 方法

| 方法 | 说明 |
|------|------|
| `reload()` | 刷新当前页 |
| `reloadAndRest()` | 刷新并重置状态 |
| `reset()` | 重置到第一页 |

## 对比

### 之前（需要手动处理分页参数）

```tsx
import { useRef } from 'react';
import { ActionType, ProTable } from '@ant-design/pro-components';

const NoticeList: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const fetchNotices = async (params: any) => {
    const { current, pageSize, ...rest } = params;
    const result = await request.get('/system/notice', {
      params: { page: current, pageSize, ...rest },
    });
    return result;
  };

  return (
    <ProTable<Notice>
      actionRef={actionRef}
      columns={columns}
      request={async (params) => {
        const data = await fetchNotices(params);
        return {
          data: data.data,
          total: data.total,
          success: true,
        };
      }}
    />
  );
};
```

### 现在（自动处理）

```tsx
import ProTable from '@/components/ProTable';

const NoticeList: React.FC = {
  return (
    <ProTable<Notice>
      api="/system/notice"
      columns={columns}
    />
  );
};
```

大大简化了代码！

## 文件位置

`apps/admin-web/src/components/ProTable/index.tsx`

## 示例页面

- `apps/admin-web/src/pages/system/notice/index.tsx` - 已重构使用新组件
