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
- **UI 组件**: Ant Design 5.x
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

## 项目结构

```
nest-react-admin/
├── apps/
│   ├── admin-api/          # NestJS 后端
│   │   ├── src/
│   │   │   ├── common/     # 公共模块
│   │   │   └── modules/    # 业务模块
│   │   └── prisma/         # Prisma 配置
│   │
│   └── admin-web/          # React 前端
│       └── src/
│           ├── components/ # 组件
│           ├── layouts/    # 布局
│           ├── pages/      # 页面
│           ├── services/   # API 服务
│           ├── stores/     # 状态管理
│           └── utils/      # 工具函数
│
├── docker-compose.yml      # Docker 配置
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
