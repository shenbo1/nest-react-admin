
// ============================================================
// 运营配置路由配置 - 请添加到 src/App.tsx
// ============================================================

// 1. 添加懒加载导入
const BannerList = lazy(() => import('./pages/banner'));

// 2. 添加路由配置 (在 <Routes> 中添加)
<Route
  path="banner"
  element={
    <AuthRoute requiredPermission={BANNER.LIST}>
      <BannerList />
    </AuthRoute>
  }
/>

// 3. 添加权限常量导入
import { BANNER } from './constants/permissions';
