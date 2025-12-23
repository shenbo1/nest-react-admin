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
const ProductList = lazy(() => import('./pages/mall/product'));
const CategoryList = lazy(() => import('./pages/mall/category'));
const OrderList = lazy(() => import('./pages/mall/order'));
const MemberList = lazy(() => import('./pages/mall/member'));
const BannerList = lazy(() => import('./pages/mall/banner'));
const ProductSpecGroupList = lazy(() => import('./pages/mall/product-spec-group'));
const ProductSpecValueList = lazy(() => import('./pages/mall/product-spec-value'));
const ProductSkuList = lazy(() => import('./pages/mall/product-sku'));
const ArticleList = lazy(() => import('./pages/article'));

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
                path="product-spec-group"
                element={
                  <AuthRoute requiredPermission={MALL.PRODUCT_SPEC_GROUP.LIST}>
                    <ProductSpecGroupList />
                  </AuthRoute>
                }
              />
              <Route
                path="product-spec-value"
                element={
                  <AuthRoute requiredPermission={MALL.PRODUCT_SPEC_VALUE.LIST}>
                    <ProductSpecValueList />
                  </AuthRoute>
                }
              />
              <Route
                path="product-sku"
                element={
                  <AuthRoute requiredPermission={MALL.PRODUCT_SKU.LIST}>
                    <ProductSkuList />
                  </AuthRoute>
                }
              />
            </Route>
            <Route
              path="article/list"
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
