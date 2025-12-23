// ============================================================
// article管理模块菜单配置 - 请添加到 prisma/seed.ts 的 menus 数组中
// ============================================================

// 目录菜单
{
  id: 200,
  parentId: 0,
  name: 'article管理',
  path: '/article',
  type: MenuType.DIR,
  icon: 'AppstoreOutlined',
  sort: 10,
  perms: 'article:manage'
},

// 页面菜单
{
  id: 201,
  parentId: 200,
  name: 'article管理列表',
  path: '/article/list',
  component: 'article/index',
  type: MenuType.MENU,
  icon: 'UnorderedListOutlined',
  sort: 1,
  perms: 'article:list'
},

// 按钮权限
{ id: 210, parentId: 201, name: 'article管理查询', path: null, type: MenuType.BUTTON, icon: null, sort: 1, perms: 'article:query' },
{ id: 211, parentId: 201, name: 'article管理新增', path: null, type: MenuType.BUTTON, icon: null, sort: 2, perms: 'article:add' },
{ id: 212, parentId: 201, name: 'article管理修改', path: null, type: MenuType.BUTTON, icon: null, sort: 3, perms: 'article:edit' },
{ id: 213, parentId: 201, name: 'article管理删除', path: null, type: MenuType.BUTTON, icon: null, sort: 4, perms: 'article:remove' },
{ id: 214, parentId: 201, name: 'article管理导出', path: null, type: MenuType.BUTTON, icon: null, sort: 5, perms: 'article:export' },
