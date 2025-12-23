# 模块代码生成器

一键生成 NestJS + React 模块代码的自动化工具。

## 功能特点

- ✨ **一键生成**：自动创建所有必需的文件
- 🎯 **完整覆盖**：后端 + 前端 + 配置
- 📝 **规范化**：遵循项目最佳实践
- 🔧 **可定制**：支持中文名、菜单 ID 等选项
- 📊 **彩色输出**：清晰的生成进度提示

## 文件生成清单

### 后端 (apps/admin-api)

| 文件 | 路径 |
|------|------|
| Prisma 模型 | `prisma/{module}.prisma` |
| 模块定义 | `src/modules/{module}/{module}.module.ts` |
| 控制器 | `src/modules/{module}/{module}.controller.ts` |
| 服务层 | `src/modules/{module}/{module}.service.ts` |
| 创建 DTO | `src/modules/{module}/dto/create-{module}.dto.ts` |
| 更新 DTO | `src/modules/{module}/dto/update-{module}.dto.ts` |
| 查询 DTO | `src/modules/{module}/dto/query-{module}.dto.ts` |

### 前端 (apps/admin-web)

| 文件 | 路径 |
|------|------|
| 页面组件 | `src/pages/{module}/index.tsx` |
| API 服务 | `src/services/{module}.ts` |

### 配置参考 (scripts/generated/{module})

| 文件 | 用途 |
|------|------|
| `permissions.ts` | 权限常量参考 |
| `seed-menu.ts` | 种子文件菜单配置 |
| `route.tsx` | 前端路由配置 |

## 使用方法

### 基本命令

```bash
# 生成模块（默认中文名为"模块名+管理"）
pnpm gen:module article

# 指定中文名
pnpm gen:module product --cn 商品

# 指定菜单起始 ID
pnpm gen:module order --id 300

# 查看帮助
pnpm gen:module --help
```

### 命令参数

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--cn` | - | `{module}管理` | 模块中文名称 |
| `--id` | - | 200 | 菜单起始 ID（避免冲突） |
| `--help` | `-h` | - | 显示帮助信息 |

### 使用示例

```bash
# 生成文章管理模块
pnpm gen:module article --cn 文章

# 生成商品模块
pnpm gen:module product --cn 商品管理

# 生成订单模块（指定 ID 避免冲突）
pnpm gen:module order --cn 订单 --id 350
```

## 生成后操作

代码生成器会自动创建所有文件，并提供详细的操作指南：

### 1. 数据库操作

```bash
# 生成 Prisma Client
pnpm db:generate

# 执行数据库迁移
pnpm db:migrate
```

### 2. 注册后端模块

编辑 `apps/admin-api/src/app.module.ts`：

```typescript
import { Module } from '@nestjs/common';
import { ArticleModule } from './modules/article/article.module';

@Module({
  imports: [
    // ... 其他模块
    ArticleModule,
  ],
})
export class AppModule {}
```

### 3. 添加权限常量

编辑 `apps/admin-web/src/constants/permissions.ts`，参考 `scripts/generated/{module}/permissions.ts`：

```typescript
export const ARTICLE = {
  LIST: 'article:list',
  ADD: 'article:add',
  EDIT: 'article:edit',
  REMOVE: 'article:remove',
  QUERY: 'article:query',
  EXPORT: 'article:export',
};
```

### 4. 添加前端路由

编辑 `apps/admin-web/src/App.tsx`，参考 `scripts/generated/{module}/route.tsx`：

```typescript
import { lazy } from 'react';
import { ARTICLE } from './constants/permissions';

// 添加懒加载
const ArticleList = lazy(() => import('./pages/article'));

// 添加路由
<Route
  path="article"
  element={
    <AuthRoute requiredPermission={ARTICLE.LIST}>
      <ArticleList />
    </AuthRoute>
  }
/>
```

### 5. 更新种子文件

编辑 `apps/admin-api/prisma/seed.ts`，参考 `scripts/generated/{module}/seed-menu.ts`，在 `menus` 数组中添加：

```typescript
// 文章管理模块
{
  id: 200,
  parentId: 0,
  name: '文章管理',
  path: '/article',
  type: MenuType.DIR,
  icon: 'AppstoreOutlined',
  sort: 10,
  perms: 'article:manage'
},
{
  id: 201,
  parentId: 200,
  name: '文章列表',
  path: '/article/list',
  component: 'article/index',
  type: MenuType.MENU,
  icon: 'UnorderedListOutlined',
  sort: 1,
  perms: 'article:list'
},
// ... 按钮权限
```

### 6. 运行种子文件

```bash
pnpm db:seed
```

### 7. 启动开发服务器

```bash
pnpm dev
```

## 菜单 ID 规划

为避免菜单 ID 冲突，建议按以下规则分配：

| ID 范围 | 用途 |
|---------|------|
| 1-9 | 首页、仪表盘 |
| 10-99 | 系统管理 |
| 100-199 | 系统管理按钮权限 |
| 200-299 | 业务模块 A |
| 300-399 | 业务模块 B |
| 400-499 | 业务模块 C |

## 自定义代码模板

生成器脚本位于 `scripts/generate-module.ts`，可根据需要修改模板内容。

## 注意事项

1. 模块名必须以小写字母开头，只能包含小写字母、数字和连字符
2. 生成前会检查目录是否存在同名模块
3. 生成的文件符合项目规范，可直接使用
4. 建议使用英文模块名，中文名通过 `--cn` 参数指定
5. 菜单 ID 默认从 200 开始，可通过 `--id` 参数调整

## 故障排除

### 错误：模块目录已存在

如果提示目录已存在，说明该模块已存在，需要先删除或使用其他模块名。

```bash
rm -rf apps/admin-api/src/modules/{module}
rm -rf apps/admin-web/src/pages/{module}
```

### 错误：Prisma Client 未生成

生成模块后需要手动运行：

```bash
pnpm db:generate
```

### 权限常量不生效

检查是否已正确添加到 `src/constants/permissions.ts` 文件中。

## 技术实现

- **语言**：TypeScript
- **运行时**：Node.js
- **依赖**：无外部依赖（仅使用 Node.js 内置模块）
- **兼容性**：Node.js 20+
