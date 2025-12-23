
// ============================================================
// 会员管理模块菜单配置 - 请添加到 prisma/seed.ts 的 menus 数组中
// ============================================================

// 目录菜单
{
  id: 290,
  parentId: 0,
  name: '会员管理',
  path: '/member',
  type: MenuType.DIR,
  icon: 'AppstoreOutlined',
  sort: 10,
  perms: 'member:manage'
},

// 页面菜单
{
  id: 291,
  parentId: 290,
  name: '会员管理列表',
  path: '/member/list',
  component: 'member/index',
  type: MenuType.MENU,
  icon: 'UnorderedListOutlined',
  sort: 1,
  perms: 'member:list'
},

// 按钮权限
{ id: 300, parentId: 291, name: '会员管理查询', path: null, type: MenuType.BUTTON, icon: null, sort: 1, perms: 'member:query' },
{ id: 301, parentId: 291, name: '会员管理新增', path: null, type: MenuType.BUTTON, icon: null, sort: 2, perms: 'member:add' },
{ id: 302, parentId: 291, name: '会员管理修改', path: null, type: MenuType.BUTTON, icon: null, sort: 3, perms: 'member:edit' },
{ id: 303, parentId: 291, name: '会员管理删除', path: null, type: MenuType.BUTTON, icon: null, sort: 4, perms: 'member:remove' },
{ id: 304, parentId: 291, name: '会员管理导出', path: null, type: MenuType.BUTTON, icon: null, sort: 5, perms: 'member:export' },
