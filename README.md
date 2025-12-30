# Nest React Admin

基于 NestJS + React 19 + Prisma + Ant Design 的后台管理系统

## 技术栈

### 后端
- **框架**: NestJS
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **认证**: JWT + Passport
- **文档**: Swagger

### 前端
- **框架**: React 19
- **UI 组件**: Ant Design 6.x + ProComponents
- **状态管理**: Zustand
- **请求**: Axios + TanStack Query
- **路由**: React Router 7
- **样式**: Tailwind CSS

## 快速开始

### 环境要求
- Node.js >= 20
- pnpm >= 9
- Docker (用于运行 PostgreSQL 和 Redis)

### 配置环境变量

```bash
# 后端配置（NestJS 读取 .env 或 .env.local）
cp .env.example apps/admin-api/.env

# 前端配置
cp apps/admin-web/.env.example apps/admin-web/.env
```

### 安装依赖

```bash
pnpm install
```

### 启动数据库

```bash
docker-compose up -d
```

### 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送数据库结构
pnpm db:push

# 初始化种子数据
pnpm db:seed
```

### 常用脚本

```bash
pnpm dev         # 同时启动前后端
pnpm dev:api     # 启动后端
pnpm dev:web     # 启动前端
pnpm db:migrate  # Prisma migrate
pnpm db:studio   # Prisma Studio
pnpm lint        # 代码检查
pnpm gen:module  # 生成新模块
```

### 启动开发服务

```bash
# 同时启动前后端
pnpm dev

# 或分别启动
pnpm dev:api   # 后端 http://localhost:8080
pnpm dev:web   # 前端 http://localhost:3000
```

### 默认账号

- 用户名: `admin`
- 密码: `admin123`

## 生产环境部署

### 方式一：Docker Compose（推荐）

```bash
# 1. 配置生产环境变量
cp .env.production .env
# 编辑 .env，修改 JWT_SECRET 和其他敏感配置

# 2. 构建并启动所有服务
docker compose up -d --build

# 3. 初始化数据库
docker exec -it nest-react-admin-api sh
pnpm db:generate
pnpm db:migrate deploy
exit

# 4. 查看日志
docker compose logs -f
```

### 方式二：手动部署

```bash
# 1. 安装 Node.js 20+ 和 pnpm

# 2. 安装依赖
pnpm install

# 3. 构建
pnpm build

# 4. 启动后端
cd apps/admin-api
pnpm start:prod

# 5. 构建前端
cd apps/admin-web
pnpm build

# 6. 使用 Nginx 托管前端静态文件
```

### 访问地址

| 环境 | 地址 |
|------|------|
| 开发前端 | http://localhost:3000 |
| 开发后端 API | http://localhost:8080 |
| 生产环境 | http://服务器IP |
| API 文档 | http://localhost:8080/docs |

### Docker 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 80 | Nginx 托管 |
| 后端 API | 8080 | NestJS |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |

## 项目结构

```
nest-react-admin/
├── apps/
│   ├── admin-api/          # NestJS 后端
│   │   ├── src/
│   │   │   ├── common/     # 公共模块
│   │   │   └── modules/    # 业务模块
│   │   ├── prisma/         # Prisma 配置
│   │   └── Dockerfile      # Docker 构建
│   │
│   ├── admin-web/          # React 前端
│   │   ├── src/
│   │   │   ├── components/ # 组件
│   │   │   ├── layouts/    # 布局
│   │   │   ├── pages/      # 页面
│   │   │   ├── services/   # API 服务
│   │   │   ├── stores/     # 状态管理
│   │   │   └── utils/      # 工具函数
│   │   ├── Dockerfile      # Docker 构建
│   │   └── nginx.conf      # Nginx 配置
│   │
│   └── admin-api-gateway/  # API 网关（可选）
│
├── docker-compose.yml      # Docker 编排配置
├── .env.production         # 生产环境变量模板
└── pnpm-workspace.yaml     # Monorepo 配置
```

## 功能模块

- [x] 用户管理
- [x] 角色管理
- [x] 菜单管理
- [x] 部门管理
- [x] 字典管理
- [x] 参数配置
- [x] 通知公告
- [x] 操作日志
- [x] 登录日志
- [x] 代码生成

## 前端 UI 使用规范

### ProAntd 组件使用原则
- **优先使用项目内组件**：始终优先使用 `/apps/admin-web/src/components/` 目录下的自定义组件
- **ProTable 使用**：数据表格统一使用项目内的 ProTable 组件 (`/apps/admin-web/src/components/ProTable`)
- **ProComponents 库**：需要额外 ProComponents 时，优先使用 `@ant-design/pro-components`
- **Ant Design 组件**：基础组件使用 Ant Design 6.x，遵循项目已有的组件封装模式
- **组件一致性**：保持与现有页面组件风格一致，使用相同的交互模式

## 前后端交互规范

### CRUD 标准模式

#### 后端 API 规范
```typescript
// 标准 RESTful 端点带 RBAC 权限控制
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

#### 前端服务层规范
```typescript
// 统一的服务方法定义
export const userService = {
  list: (params?: QueryParams) => request.get('/system/user', { params }),
  create: (data: CreateUserDto) => request.post('/system/user', data),
  update: (id: string, data: UpdateUserDto) => request.put(`/system/user/${id}`, data),
  remove: (id: string) => request.delete(`/system/user/${id}`),
  detail: (id: string) => request.get(`/system/user/${id}`),
};
```

#### 前端页面规范
```typescript
// 标准 CRUD 页面使用 ProTable
const UserList: React.FC = () => {
  // 1. 表格刷新引用
  const tableRef = useRef<ProTableRef>();

  // 2. 增删改查的 mutations
  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      message.success('创建成功');
      tableRef.current?.reload();
    }
  });

  // 3. 弹窗状态管理
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<User>();

  // 4. 标准操作列
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

### 数据获取规则
- **统一使用 React Query**：所有异步数据获取使用 `useQuery` 和 `useMutation`
- **查询键规范**：使用数组格式，如 `['user', 'list']`、`['user', 'detail', id]`
- **缓存策略**：列表数据默认缓存 5 分钟，详情数据缓存 10 分钟
- **错误处理**：统一使用 `message.error` 显示错误信息

### API 响应标准
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

### 权限集成规范
- **按钮级权限**：使用 `PermissionButton` 组件包裹操作按钮
- **权限常量**：统一从 `/apps/admin-web/src/constants/permissions.ts` 导入
- **权限格式**：遵循 `module:submodule:action` 格式，如 `system:user:add`

## API 文档

启动后端后访问: http://localhost:8080/docs

## 环境变量配置

### 后端 (apps/admin-api/.env)
| 变量 | 说明 | 默认值 |
|------|------|--------|
| APP_PORT | 后端服务端口 | 8080 |
| APP_PREFIX | API 前缀 | api |
| DATABASE_URL | 数据库连接 | - |
| REDIS_HOST | Redis 地址 | localhost |
| REDIS_PORT | Redis 端口 | 6379 |
| JWT_SECRET | JWT 密钥 | - |
| JWT_EXPIRES_IN | Token 过期时间 | 7d |

### 前端 (apps/admin-web/.env)
| 变量 | 说明 | 默认值 |
|------|------|--------|
| VITE_PORT | 前端服务端口 | 3000 |
| VITE_API_BASE_URL | 后端 API 地址 | http://localhost:8080 |

## License

MIT
