
// ============================================================
// 商品分类模块菜单配置 - 请添加到 prisma/seed.ts 的 menus 数组中
// ============================================================

// 目录菜单
{
  id: 230,
  parentId: 0,
  name: '商品分类',
  path: '/category',
  type: MenuType.DIR,
  icon: 'AppstoreOutlined',
  sort: 10,
  perms: 'category:manage'
},

// 页面菜单
{
  id: 231,
  parentId: 230,
  name: '商品分类列表',
  path: '/category/list',
  component: 'category/index',
  type: MenuType.MENU,
  icon: 'UnorderedListOutlined',
  sort: 1,
  perms: 'category:list'
},

// 按钮权限
{ id: 240, parentId: 231, name: '商品分类查询', path: null, type: MenuType.BUTTON, icon: null, sort: 1, perms: 'category:query' },
{ id: 241, parentId: 231, name: '商品分类新增', path: null, type: MenuType.BUTTON, icon: null, sort: 2, perms: 'category:add' },
{ id: 242, parentId: 231, name: '商品分类修改', path: null, type: MenuType.BUTTON, icon: null, sort: 3, perms: 'category:edit' },
{ id: 243, parentId: 231, name: '商品分类删除', path: null, type: MenuType.BUTTON, icon: null, sort: 4, perms: 'category:remove' },
{ id: 244, parentId: 231, name: '商品分类导出', path: null, type: MenuType.BUTTON, icon: null, sort: 5, perms: 'category:export' },
