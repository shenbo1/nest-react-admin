# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nest React Admin is a monorepo admin system built with NestJS + React 19 + Prisma + Ant Design. Uses pnpm workspaces with two main applications.

**Tech Stack:**
- Backend: NestJS, Prisma ORM, PostgreSQL, Redis
- Frontend: React 19, Ant Design 5.x, TanStack Query, Zustand, React Router 7

## Common Commands

```bash
# Development
pnpm dev              # Start both backend and frontend
pnpm dev:api          # Start backend only (http://localhost:8080)
pnpm dev:web          # Start frontend only (http://localhost:3000)

# Database
pnpm db:generate      # Generate Prisma Client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run Prisma migrations
pnpm db:seed          # Initialize seed data
pnpm db:studio        # Open Prisma Studio

# Build
pnpm build            # Build all apps
pnpm build:api        # Build backend only
pnpm build:web        # Build frontend only

# Other
pnpm lint             # Run linting
pnpm gen:module       # Generate new module scaffold
```

**Prerequisites:** Docker must be running for PostgreSQL and Redis.

## Architecture

### Monorepo Structure

```
apps/
├── admin-api/           # NestJS backend
│   └── src/
│       ├── common/      # Shared (Prisma, Redis, guards, interceptors)
│       ├── config/      # Configuration
│       └── modules/     # Business modules
└── admin-web/           # React frontend
    └── src/
        ├── components/  # Shared components
        ├── constants/   # Constants (permissions.ts)
        ├── layouts/     # Layout components
        ├── pages/       # Page components
        ├── services/    # API services
        ├── stores/      # Zustand stores
        └── utils/       # Utilities
```

### Backend Module Pattern

Each module follows this structure:
```
modules/{module-name}/
├── {module}.module.ts      # Module definition
├── {module}.controller.ts  # REST API endpoints
├── {module}.service.ts     # Business logic
└── dto/                    # Data transfer objects
    ├── create-{module}.dto.ts
    ├── update-{module}.dto.ts
    └── query-{module}.dto.ts
```

### CRUD Pattern (Backend)

```typescript
// Controller uses @RequirePermissions guard for RBAC
@RequirePermissions('system:user:add')
@Post()
create(@Body() dto: CreateDto) {
  return this.service.create(dto);
}

// Service handles business logic with Prisma
async findAll(query: QueryDto) {
  const { page = 1, pageSize = 10 } = query;
  const [data, total] = await Promise.all([
    this.prisma.entity.findMany({ skip, take: pageSize, ... }),
    this.prisma.entity.count({ where }),
  ]);
  return new PaginatedResult(data, total, page, pageSize);
}
```

### Frontend Page Pattern

```typescript
// Pages use ProTable + ModalForm pattern
const UserList: React.FC = () => {
  const tableRef = useRef<ProTableRef>();
  const queryClient = useQueryClient();

  // React Query for data fetching
  const { data } = useQuery({ queryKey: ['key'], queryFn: api.list });

  // useMutation for operations
  const mutation = useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      message.success('Success');
      tableRef.current?.reload();
    },
  });

  const columns: ProColumns<Type>[] = [
    { title: 'Name', dataIndex: 'name' },
    // ...
  ];

  return (
    <ProTable columns={columns} request={fetchData} toolBarRender={() => [...]} />
  );
};
```

## Permission System

### Backend RBAC
- `RequirePermissions` decorator guards API endpoints
- `PermissionsGuard` checks user permissions against required ones
- Super admin role bypasses all permission checks

### Frontend Permission Constants
```typescript
// apps/admin-web/src/constants/permissions.ts
export const SYSTEM = {
  USER: { LIST: 'system:user:list', ADD: 'system:user:add', ... },
  // ...
} as const;
```

### Permission Components
- `AuthRoute` - Route guard with permission check
- `PermissionButton` - Button that respects permissions (hide/disabled fallback)

## Adding New Features

### Backend Module
1. Create `apps/admin-api/src/modules/{name}/`
2. Create module/controller/service/dto files
3. Register module in `app.module.ts`
4. Add permissions to seed.ts for menu generation

### Frontend Page
1. Create `apps/admin-web/src/pages/{module}/index.tsx`
2. Create `apps/admin-web/src/services/{module}.ts`
3. Add permissions to `constants/permissions.ts`
4. Register route in `App.tsx` with `AuthRoute` wrapper
5. Add menu item in `layouts/BasicLayout.tsx`

## Key Files

| Purpose | Path |
|---------|------|
| Backend entry | `apps/admin-api/src/app.module.ts` |
| Frontend entry | `apps/admin-web/src/App.tsx` |
| Permissions | `apps/admin-web/src/constants/permissions.ts` |
| User store | `apps/admin-web/src/stores/user.ts` |
| API client | `apps/admin-web/src/utils/request.ts` |
| Seed data | `apps/admin-api/prisma/seed.ts` |
| Prisma schema | `apps/admin-api/prisma/schema.prisma` |

## Database

- PostgreSQL on port 5432
- Redis on port 6379
- Default credentials in `.env.example`

## API Documentation

Swagger docs available at http://localhost:8080/docs when backend is running.

## Response Language

Always use Simplified Chinese (中文) for all responses and documentation.

## Frontend UI Rules

### ProAntd Component Usage
- **优先使用项目内组件**：始终优先使用 `/apps/admin-web/src/components/` 目录下的自定义组件
- **ProTable 使用**：数据表格统一使用项目内的 ProTable 组件 (`/apps/admin-web/src/components/ProTable`)
- **ProComponents 库**：需要额外 ProComponents 时，优先使用 `@ant-design/pro-components`
- **Ant Design 组件**：基础组件使用 Ant Design 6.x，遵循项目已有的组件封装模式
- **组件一致性**：保持与现有页面组件风格一致，使用相同的交互模式

## Frontend-Backend Interaction Rules

### CRUD Pattern Standards

#### Backend API Pattern
```typescript
// Standard RESTful endpoints with RBAC
@Controller('api/system/user')
export class UserController {
  @RequirePermissions('system:user:list')
  @Get()
  findAll(@Query() query: QueryUserDto) { }

  @RequirePermissions('system:user:add')
  @Post()
  create(@Body() dto: CreateUserDto) { }

  @RequirePermissions('system:user:edit')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) { }

  @RequirePermissions('system:user:remove')
  @Delete(':id')
  remove(@Param('id') id: string) { }
}
```

#### Frontend Service Pattern
```typescript
// Service with consistent API methods
export const userService = {
  list: (params?: QueryParams) => request.get('/system/user', { params }),
  create: (data: CreateUserDto) => request.post('/system/user', data),
  update: (id: string, data: UpdateUserDto) => request.put(`/system/user/${id}`, data),
  remove: (id: string) => request.delete(`/system/user/${id}`),
  detail: (id: string) => request.get(`/system/user/${id}`),
};
```

#### Frontend Page Pattern
```typescript
// Standard CRUD page with ProTable
const UserList: React.FC = () => {
  // 1. Table ref for reload
  const tableRef = useRef<ProTableRef>();

  // 2. Mutations for CRUD operations
  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      message.success('创建成功');
      tableRef.current?.reload();
    }
  });

  // 3. Modal state management
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<User>();

  // 4. Standard column actions
  const columns: ProColumns<User>[] = [
    { title: '用户名', dataIndex: 'username' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <PermissionButton
          key="edit"
          permission="system:user:edit"
          onClick={() => handleEdit(record)}
        >
          编辑
        </PermissionButton>,
        <PermissionButton
          key="delete"
          permission="system:user:remove"
          onClick={() => handleDelete(record.id)}
        >
          删除
        </PermissionButton>
      ]
    }
  ];

  return (
    <PageContainer>
      <ProTable
        rowKey="id"
        columns={columns}
        request={userService.list}
        actionRef={tableRef}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission="system:user:add"
            type="primary"
            onClick={() => setModalVisible(true)}
          >
            新建用户
          </PermissionButton>
        ]}
      />
      <ModalForm
        title={editingRecord ? '编辑用户' : '新建用户'}
        visible={modalVisible}
        onFinish={handleSubmit}
      />
    </PageContainer>
  );
};
```

### Data Fetching Rules
- **统一使用 React Query**：所有异步数据获取使用 `useQuery` 和 `useMutation`
- **查询键规范**：使用数组格式，如 `['user', 'list']`、`['user', 'detail', id]`
- **缓存策略**：列表数据默认缓存 5 分钟，详情数据缓存 10 分钟
- **错误处理**：统一使用 `message.error` 显示错误信息

### API Response Standard
```typescript
// 统一响应格式
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 分页响应格式
interface PaginatedResponse<T> {
  code: number;
  message: string;
  data: {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
  };
}
```

### Permission Integration
- **按钮级权限**：使用 `PermissionButton` 组件包裹操作按钮
- **权限常量**：统一从 `/apps/admin-web/src/constants/permissions.ts` 导入
- **权限格式**：遵循 `module:submodule:action` 格式，如 `system:user:add`

## Workflow Module Rules

### Backend Controller Pattern
所有工作流 Controller 必须使用 `@RequirePermissions` 装饰器：

```typescript
// 流程分类
@RequirePermissions('workflow:category:add')   // 新增
@RequirePermissions('workflow:category:list')   // 列表/下拉选项
@RequirePermissions('workflow:category:query')  // 详情
@RequirePermissions('workflow:category:edit')   // 更新/状态
@RequirePermissions('workflow:category:remove') // 删除

// 流程定义
@RequirePermissions('workflow:definition:add')     // 新增
@RequirePermissions('workflow:definition:list')    // 列表
@RequirePermissions('workflow:definition:query')   // 详情
@RequirePermissions('workflow:definition:edit')    // 更新/节点配置
@RequirePermissions('workflow:definition:remove')  // 删除
@RequirePermissions('workflow:definition:publish') // 发布
@RequirePermissions('workflow:definition:design')  // 设计

// 流程实例
@RequirePermissions('workflow:instance:list')     // 列表
@RequirePermissions('workflow:instance:query')    // 详情/撤回
@RequirePermissions('workflow:instance:terminate')// 终止

// 任务管理
@RequirePermissions('workflow:task:list')         // 待办/已办列表
@RequirePermissions('workflow:task:query')        // 详情/催办
@RequirePermissions('workflow:task:approve')      // 通过
@RequirePermissions('workflow:task:reject')       // 驳回
@RequirePermissions('workflow:task:transfer')     // 转办
@RequirePermissions('workflow:task:countersign')  // 加签

// 抄送记录
@RequirePermissions('workflow:copy:list')         // 列表
@RequirePermissions('workflow:copy:query')        // 标记已读
```

### Frontend Permission Constants
```typescript
// apps/admin-web/src/constants/permissions.ts
export const WORKFLOW = {
  CATEGORY: {
    LIST: 'workflow:category:list',
    ADD: 'workflow:category:add',
    EDIT: 'workflow:category:edit',
    REMOVE: 'workflow:category:remove',
    QUERY: 'workflow:category:query',
  },
  DEFINITION: {
    LIST: 'workflow:definition:list',
    ADD: 'workflow:definition:add',
    EDIT: 'workflow:definition:edit',
    REMOVE: 'workflow:definition:remove',
    QUERY: 'workflow:definition:query',
    PUBLISH: 'workflow:definition:publish',
    DESIGN: 'workflow:definition:design',
  },
  INSTANCE: {
    LIST: 'workflow:instance:list',
    QUERY: 'workflow:instance:query',
    START: 'workflow:instance:start',
    TERMINATE: 'workflow:instance:terminate',
  },
  TASK: {
    LIST: 'workflow:task:list',
    QUERY: 'workflow:task:query',
    APPROVE: 'workflow:task:approve',
    REJECT: 'workflow:task:reject',
    TRANSFER: 'workflow:task:transfer',
    COUNTERSIGN: 'workflow:task:countersign',
  },
  COPY: {
    LIST: 'workflow:copy:list',
    QUERY: 'workflow:copy:query',
  },
} as const;
```

### Adding Workflow Menus
新增菜单后必须更新 `seed.ts`：

1. **菜单项**：添加到 `menus` 数组
2. **按钮权限**：使用 `buttons()` 或 `button()` 函数创建
3. **ID 规划**：
   - 目录/菜单：400-405
   - 分类按钮：410-414
   - 流程定义按钮：420-424
   - 流程实例按钮：430-434
   - 任务管理按钮：440-444
   - 抄送记录按钮：450-454

```typescript
// 流程定义按钮（示例）
buttons(420, 402, '流程', 'workflow:definition', {
  query: true, add: true, edit: true, remove: true,
  publish: true, disable: true
}),
button(421, 402, '流程设计', 'workflow:definition:design'),
```

## Tree Structure Rules

### Database Design
树形结构使用 `parentId` 字段：
- `parentId = 0` 或 `null` 表示顶级节点
- 子节点通过 `parentId` 关联父节点

### Backend Tree Building
```typescript
// 递归构建树
private buildTree(menus: any[], parentId = 0): any[] {
  return menus
    .filter((menu) => menu.parentId === parentId)
    .map((menu) => ({
      ...menu,
      children: this.buildTree(menus, menu.id),
    }))
    .map((menu) =>
      menu.children.length === 0 ? { ...menu, children: undefined } : menu,
    );
}
```

### Frontend Tree Display (ProTable)
树形列表直接传入树形数据，使用 `expandable` 配置展开：
```typescript
<ProTable
  request={async () => ({
    data: treeData || [],
    total: treeData?.length || 0,
    success: true,
  })}
  columns={columns}
  dataSource={treeData}      // 直接传入树形数据
  rowKey="id"
  search={false}             // 树形列表通常不带搜索
  pagination={false}         // 树形列表通常不分页
  expandable={{ defaultExpandAllRows: true }}
/>
```

### Frontend TreeSelect (下拉树选择)
转换数据格式供 ProFormTreeSelect 使用：
```typescript
const transformTreeData = (nodes: Menu[]): any[] => {
  return nodes.map((node) => ({
    value: node.id,
    title: node.name,
    children: node.children ? transformTreeData(node.children) : undefined,
  }));
};

// 使用
<ProFormTreeSelect
  name="parentId"
  fieldProps={{
    treeData: [{ value: 0, title: '根目录' }, ...transformTreeData(treeData)],
    treeDefaultExpandAll: true,
  }}
/>
```

## 普通列表开发规范

### 标准代码结构
```typescript
const ModuleList: React.FC = () => {
  // 1. 状态管理
  const tableRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<ModuleType | null>(null);
  const queryClient = useQueryClient();

  // 2. 数据操作
  const saveMutation = useMutation({
    mutationFn: (values: CreateModuleDto) => {
      if (editingId) {
        return moduleApi.update(editingId, values);
      }
      return moduleApi.create(values);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: moduleApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      tableRef.current?.reload();
    },
  });

  // 3. 表格列配置
  const columns: ProColumns<ModuleType>[] = [
    { title: '名称', dataIndex: 'name', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        ENABLED: { text: '启用', status: 'Success' },
        DISABLED: { text: '停用', status: 'Error' },
      },
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            type="link"
            size="small"
            permission={SYSTEM.MODULE.EDIT}
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            fallbackMode="disabled"
          >
            编辑
          </PermissionButton>
          <Popconfirm title="确定删除吗？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <PermissionButton
              type="link"
              size="small"
              danger
              permission={SYSTEM.MODULE.REMOVE}
              icon={<DeleteOutlined />}
              fallbackMode="disabled"
            >
              删除
            </PermissionButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 4. 数据获取
  const fetchData = async (params: any) => {
    const { current, pageSize, ...rest } = params;
    const result = await moduleApi.list({
      page: current,
      pageSize,
      ...rest,
    });
    return {
      data: result.data,
      total: result.total,
      success: true,
    };
  };

  // 5. 渲染
  return (
    <>
      <ProTable
        ref={tableRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1000 }}
        request={fetchData}
        search={{ labelWidth: 'auto' }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={SYSTEM.MODULE.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增
          </PermissionButton>,
        ]}
      />

      <ModalForm
        title={editingId ? '编辑' : '新增'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        width={600}
        initialValues={editingRecord || { status: 'ENABLED' }}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
      >
        {/* 表单字段 */}
      </ModalForm>
    </>
  );
};
```

### 核心规则
1. **状态管理**：使用 `useRef<ProTableRef>` 获取表格实例，统一管理弹窗状态
2. **数据操作**：新增/更新使用单个 `useMutation`，通过 `editingId` 区分
3. **表格配置**：
   - rowKey 使用唯一标识字段
   - 操作列固定右侧，宽度 180-240
   - 启用分页和搜索
4. **权限控制**：所有操作按钮使用 `PermissionButton` 组件
5. **消息提示**：统一使用 `message.success/error`
6. **数据缓存**：操作成功后失效相关查询缓存

### 列宽建议
- 名称类：120-150
- 时间类：160-180
- 状态类：80-100
- 操作列：180-240（固定右侧）

### 图标规范
- 新增：`<PlusOutlined />`
- 编辑：`<EditOutlined />`
- 删除：`<DeleteOutlined />`

### 完整规范文档
详见：`/docs/普通列表开发规范.md`
