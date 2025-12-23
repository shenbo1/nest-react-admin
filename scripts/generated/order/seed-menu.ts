
// ============================================================
// 订单管理模块菜单配置 - 请添加到 prisma/seed.ts 的 menus 数组中
// ============================================================

// 目录菜单
{
  id: 260,
  parentId: 0,
  name: '订单管理',
  path: '/order',
  type: MenuType.DIR,
  icon: 'AppstoreOutlined',
  sort: 10,
  perms: 'order:manage'
},

// 页面菜单
{
  id: 261,
  parentId: 260,
  name: '订单管理列表',
  path: '/order/list',
  component: 'order/index',
  type: MenuType.MENU,
  icon: 'UnorderedListOutlined',
  sort: 1,
  perms: 'order:list'
},

// 按钮权限
{ id: 270, parentId: 261, name: '订单管理查询', path: null, type: MenuType.BUTTON, icon: null, sort: 1, perms: 'order:query' },
{ id: 271, parentId: 261, name: '订单管理新增', path: null, type: MenuType.BUTTON, icon: null, sort: 2, perms: 'order:add' },
{ id: 272, parentId: 261, name: '订单管理修改', path: null, type: MenuType.BUTTON, icon: null, sort: 3, perms: 'order:edit' },
{ id: 273, parentId: 261, name: '订单管理删除', path: null, type: MenuType.BUTTON, icon: null, sort: 4, perms: 'order:remove' },
{ id: 274, parentId: 261, name: '订单管理导出', path: null, type: MenuType.BUTTON, icon: null, sort: 5, perms: 'order:export' },
