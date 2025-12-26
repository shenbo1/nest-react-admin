import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Spin } from 'antd';
import BasicLayout from './layouts/BasicLayout';
import AuthRoute from './components/AuthRoute';
import { DASHBOARD, SYSTEM, MALL, ARTICLE } from './constants/permissions';

// 懒加载页面
const Login = lazy(() => import('./pages/login'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const UserList = lazy(() => import('./pages/system/user'));
const RoleList = lazy(() => import('./pages/system/role'));
const MenuList = lazy(() => import('./pages/system/menu'));
const DeptList = lazy(() => import('./pages/system/dept'));
const DictList = lazy(() => import('./pages/dict/dict'));
const OperLogList = lazy(() => import('./pages/system/operlog'));
const LoginLogList = lazy(() => import('./pages/system/loginlog'));
const ConfigList = lazy(() => import('./pages/system/config'));
const NoticeList = lazy(() => import('./pages/system/notice'));
const Codegen = lazy(() => import('./pages/system/codegen'));
const JobList = lazy(() => import('./pages/system/job'));
const JobMonitor = lazy(() => import('./pages/system/job-monitor'));
const ProductList = lazy(() => import('./pages/mall/product'));
const CategoryList = lazy(() => import('./pages/mall/category'));
const OrderList = lazy(() => import('./pages/mall/order'));
const MemberList = lazy(() => import('./pages/mall/member'));
const BannerList = lazy(() => import('./pages/mall/banner'));
const ProductSpecGroupList = lazy(() => import('./pages/mall/product-spec-group'));
const ProductSpecValueList = lazy(() => import('./pages/mall/product-spec-value'));
const ProductSkuList = lazy(() => import('./pages/mall/product-sku'));
const ArticleList = lazy(() => import('./pages/article'));
const CacheList = lazy(() => import('./pages/system/cache'));
const SessionList = lazy(() => import('./pages/system/session'));
const DatabaseMonitor = lazy(() => import('./pages/system/database-monitor'));
const ApiMonitor = lazy(() => import('./pages/system/api-monitor'));
const LogMonitor = lazy(() => import('./pages/system/log-monitor'));
const AlertManagement = lazy(() => import('./pages/system/alert'));

const Loading = () => (
  <div className="flex items-center justify-center h-full">
    <Spin size="large" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <AuthRoute>
                <BasicLayout />
              </AuthRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <AuthRoute requiredPermission={DASHBOARD.LIST}>
                  <Dashboard />
                </AuthRoute>
              }
            />
            <Route path="system">
              <Route
                path="user"
                element={
                  <AuthRoute requiredPermission={SYSTEM.USER.LIST}>
                    <UserList />
                  </AuthRoute>
                }
              />
              <Route
                path="role"
                element={
                  <AuthRoute requiredPermission={SYSTEM.ROLE.LIST}>
                    <RoleList />
                  </AuthRoute>
                }
              />
              <Route
                path="menu"
                element={
                  <AuthRoute requiredPermission={SYSTEM.MENU.LIST}>
                    <MenuList />
                  </AuthRoute>
                }
              />
              <Route
                path="dept"
                element={
                  <AuthRoute requiredPermission={SYSTEM.DEPT.LIST}>
                    <DeptList />
                  </AuthRoute>
                }
              />
              <Route
                path="dict"
                element={
                  <AuthRoute requiredPermission={SYSTEM.DICT.LIST}>
                    <DictList />
                  </AuthRoute>
                }
              />
              <Route
                path="config"
                element={
                  <AuthRoute requiredPermission={SYSTEM.CONFIG.LIST}>
                    <ConfigList />
                  </AuthRoute>
                }
              />
              <Route
                path="notice"
                element={
                  <AuthRoute requiredPermission={SYSTEM.NOTICE.LIST}>
                    <NoticeList />
                  </AuthRoute>
                }
              />
              <Route
                path="codegen"
                element={
                  <AuthRoute requiredPermission={SYSTEM.CODEGEN.LIST}>
                    <Codegen />
                  </AuthRoute>
                }
              />
              <Route
                path="job"
                element={
                  <AuthRoute requiredPermission={SYSTEM.JOB.LIST}>
                    <JobList />
                  </AuthRoute>
                }
              />
              <Route
                path="job-monitor"
                element={
                  <AuthRoute requiredPermission={SYSTEM.JOB.MONITOR}>
                    <JobMonitor />
                  </AuthRoute>
                }
              />
              <Route
                path="cache"
                element={
                  <AuthRoute requiredPermission={SYSTEM.CACHE.QUERY}>
                    <CacheList />
                  </AuthRoute>
                }
              />
              <Route
                path="session"
                element={
                  <AuthRoute requiredPermission={SYSTEM.SESSION.QUERY}>
                    <SessionList />
                  </AuthRoute>
                }
              />
            </Route>

            {/* 日志管理模块 */}
            <Route path="log">
              <Route
                path="operlog"
                element={
                  <AuthRoute requiredPermission={SYSTEM.LOG.OPERLOG.LIST}>
                    <OperLogList />
                  </AuthRoute>
                }
              />
              <Route
                path="loginlog"
                element={
                  <AuthRoute requiredPermission={SYSTEM.LOG.LOGINLOG.LIST}>
                    <LoginLogList />
                  </AuthRoute>
                }
              />
            </Route>

            {/* 监控管理模块 */}
            <Route path="monitor">
              <Route
                path="database"
                element={
                  <AuthRoute requiredPermission={SYSTEM.MANAGE}>
                    <DatabaseMonitor />
                  </AuthRoute>
                }
              />
              <Route
                path="api"
                element={
                  <AuthRoute requiredPermission={SYSTEM.MANAGE}>
                    <ApiMonitor />
                  </AuthRoute>
                }
              />
              <Route
                path="log"
                element={
                  <AuthRoute requiredPermission={SYSTEM.MANAGE}>
                    <LogMonitor />
                  </AuthRoute>
                }
              />
              <Route
                path="alert"
                element={
                  <AuthRoute requiredPermission={SYSTEM.MANAGE}>
                    <AlertManagement />
                  </AuthRoute>
                }
              />
            </Route>
            <Route path="mall">
              <Route
                path="product"
                element={
                  <AuthRoute requiredPermission={MALL.PRODUCT.LIST}>
                    <ProductList />
                  </AuthRoute>
                }
              />
              <Route
                path="category"
                element={
                  <AuthRoute requiredPermission={MALL.CATEGORY.LIST}>
                    <CategoryList />
                  </AuthRoute>
                }
              />
              <Route
                path="order"
                element={
                  <AuthRoute requiredPermission={MALL.ORDER.LIST}>
                    <OrderList />
                  </AuthRoute>
                }
              />
              <Route
                path="member"
                element={
                  <AuthRoute requiredPermission={MALL.MEMBER.LIST}>
                    <MemberList />
                  </AuthRoute>
                }
              />
              <Route
                path="banner"
                element={
                  <AuthRoute requiredPermission={MALL.BANNER.LIST}>
                    <BannerList />
                  </AuthRoute>
                }
              />
              <Route
                path="spec-group"
                element={
                  <AuthRoute requiredPermission={MALL.PRODUCT_SPEC_GROUP.LIST}>
                    <ProductSpecGroupList />
                  </AuthRoute>
                }
              />
              <Route
                path="spec-value"
                element={
                  <AuthRoute requiredPermission={MALL.PRODUCT_SPEC_VALUE.LIST}>
                    <ProductSpecValueList />
                  </AuthRoute>
                }
              />
              <Route
                path="sku"
                element={
                  <AuthRoute requiredPermission={MALL.PRODUCT_SKU.LIST}>
                    <ProductSkuList />
                  </AuthRoute>
                }
              />
            </Route>
            <Route
              path="article"
              element={
                <AuthRoute requiredPermission={ARTICLE.LIST}>
                  <ArticleList />
                </AuthRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
