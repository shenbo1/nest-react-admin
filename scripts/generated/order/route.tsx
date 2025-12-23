// ============================================================
// 订单管理路由配置 - 请添加到 src/App.tsx
// ============================================================

// 1. 添加懒加载导入
const OrderList = lazy(() => import('./pages/order'));

// 2. 添加路由配置 (在 <Routes> 中添加)
<Route
  path="order"
  element={
    <AuthRoute requiredPermission={ORDER.LIST}>
      <OrderList />
    </AuthRoute>
  }
/>;

// 3. 添加权限常量导入
import { ORDER } from './constants/permissions';
