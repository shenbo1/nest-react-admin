// ============================================================
// article管理路由配置 - 请添加到 src/App.tsx
// ============================================================

// 1. 添加懒加载导入
const ArticleList = lazy(() => import('./pages/article'));

// 2. 添加路由配置 (在 <Routes> 中添加)
<Route
  path="article/list"
  element={
    <AuthRoute requiredPermission={ARTICLE.LIST}>
      <ArticleList />
    </AuthRoute>
  }
/>

// 3. 添加权限常量导入
import { ARTICLE } from './constants/permissions';
