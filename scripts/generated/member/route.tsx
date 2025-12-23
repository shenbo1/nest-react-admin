
// ============================================================
// 会员管理路由配置 - 请添加到 src/App.tsx
// ============================================================

// 1. 添加懒加载导入
const MemberList = lazy(() => import('./pages/member'));

// 2. 添加路由配置 (在 <Routes> 中添加)
<Route
  path="member"
  element={
    <AuthRoute requiredPermission={MEMBER.LIST}>
      <MemberList />
    </AuthRoute>
  }
/>

// 3. 添加权限常量导入
import { MEMBER } from './constants/permissions';
