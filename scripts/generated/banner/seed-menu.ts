
// ============================================================
// 运营配置模块菜单配置 - 请添加到 prisma/seed.ts 的 menus 数组中
// ============================================================

// 目录菜单
{
  id: 320,
  parentId: 0,
  name: '运营配置',
  path: '/banner',
  type: MenuType.DIR,
  icon: 'AppstoreOutlined',
  sort: 10,
  perms: 'banner:manage'
},

// 页面菜单
{
  id: 321,
  parentId: 320,
  name: '运营配置列表',
  path: '/banner/list',
  component: 'banner/index',
  type: MenuType.MENU,
  icon: 'UnorderedListOutlined',
  sort: 1,
  perms: 'banner:list'
},

// 按钮权限
{ id: 330, parentId: 321, name: '运营配置查询', path: null, type: MenuType.BUTTON, icon: null, sort: 1, perms: 'banner:query' },
{ id: 331, parentId: 321, name: '运营配置新增', path: null, type: MenuType.BUTTON, icon: null, sort: 2, perms: 'banner:add' },
{ id: 332, parentId: 321, name: '运营配置修改', path: null, type: MenuType.BUTTON, icon: null, sort: 3, perms: 'banner:edit' },
{ id: 333, parentId: 321, name: '运营配置删除', path: null, type: MenuType.BUTTON, icon: null, sort: 4, perms: 'banner:remove' },
{ id: 334, parentId: 321, name: '运营配置导出', path: null, type: MenuType.BUTTON, icon: null, sort: 5, perms: 'banner:export' },
