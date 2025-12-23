
// ============================================================
// 商品管理路由配置 - 请添加到 src/App.tsx
// ============================================================

// 1. 添加懒加载导入
const ProductList = lazy(() => import('./pages/product'));

// 2. 添加路由配置 (在 <Routes> 中添加)
<Route
  path="product"
  element={
    <AuthRoute requiredPermission={PRODUCT.LIST}>
      <ProductList />
    </AuthRoute>
  }
/>

// 3. 添加权限常量导入
import { PRODUCT } from './constants/permissions';
