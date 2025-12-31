import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Spin } from 'antd';
import BasicLayout from './layouts/BasicLayout';
import AuthRoute from './components/AuthRoute';
import { DASHBOARD, SYSTEM, MALL, MEMBER, ARTICLE, WORKFLOW } from './constants/permissions';

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
const ProductEdit = lazy(() => import('./pages/mall/product/edit'));
const ProductDetail = lazy(() => import('./pages/mall/product/detail'));
const CategoryList = lazy(() => import('./pages/mall/category'));
const OrderList = lazy(() => import('./pages/mall/order'));
const MemberList = lazy(() => import('./pages/mall/member'));
const MemberLevelList = lazy(() => import('./pages/mall/member-level'));
const BannerList = lazy(() => import('./pages/mall/banner'));
const ProductSpecManageList = lazy(() => import('./pages/mall/product-spec-group'));
const ProductSkuList = lazy(() => import('./pages/mall/product-sku'));
const ArticleList = lazy(() => import('./pages/article'));
const CacheList = lazy(() => import('./pages/system/cache'));
const SessionList = lazy(() => import('./pages/system/session'));
const DatabaseMonitor = lazy(() => import('./pages/system/database-monitor'));
const ApiMonitor = lazy(() => import('./pages/system/api-monitor'));
const LogMonitor = lazy(() => import('./pages/system/log-monitor'));
const AlertManagement = lazy(() => import('./pages/system/alert'));

// 工作流模块
const FlowDefinitionList = lazy(() => import('./pages/workflow/definition'));
const FlowDesigner = lazy(() => import('./pages/workflow/definition/design'));
const FlowInstanceList = lazy(() => import('./pages/workflow/instance'));
const FlowInstanceDetail = lazy(() => import('./pages/workflow/instance/detail'));
const StartFlow = lazy(() => import('./pages/workflow/instance/start'));
const TaskPending = lazy(() => import('./pages/workflow/task'));
// CopyRecordList 已整合到 TaskPending 页面中
const WorkflowCategoryList = lazy(() => import('./pages/workflow/category'));

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
                path="product/add"
                element={
                  <AuthRoute requiredPermission={MALL.PRODUCT.ADD}>
                    <ProductEdit />
                  </AuthRoute>
                }
              />
              <Route
                path="product/edit/:id"
                element={
                  <AuthRoute requiredPermission={MALL.PRODUCT.EDIT}>
                    <ProductEdit />
                  </AuthRoute>
                }
              />
              <Route
                path="product/detail/:id"
                element={
                  <AuthRoute requiredPermission={MALL.PRODUCT.LIST}>
                    <ProductDetail />
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
                path="banner"
                element={
                  <AuthRoute requiredPermission={MALL.BANNER.LIST}>
                    <BannerList />
                  </AuthRoute>
                }
              />
              <Route
                path="spec"
                element={
                  <AuthRoute requiredPermission={MALL.PRODUCT_SPEC_GROUP.LIST}>
                    <ProductSpecManageList />
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

            {/* 会员管理模块 */}
            <Route path="member">
              <Route
                path="list"
                element={
                  <AuthRoute requiredPermission={MEMBER.MEMBER.LIST}>
                    <MemberList />
                  </AuthRoute>
                }
              />
              <Route
                path="level"
                element={
                  <AuthRoute requiredPermission={MEMBER.LEVEL.LIST}>
                    <MemberLevelList />
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

            {/* 工作流模块 */}
            <Route path="workflow">
              <Route
                path="category"
                element={
                  <AuthRoute requiredPermission={WORKFLOW.CATEGORY.LIST}>
                    <WorkflowCategoryList />
                  </AuthRoute>
                }
              />
              <Route
                path="definition"
                element={
                  <AuthRoute requiredPermission={WORKFLOW.DEFINITION.LIST}>
                    <FlowDefinitionList />
                  </AuthRoute>
                }
              />
              <Route
                path="definition/design/:id"
                element={
                  <AuthRoute requiredPermission={WORKFLOW.DEFINITION.DESIGN}>
                    <FlowDesigner />
                  </AuthRoute>
                }
              />
              <Route
                path="instance"
                element={
                  <AuthRoute requiredPermission={WORKFLOW.INSTANCE.LIST}>
                    <FlowInstanceList />
                  </AuthRoute>
                }
              />
              <Route
                path="instance/detail/:id"
                element={
                  <AuthRoute requiredPermission={WORKFLOW.INSTANCE.QUERY}>
                    <FlowInstanceDetail />
                  </AuthRoute>
                }
              />
              <Route
                path="instance/start"
                element={
                  <AuthRoute requiredPermission={WORKFLOW.INSTANCE.START}>
                    <StartFlow />
                  </AuthRoute>
                }
              />
              <Route
                path="task"
                element={
                  <AuthRoute requiredPermission={WORKFLOW.TASK.LIST}>
                    <TaskPending />
                  </AuthRoute>
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
