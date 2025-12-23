
// ============================================================
// 商品管理模块菜单配置 - 请添加到 prisma/seed.ts 的 menus 数组中
// ============================================================

// 目录菜单
{
  id: 200,
  parentId: 0,
  name: '商品管理',
  path: '/product',
  type: MenuType.DIR,
  icon: 'AppstoreOutlined',
  sort: 10,
  perms: 'product:manage'
},

// 页面菜单
{
  id: 201,
  parentId: 200,
  name: '商品管理列表',
  path: '/product/list',
  component: 'product/index',
  type: MenuType.MENU,
  icon: 'UnorderedListOutlined',
  sort: 1,
  perms: 'product:list'
},

// 按钮权限
{ id: 210, parentId: 201, name: '商品管理查询', path: null, type: MenuType.BUTTON, icon: null, sort: 1, perms: 'product:query' },
{ id: 211, parentId: 201, name: '商品管理新增', path: null, type: MenuType.BUTTON, icon: null, sort: 2, perms: 'product:add' },
{ id: 212, parentId: 201, name: '商品管理修改', path: null, type: MenuType.BUTTON, icon: null, sort: 3, perms: 'product:edit' },
{ id: 213, parentId: 201, name: '商品管理删除', path: null, type: MenuType.BUTTON, icon: null, sort: 4, perms: 'product:remove' },
{ id: 214, parentId: 201, name: '商品管理导出', path: null, type: MenuType.BUTTON, icon: null, sort: 5, perms: 'product:export' },
