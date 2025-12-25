import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
  TeamOutlined,
  ApartmentOutlined,
  MenuOutlined,
  BookOutlined,
  FileTextOutlined,
  LoginOutlined,
  ToolOutlined,
  NotificationOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  MonitorOutlined,
  ShopOutlined,
  AppstoreOutlined,
  TagsOutlined,
  ShoppingCartOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/stores/user';
import { getProfile, getRouters, logout as logoutApi } from '@/services/system/auth';
import { DASHBOARD, SYSTEM, MALL } from '@/constants/permissions';

const { Header, Sider, Content } = Layout;

// 菜单权限映射 - 暂时注释掉未使用的变量
// const menuPermissions = {
//   '/dashboard': DASHBOARD.LIST,
//   '/system': SYSTEM.MANAGE,
//   '/system/user': SYSTEM.USER.LIST,
//   '/system/role': SYSTEM.ROLE.LIST,
//   '/system/menu': SYSTEM.MENU.LIST,
//   '/system/dept': SYSTEM.DEPT.LIST,
//   '/system/dict': SYSTEM.DICT.LIST,
//   '/system/operlog': SYSTEM.LOG.OPERLOG.LIST,
//   '/system/loginlog': SYSTEM.LOG.LOGINLOG.LIST,
//   '/system/config': SYSTEM.CONFIG.LIST,
//   '/system/notice': SYSTEM.NOTICE.LIST,
//   '/system/codegen': SYSTEM.CODEGEN.LIST,
//   '/mall': MALL.MANAGE,
//   '/mall/product': MALL.PRODUCT.LIST,
//   '/mall/product-spec-group': MALL.PRODUCT_SPEC_GROUP.LIST,
//   '/mall/product-spec-value': MALL.PRODUCT_SPEC_VALUE.LIST,
//   '/mall/product-sku': MALL.PRODUCT_SKU.LIST,
//   '/mall/category': MALL.CATEGORY.LIST,
//   '/mall/order': MALL.ORDER.LIST,
//   '/mall/member': MALL.MEMBER.LIST,
//   '/mall/banner': MALL.BANNER.LIST,
// };

// 硬编码菜单（作为备选方案）
const defaultMenuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '首页',
    permission: DASHBOARD.LIST,
  },
  {
    key: '/system',
    icon: <SettingOutlined />,
    label: '系统管理',
    permission: SYSTEM.MANAGE,
    children: [
      {
        key: '/system/user',
        icon: <UserOutlined />,
        label: '用户管理',
        permission: SYSTEM.USER.LIST,
      },
      {
        key: '/system/role',
        icon: <TeamOutlined />,
        label: '角色管理',
        permission: SYSTEM.ROLE.LIST,
      },
      {
        key: '/system/menu',
        icon: <MenuOutlined />,
        label: '菜单管理',
        permission: SYSTEM.MENU.LIST,
      },
      {
        key: '/system/dept',
        icon: <ApartmentOutlined />,
        label: '部门管理',
        permission: SYSTEM.DEPT.LIST,
      },
      {
        key: '/system/dict',
        icon: <BookOutlined />,
        label: '字典管理',
        permission: SYSTEM.DICT.LIST,
      },
      {
        key: '/system/operlog',
        icon: <FileTextOutlined />,
        label: '操作日志',
        permission: SYSTEM.LOG.OPERLOG.LIST,
      },
      {
        key: '/system/loginlog',
        icon: <LoginOutlined />,
        label: '登录日志',
        permission: SYSTEM.LOG.LOGINLOG.LIST,
      },
      {
        key: '/system/config',
        icon: <ToolOutlined />,
        label: '参数设置',
        permission: SYSTEM.CONFIG.LIST,
      },
      {
        key: '/system/notice',
        icon: <NotificationOutlined />,
        label: '通知公告',
        permission: SYSTEM.NOTICE.LIST,
      },
      {
        key: '/system/codegen',
        icon: <CodeOutlined />,
        label: '代码生成',
        permission: SYSTEM.CODEGEN.LIST,
      },
      {
        key: '/system/job',
        icon: <ClockCircleOutlined />,
        label: '定时任务',
        permission: SYSTEM.JOB.LIST,
      },
      {
        key: '/system/job-monitor',
        icon: <MonitorOutlined />,
        label: '任务监控',
        permission: SYSTEM.JOB.MONITOR,
      },
    ],
  },
  {
    key: '/mall',
    icon: <ShopOutlined />,
    label: '商城管理',
    permission: MALL.MANAGE,
    children: [
      {
        key: '/mall/product',
        icon: <AppstoreOutlined />,
        label: '商品管理',
        permission: MALL.PRODUCT.LIST,
      },
      {
        key: '/mall/product-spec-group',
        icon: <TagsOutlined />,
        label: '商品规格组',
        permission: MALL.PRODUCT_SPEC_GROUP.LIST,
      },
      {
        key: '/mall/product-spec-value',
        icon: <TagsOutlined />,
        label: '商品规格值',
        permission: MALL.PRODUCT_SPEC_VALUE.LIST,
      },
      {
        key: '/mall/product-sku',
        icon: <ShoppingCartOutlined />,
        label: 'SKU管理',
        permission: MALL.PRODUCT_SKU.LIST,
      },
      {
        key: '/mall/category',
        icon: <TagsOutlined />,
        label: '分类管理',
        permission: MALL.CATEGORY.LIST,
      },
      {
        key: '/mall/order',
        icon: <ShoppingCartOutlined />,
        label: '订单管理',
        permission: MALL.ORDER.LIST,
      },
      {
        key: '/mall/member',
        icon: <UserOutlined />,
        label: '会员管理',
        permission: MALL.MEMBER.LIST,
      },
      {
        key: '/mall/banner',
        icon: <PictureOutlined />,
        label: '运营配置',
        permission: MALL.BANNER.LIST,
      },
    ],
  },
];

const BasicLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [menuData, setMenuData] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, setUserInfo, logout, hasPermission, token } =
    useUserStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    if (!token) return;
    let isCancelled = false;

    const initUserAndMenus = async () => {
      try {
        // 获取用户信息（包含权限）
        if (!userInfo) {
          const userData = await getProfile();
          if (isCancelled) return;
          setUserInfo(userData);
        }
      } catch (error) {
        console.error('初始化用户信息失败:', error);
      }

      try {
        // 尝试获取动态菜单
        const routers = await getRouters();
        if (isCancelled) return;
        if (routers && routers.length > 0) {
          // 将后端菜单转换为前端格式
          const convertedMenus = convertBackendMenus(routers);
          setMenuData(convertedMenus);
        } else {
          // 使用默认菜单并过滤权限
          const filteredMenus = filterMenusByPermission(defaultMenuItems);
          setMenuData(filteredMenus);
        }
      } catch (error) {
        // 如果获取动态菜单失败，使用默认菜单并过滤权限
        const filteredMenus = filterMenusByPermission(defaultMenuItems);
        setMenuData(filteredMenus);
      }
    };

    initUserAndMenus();

    return () => {
      isCancelled = true;
    };
  }, [token, userInfo, setUserInfo, hasPermission]);

  // 过滤菜单项（根据权限）
  const filterMenusByPermission = (menus: any[]): any[] => {
    return menus
      .filter((menu) => {
        // 检查当前菜单权限
        if (menu.permission && !hasPermission(menu.permission)) {
          return false;
        }
        return true;
      })
      .map((menu) => {
        // 递归处理子菜单
        if (menu.children) {
          const filteredChildren = filterMenusByPermission(menu.children);
          // 如果子菜单全部被过滤掉，当前菜单也不显示
          if (filteredChildren.length === 0 && menu.children.length > 0) {
            return null;
          }
          return { ...menu, children: filteredChildren };
        }
        return menu;
      })
      .filter(Boolean);
  };

  // 转换后端菜单格式
  const convertBackendMenus = (menus: any[]): any[] => {
    const iconMap: Record<string, React.ReactNode> = {
      DashboardOutlined: <DashboardOutlined />,
      UserOutlined: <UserOutlined />,
      TeamOutlined: <TeamOutlined />,
      MenuOutlined: <MenuOutlined />,
      ApartmentOutlined: <ApartmentOutlined />,
      BookOutlined: <BookOutlined />,
      SettingOutlined: <SettingOutlined />,
      FileTextOutlined: <FileTextOutlined />,
      LoginOutlined: <LoginOutlined />,
      ToolOutlined: <ToolOutlined />,
      NotificationOutlined: <NotificationOutlined />,
      CodeOutlined: <CodeOutlined />,
      ShopOutlined: <ShopOutlined />,
      AppstoreOutlined: <AppstoreOutlined />,
      TagsOutlined: <TagsOutlined />,
      ShoppingCartOutlined: <ShoppingCartOutlined />,
      PictureOutlined: <PictureOutlined />,
    };

    return menus
      .filter((menu) => menu.visible)
      .map((menu) => {
        const children = menu.children?.length
          ? convertBackendMenus(menu.children)
          : undefined;
        return {
          key: menu.path || `/system/${menu.id}`,
          icon: iconMap[menu.icon] || <SettingOutlined />,
          label: menu.name,
          children,
        };
      });
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === '/system/job-monitor') {
      const baseUrl =
        (import.meta as any).env?.VITE_API_BASE_URL || window.location.origin;
      const bullUrl = `${String(baseUrl).replace(/\/$/, '')}/bull`;
      window.open(bullUrl, '_blank', 'noopener');
      return;
    }
    navigate(key);
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      logout();
      navigate('/login');
    }
  };

  const dropdownItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const getOpenKeys = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length > 1) {
      return [`/${paths[0]}`];
    }
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 'bold',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? '管理' : '后台管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={getOpenKeys()}
          items={menuData}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{ cursor: 'pointer', fontSize: 18 }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} src={userInfo?.avatar} />
              <span>{userInfo?.nickname || userInfo?.username}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default BasicLayout;
