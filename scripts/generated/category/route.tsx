
// ============================================================
// 商品分类路由配置 - 请添加到 src/App.tsx
// ============================================================

// 1. 添加懒加载导入
const CategoryList = lazy(() => import('./pages/category'));

// 2. 添加路由配置 (在 <Routes> 中添加)
<Route
  path="category"
  element={
    <AuthRoute requiredPermission={CATEGORY.LIST}>
      <CategoryList />
    </AuthRoute>
  }
/>

// 3. 添加权限常量导入
import { CATEGORY } from './constants/permissions';
