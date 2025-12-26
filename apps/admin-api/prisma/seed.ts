import {
  PrismaClient,
  Status,
  Gender,
  MenuType,
  DataScope,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  // 创建部门
  const rootDept = await prisma.sysDept.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      parentId: 0,
      ancestors: '0',
      name: '总公司',
      sort: 0,
      leader: '管理员',
      status: Status.ENABLED,
      createdBy: 'system',
    },
  });

  const techDept = await prisma.sysDept.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      parentId: 1,
      ancestors: '0,1',
      name: '技术部',
      sort: 1,
      leader: '技术总监',
      status: Status.ENABLED,
      createdBy: 'system',
    },
  });

  console.log('部门创建完成');

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('sys_dept', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM sys_dept)
    )
  `;

  // 创建角色
  const adminRole = await prisma.sysRole.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '超级管理员',
      key: 'admin',
      sort: 1,
      dataScope: DataScope.ALL,
      status: Status.ENABLED,
      remark: '拥有所有权限',
      createdBy: 'system',
    },
  });

  const normalRole = await prisma.sysRole.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: '普通用户',
      key: 'common',
      sort: 2,
      dataScope: DataScope.SELF,
      status: Status.ENABLED,
      remark: '普通用户角色',
      createdBy: 'system',
    },
  });

  console.log('角色创建完成');

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('sys_role', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM sys_role)
    )
  `;

  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.sysUser.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      deptId: 1,
      username: 'admin',
      password: hashedPassword,
      nickname: '超级管理员',
      email: 'admin@example.com',
      phone: '13800000000',
      gender: Gender.MALE,
      status: Status.ENABLED,
      remark: '系统管理员',
      createdBy: 'system',
    },
  });

  // 关联用户和角色
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: 1, roleId: 1 } },
    update: {},
    create: {
      userId: 1,
      roleId: 1,
    },
  });

  console.log('用户创建完成');

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('sys_user', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM sys_user)
    )
  `;

  // 创建菜单
  const menus = [
    // 首页仪表盘
    {
      id: 1,
      parentId: 0,
      name: '首页',
      path: '/dashboard',
      component: 'dashboard/index',
      type: MenuType.MENU,
      icon: 'DashboardOutlined',
      sort: 0,
      perms: 'dashboard:list',
    },

    // 系统管理
    {
      id: 10,
      parentId: 0,
      name: '系统管理',
      path: '/system',
      type: MenuType.DIR,
      icon: 'SettingOutlined',
      sort: 1,
      perms: 'system:manage',
    },
    {
      id: 11,
      parentId: 10,
      name: '用户管理',
      path: '/system/user',
      component: 'system/user/index',
      type: MenuType.MENU,
      icon: 'UserOutlined',
      sort: 1,
      perms: 'system:user:list',
    },
    {
      id: 12,
      parentId: 10,
      name: '角色管理',
      path: '/system/role',
      component: 'system/role/index',
      type: MenuType.MENU,
      icon: 'TeamOutlined',
      sort: 2,
      perms: 'system:role:list',
    },
    {
      id: 13,
      parentId: 10,
      name: '菜单管理',
      path: '/system/menu',
      component: 'system/menu/index',
      type: MenuType.MENU,
      icon: 'MenuOutlined',
      sort: 3,
      perms: 'system:menu:list',
    },
    {
      id: 14,
      parentId: 10,
      name: '部门管理',
      path: '/system/dept',
      component: 'system/dept/index',
      type: MenuType.MENU,
      icon: 'ApartmentOutlined',
      sort: 4,
      perms: 'system:dept:list',
    },
    // 注意: 岗位管理 (ID 15) 暂未实现，如需使用请先创建后端和前端模块
    {
      id: 16,
      parentId: 10,
      name: '字典管理',
      path: '/system/dict',
      component: 'system/dict/index',
      type: MenuType.MENU,
      icon: 'BookOutlined',
      sort: 5,
      perms: 'system:dict:list',
    },
    {
      id: 17,
      parentId: 10,
      name: '参数设置',
      path: '/system/config',
      component: 'system/config/index',
      type: MenuType.MENU,
      icon: 'ToolOutlined',
      sort: 6,
      perms: 'system:config:list',
    },
    {
      id: 18,
      parentId: 10,
      name: '通知公告',
      path: '/system/notice',
      component: 'system/notice/index',
      type: MenuType.MENU,
      icon: 'NotificationOutlined',
      sort: 7,
      perms: 'system:notice:list',
    },
    {
      id: 19,
      parentId: 10,
      name: '日志管理',
      path: '/system/log',
      type: MenuType.DIR,
      icon: 'FileTextOutlined',
      sort: 8,
      perms: 'system:log:list',
    },
    {
      id: 20,
      parentId: 19,
      name: '操作日志',
      path: '/system/operlog',
      component: 'system/operlog/index',
      type: MenuType.MENU,
      icon: 'FormOutlined',
      sort: 1,
      perms: 'system:operlog:list',
    },
    {
      id: 21,
      parentId: 19,
      name: '登录日志',
      path: '/system/loginlog',
      component: 'system/loginlog/index',
      type: MenuType.MENU,
      icon: 'LoginOutlined',
      sort: 2,
      perms: 'system:loginlog:list',
    },
    {
      id: 22,
      parentId: 10,
      name: '代码生成',
      path: '/system/codegen',
      component: 'system/codegen/index',
      type: MenuType.MENU,
      icon: 'CodeOutlined',
      sort: 9,
      perms: 'system:codegen:list',
    },
    {
      id: 23,
      parentId: 10,
      name: '定时任务',
      path: '/system/job',
      component: 'system/job/index',
      type: MenuType.MENU,
      icon: 'ClockCircleOutlined',
      sort: 10,
      perms: 'system:job:list',
    },
    {
      id: 24,
      parentId: 10,
      name: '任务监控',
      path: '/system/job-monitor',
      component: 'system/job-monitor/index',
      type: MenuType.MENU,
      icon: 'MonitorOutlined',
      sort: 11,
      perms: 'system:job:monitor',
    },
    // 缓存管理 - 管理 Redis 缓存
    // 用途：查看 Redis 服务器状态、缓存键列表、删除缓存、清空缓存
    {
      id: 25,
      parentId: 10,
      name: '缓存管理',
      path: '/system/cache',
      component: 'system/cache/index',
      type: MenuType.MENU,
      icon: 'CloudOutlined',
      sort: 12,
      perms: 'system:cache:query',
    },
    // 缓存管理按钮
    {
      id: 300,
      parentId: 25,
      name: '缓存查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:cache:query',
    },
    {
      id: 301,
      parentId: 25,
      name: '缓存编辑',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:cache:edit',
    },
    {
      id: 302,
      parentId: 25,
      name: '缓存删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'system:cache:remove',
    },
    // 在线用户管理 - 管理在线会话
    // 用途：查看在线用户列表、踢出用户
    {
      id: 26,
      parentId: 10,
      name: '在线用户',
      path: '/system/session',
      component: 'system/session/index',
      type: MenuType.MENU,
      icon: 'SyncOutlined',
      sort: 13,
      perms: 'system:session:query',
    },
    // 在线用户管理按钮
    {
      id: 303,
      parentId: 26,
      name: '会话查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:session:query',
    },
    {
      id: 304,
      parentId: 26,
      name: '踢出用户',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:session:kick',
    },

    // ============================================
    // 商城管理权限说明文档
    // ============================================
    // 商城管理模块包含以下子模块：
    // 1. 商品管理 - 管理商品信息、SKU、规格等
    // 2. 分类管理 - 管理商品分类体系
    // 3. 订单管理 - 管理用户订单和交易
    // 4. 会员管理 - 管理平台会员信息
    // 5. 运营配置 - 管理banner、公告等运营内容
    //
    // 权限层级说明：
    // - 目录权限(mall:manage)：商城管理总入口权限
    // - 列表权限(mall:xxx:list)：查看对应模块列表页权限
    // - 查询权限(mall:xxx:query)：查询/搜索权限
    // - 新增权限(mall:xxx:add)：新增数据权限
    // - 修改权限(mall:xxx:edit)：编辑数据权限
    // - 删除权限(mall:xxx:remove)：删除数据权限
    // - 导出权限(mall:xxx:export)：数据导出权限
    //
    // 角色权限分配建议：
    // - 超级管理员：拥有所有商城权限
    // - 商品管理员：拥有商品管理、分类管理权限
    // - 运营人员：拥有订单查询、会员查询、运营配置权限
    // - 客服人员：拥有订单查询、会员查询权限
    // ============================================

    // 商城管理
    {
      id: 200,
      parentId: 0,
      name: '商城管理',
      path: '/mall',
      type: MenuType.DIR,
      icon: 'ShopOutlined',
      sort: 2,
      perms: 'mall:manage',
    },

    // 商品管理 - 管理商品信息、SKU、规格组等
    // 用途：商家添加、编辑、删除商品信息，管理商品规格和SKU
    // 相关表：product(商品表)、product_sku(SKU表)、product_spec_group(规格组表)、product_spec_value(规格值表)
    {
      id: 201,
      parentId: 200,
      name: '商品管理',
      path: '/mall/product',
      component: 'product/index',
      type: MenuType.MENU,
      icon: 'AppstoreOutlined',
      sort: 1,
      perms: 'mall:product:list',
    },

    // 分类管理 - 管理商品分类体系
    // 用途：创建、编辑商品分类，构建商品分类树结构
    // 相关表：product_category(商品分类表)
    {
      id: 202,
      parentId: 200,
      name: '分类管理',
      path: '/mall/category',
      component: 'category/index',
      type: MenuType.MENU,
      icon: 'TagsOutlined',
      sort: 2,
      perms: 'mall:category:list',
    },

    // 订单管理 - 管理用户订单和交易
    // 用途：查看、处理用户订单，包括订单状态更新、发货、退款等操作
    // 相关表：order(订单表)、order_item(订单项表)
    {
      id: 203,
      parentId: 200,
      name: '订单管理',
      path: '/mall/order',
      component: 'order/index',
      type: MenuType.MENU,
      icon: 'ShoppingCartOutlined',
      sort: 3,
      perms: 'mall:order:list',
    },

    // 会员管理 - 管理平台会员信息
    // 用途：查看、编辑会员信息，管理会员等级、积分等
    // 相关表：member(会员表)
    {
      id: 204,
      parentId: 200,
      name: '会员管理',
      path: '/mall/member',
      component: 'member/index',
      type: MenuType.MENU,
      icon: 'UserOutlined',
      sort: 4,
      perms: 'mall:member:list',
    },

    // 运营配置 - 管理banner、公告等运营内容
    // 用途：管理首页轮播图、公告、运营活动等展示内容
    // 相关表：banner(轮播图表)、announcement(公告表)
    {
      id: 205,
      parentId: 200,
      name: '运营配置',
      path: '/mall/banner',
      component: 'banner/index',
      type: MenuType.MENU,
      icon: 'PictureOutlined',
      sort: 5,
      perms: 'mall:banner:list',
    },

    // 商品规格组管理 - 管理商品规格组
    // 用途：创建、编辑商品规格组，如颜色、尺寸等
    // 相关表：product_spec_group(规格组表)
    {
      id: 206,
      parentId: 200,
      name: '商品规格组',
      path: '/mall/product-spec-group',
      component: 'product-spec-group/index',
      type: MenuType.MENU,
      icon: 'TagsOutlined',
      sort: 6,
      perms: 'mall:product-spec-group:list',
    },

    // 商品规格值管理 - 管理商品规格值
    // 用途：为规格组添加具体的规格值，如红色、蓝色、XL、XXL等
    // 相关表：product_spec_value(规格值表)
    {
      id: 207,
      parentId: 200,
      name: '商品规格值',
      path: '/mall/product-spec-value',
      component: 'product-spec-value/index',
      type: MenuType.MENU,
      icon: 'TagsOutlined',
      sort: 7,
      perms: 'mall:product-spec-value:list',
    },

    // SKU管理 - 管理商品SKU
    // 用途：管理商品的SKU信息，包括价格、库存等
    // 相关表：product_sku(SKU表)
    {
      id: 208,
      parentId: 200,
      name: 'SKU管理',
      path: '/mall/product-sku',
      component: 'product-sku/index',
      type: MenuType.MENU,
      icon: 'ShoppingCartOutlined',
      sort: 8,
      perms: 'mall:product-sku:list',
    },

    // ============================================
    // 商城模块按钮权限详细说明
    // ============================================
    // 按钮权限用于控制页面内的具体操作功能
    // 每个模块都包含以下按钮权限：
    // - 查询(query)：搜索、筛选、查看详情
    // - 新增(add)：创建新数据
    // - 修改(edit)：编辑已有数据
    // - 删除(remove)：删除数据
    // - 导出(export)：导出数据到Excel等格式
    // ============================================

    // 商品管理按钮权限
    // 说明：控制商品列表页面的各种操作按钮
    // query：搜索商品、筛选商品状态、查看商品详情
    // add：新增商品按钮、新建商品表单
    // edit：编辑商品信息、修改商品价格/库存
    // remove：删除单个或批量删除商品
    // export：导出商品列表到Excel
    {
      id: 210,
      parentId: 201,
      name: '商品查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'mall:product:query',
    },
    {
      id: 211,
      parentId: 201,
      name: '商品新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'mall:product:add',
    },
    {
      id: 212,
      parentId: 201,
      name: '商品修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'mall:product:edit',
    },
    {
      id: 213,
      parentId: 201,
      name: '商品删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'mall:product:remove',
    },
    {
      id: 214,
      parentId: 201,
      name: '商品导出',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 5,
      perms: 'mall:product:export',
    },

    // 分类管理按钮权限
    // 说明：控制商品分类树形结构的操作
    // query：搜索分类、查看分类树形结构
    // add：新增一级/二级分类
    // edit：编辑分类名称、排序、状态
    // remove：删除分类（注意：删除分类前需要确保该分类下没有商品）
    // export：导出分类列表到Excel
    {
      id: 220,
      parentId: 202,
      name: '分类查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'mall:category:query',
    },
    {
      id: 221,
      parentId: 202,
      name: '分类新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'mall:category:add',
    },
    {
      id: 222,
      parentId: 202,
      name: '分类修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'mall:category:edit',
    },
    {
      id: 223,
      parentId: 202,
      name: '分类删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'mall:category:remove',
    },
    {
      id: 224,
      parentId: 202,
      name: '分类导出',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 5,
      perms: 'mall:category:export',
    },

    // 订单管理按钮权限
    // 说明：控制订单流程的各项操作
    // query：搜索订单、筛选订单状态、查看订单详情
    // add：手动创建订单（通常用于线下订单录入）
    // edit：修改订单状态、发货处理、订单备注
    // remove：删除订单（注意：已支付订单通常不允许删除）
    // export：导出订单列表到Excel（用于财务对账、数据分析）
    {
      id: 230,
      parentId: 203,
      name: '订单查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'mall:order:query',
    },
    {
      id: 231,
      parentId: 203,
      name: '订单新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'mall:order:add',
    },
    {
      id: 232,
      parentId: 203,
      name: '订单修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'mall:order:edit',
    },
    {
      id: 233,
      parentId: 203,
      name: '订单删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'mall:order:remove',
    },
    {
      id: 234,
      parentId: 203,
      name: '订单导出',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 5,
      perms: 'mall:order:export',
    },

    // 会员管理按钮权限
    // 说明：控制会员信息管理的各项操作
    // query：搜索会员、筛选会员等级/状态、查看会员详情和订单历史
    // add：手动添加会员账户
    // edit：修改会员信息、调整会员等级、积分管理、账户状态
    // remove：删除会员账户（注意：删除会员会同时删除其订单记录）
    // export：导出会员列表到Excel（用于营销推广、数据分析）
    {
      id: 240,
      parentId: 204,
      name: '会员查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'mall:member:query',
    },
    {
      id: 241,
      parentId: 204,
      name: '会员新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'mall:member:add',
    },
    {
      id: 242,
      parentId: 204,
      name: '会员修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'mall:member:edit',
    },
    {
      id: 243,
      parentId: 204,
      name: '会员删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'mall:member:remove',
    },
    {
      id: 244,
      parentId: 204,
      name: '会员导出',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 5,
      perms: 'mall:member:export',
    },

    // 运营配置按钮权限
    // 说明：控制平台运营内容的配置管理
    // query：查看轮播图列表、公告列表、活动列表
    // add：新增banner图、发布公告、创建运营活动
    // edit：编辑banner链接、修改公告内容、调整活动配置
    // remove：删除banner、撤回公告、结束运营活动
    // export：导出配置列表到Excel（用于数据统计）
    {
      id: 250,
      parentId: 205,
      name: '配置查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'mall:banner:query',
    },
    {
      id: 251,
      parentId: 205,
      name: '配置新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'mall:banner:add',
    },
    {
      id: 252,
      parentId: 205,
      name: '配置修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'mall:banner:edit',
    },
    {
      id: 253,
      parentId: 205,
      name: '配置删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'mall:banner:remove',
    },
    {
      id: 254,
      parentId: 205,
      name: '配置导出',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 5,
      perms: 'mall:banner:export',
    },

    // 商品规格组管理按钮权限
    // 说明：控制商品规格组的管理操作
    // query：查看规格组列表、搜索规格组
    // add：新增规格组（如颜色、尺寸等）
    // edit：编辑规格组名称、排序、状态
    // remove：删除规格组
    // export：导出规格组列表
    {
      id: 260,
      parentId: 206,
      name: '规格组查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'mall:product-spec-group:query',
    },
    {
      id: 261,
      parentId: 206,
      name: '规格组新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'mall:product-spec-group:add',
    },
    {
      id: 262,
      parentId: 206,
      name: '规格组修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'mall:product-spec-group:edit',
    },
    {
      id: 263,
      parentId: 206,
      name: '规格组删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'mall:product-spec-group:remove',
    },
    {
      id: 264,
      parentId: 206,
      name: '规格组导出',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 5,
      perms: 'mall:product-spec-group:export',
    },

    // 商品规格值管理按钮权限
    // 说明：控制商品规格值的管理操作
    // query：查看规格值列表、搜索规格值
    // add：为规格组添加规格值（如为颜色添加红色、蓝色）
    // edit：编辑规格值名称、排序、状态
    // remove：删除规格值
    // export：导出规格值列表
    {
      id: 270,
      parentId: 207,
      name: '规格值查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'mall:product-spec-value:query',
    },
    {
      id: 271,
      parentId: 207,
      name: '规格值新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'mall:product-spec-value:add',
    },
    {
      id: 272,
      parentId: 207,
      name: '规格值修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'mall:product-spec-value:edit',
    },
    {
      id: 273,
      parentId: 207,
      name: '规格值删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'mall:product-spec-value:remove',
    },
    {
      id: 274,
      parentId: 207,
      name: '规格值导出',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 5,
      perms: 'mall:product-spec-value:export',
    },

    // SKU管理按钮权限
    // 说明：控制商品SKU的管理操作
    // query：查看SKU列表、搜索SKU、查看SKU详情
    // add：新增SKU（为商品添加规格组合）
    // edit：编辑SKU价格、库存、状态等信息
    // remove：删除SKU
    // export：导出SKU列表
    {
      id: 280,
      parentId: 208,
      name: 'SKU查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'mall:product-sku:query',
    },
    {
      id: 281,
      parentId: 208,
      name: 'SKU新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'mall:product-sku:add',
    },
    {
      id: 282,
      parentId: 208,
      name: 'SKU修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'mall:product-sku:edit',
    },
    {
      id: 283,
      parentId: 208,
      name: 'SKU删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'mall:product-sku:remove',
    },
    {
      id: 284,
      parentId: 208,
      name: 'SKU导出',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 5,
      perms: 'mall:product-sku:export',
    },

    // 用户管理按钮
    {
      id: 100,
      parentId: 11,
      name: '用户查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:user:query',
    },
    {
      id: 101,
      parentId: 11,
      name: '用户新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:user:add',
    },
    {
      id: 102,
      parentId: 11,
      name: '用户修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'system:user:edit',
    },
    {
      id: 103,
      parentId: 11,
      name: '用户删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'system:user:remove',
    },
    {
      id: 104,
      parentId: 11,
      name: '重置密码',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 5,
      perms: 'system:user:resetPwd',
    },

    // 角色管理按钮
    {
      id: 110,
      parentId: 12,
      name: '角色查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:role:query',
    },
    {
      id: 111,
      parentId: 12,
      name: '角色新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:role:add',
    },
    {
      id: 112,
      parentId: 12,
      name: '角色修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'system:role:edit',
    },
    {
      id: 113,
      parentId: 12,
      name: '角色删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'system:role:remove',
    },

    // 菜单管理按钮
    {
      id: 120,
      parentId: 13,
      name: '菜单查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:menu:query',
    },
    {
      id: 121,
      parentId: 13,
      name: '菜单新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:menu:add',
    },
    {
      id: 122,
      parentId: 13,
      name: '菜单修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'system:menu:edit',
    },
    {
      id: 123,
      parentId: 13,
      name: '菜单删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'system:menu:remove',
    },

    // 部门管理按钮
    {
      id: 130,
      parentId: 14,
      name: '部门查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:dept:query',
    },
    {
      id: 131,
      parentId: 14,
      name: '部门新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:dept:add',
    },
    {
      id: 132,
      parentId: 14,
      name: '部门修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'system:dept:edit',
    },
    {
      id: 133,
      parentId: 14,
      name: '部门删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'system:dept:remove',
    },

    // 字典管理按钮
    {
      id: 140,
      parentId: 16,
      name: '字典查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:dict:query',
    },
    {
      id: 141,
      parentId: 16,
      name: '字典新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:dict:add',
    },
    {
      id: 142,
      parentId: 16,
      name: '字典修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'system:dict:edit',
    },
    {
      id: 143,
      parentId: 16,
      name: '字典删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'system:dict:remove',
    },

    // 注意: 岗位管理按钮 (ID 150-153) 暂未实现

    // 参数设置按钮
    {
      id: 160,
      parentId: 17,
      name: '参数查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:config:query',
    },
    {
      id: 161,
      parentId: 17,
      name: '参数新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:config:add',
    },
    {
      id: 162,
      parentId: 17,
      name: '参数修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'system:config:edit',
    },
    {
      id: 163,
      parentId: 17,
      name: '参数删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'system:config:remove',
    },

    // 通知公告按钮
    {
      id: 170,
      parentId: 18,
      name: '公告查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:notice:query',
    },
    {
      id: 171,
      parentId: 18,
      name: '公告新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:notice:add',
    },
    {
      id: 172,
      parentId: 18,
      name: '公告修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'system:notice:edit',
    },
    {
      id: 173,
      parentId: 18,
      name: '公告删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'system:notice:remove',
    },

    // 操作日志按钮
    {
      id: 180,
      parentId: 20,
      name: '操作日志查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:operlog:query',
    },
    {
      id: 181,
      parentId: 20,
      name: '操作日志删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:operlog:remove',
    },

    // 登录日志按钮
    {
      id: 185,
      parentId: 21,
      name: '登录日志查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:loginlog:query',
    },
    {
      id: 186,
      parentId: 21,
      name: '登录日志删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:loginlog:remove',
    },

    // 代码生成按钮
    {
      id: 190,
      parentId: 22,
      name: '生成代码',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:codegen:generate',
    },
    // 定时任务按钮
    {
      id: 191,
      parentId: 23,
      name: '任务查询',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 1,
      perms: 'system:job:query',
    },
    {
      id: 192,
      parentId: 23,
      name: '任务新增',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 2,
      perms: 'system:job:add',
    },
    {
      id: 193,
      parentId: 23,
      name: '任务修改',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 3,
      perms: 'system:job:edit',
    },
    {
      id: 194,
      parentId: 23,
      name: '任务删除',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 4,
      perms: 'system:job:remove',
    },
    {
      id: 195,
      parentId: 23,
      name: '立即执行',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 5,
      perms: 'system:job:run',
    },
    {
      id: 196,
      parentId: 23,
      name: '执行记录',
      path: null,
      type: MenuType.BUTTON,
      icon: null,
      sort: 6,
      perms: 'system:job:log',
    },
    // article管理菜单
    { id: 200, parentId: 0, name: 'article管理', path: '/article', type: MenuType.DIR, icon: 'AppstoreOutlined', sort: 10, perms: 'article:manage' },
    { id: 201, parentId: 200, name: 'article管理列表', path: '/article/list', component: 'article/index', type: MenuType.MENU, icon: 'UnorderedListOutlined', sort: 1, perms: 'article:list' },
    { id: 210, parentId: 201, name: 'article管理查询', path: null, type: MenuType.BUTTON, icon: null, sort: 1, perms: 'article:query' },
    { id: 211, parentId: 201, name: 'article管理新增', path: null, type: MenuType.BUTTON, icon: null, sort: 2, perms: 'article:add' },
    { id: 212, parentId: 201, name: 'article管理修改', path: null, type: MenuType.BUTTON, icon: null, sort: 3, perms: 'article:edit' },
    { id: 213, parentId: 201, name: 'article管理删除', path: null, type: MenuType.BUTTON, icon: null, sort: 4, perms: 'article:remove' },
    { id: 214, parentId: 201, name: 'article管理导出', path: null, type: MenuType.BUTTON, icon: null, sort: 5, perms: 'article:export' },

  ];

  for (const menu of menus) {
    await prisma.sysMenu.upsert({
      where: { id: menu.id },
      update: {},
      create: {
        ...menu,
        visible: true,
        status: Status.ENABLED,
        createdBy: 'system',
      },
    });
  }

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('sys_menu', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM sys_menu)
    )
  `;

  // 给管理员角色分配所有菜单权限
  const allMenus = await prisma.sysMenu.findMany({ where: { deleted: false } });
  for (const menu of allMenus) {
    await prisma.sysRoleMenu.upsert({
      where: { roleId_menuId: { roleId: 1, menuId: menu.id } },
      update: {},
      create: {
        roleId: 1,
        menuId: menu.id,
      },
    });
  }

  console.log('菜单创建完成');

  // 创建定时任务示例
  await prisma.sysJob.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '系统心跳检测',
      type: 'SYSTEM',
      handler: 'system:heartbeat',
      cron: '*/5 * * * *',
      payload: { source: 'seed' },
      status: Status.ENABLED,
      remark: '示例任务：每5分钟执行一次',
      createdBy: 'system',
    },
  });

  await prisma.sysJobLog.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      jobId: 1,
      jobName: '系统心跳检测',
      handler: 'system:heartbeat',
      trigger: 'MANUAL',
      status: 'SUCCESS',
      message: '示例日志',
      payload: { source: 'seed' },
      startedAt: new Date(),
      finishedAt: new Date(),
      durationMs: 100,
      result: { ok: true, seed: true },
      createdBy: 'system',
      updatedBy: 'system',
    },
  });

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('sys_job', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM sys_job)
    )
  `;

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('sys_job_log', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM sys_job_log)
    )
  `;

  console.log('定时任务创建完成');

  // 创建字典
  const dictTypes = [
    { id: 1, name: '用户性别', type: 'sys_user_gender' },
    { id: 2, name: '系统状态', type: 'sys_status' },
    { id: 3, name: '通知类型', type: 'sys_notice_type' },
    { id: 4, name: '轮播图位置', type: 'banner_position' }, // 新增轮播图位置字典类型
    { id: 5, name: '会员等级', type: 'member_level' }, // 新增会员等级字典类型
  ];

  for (const dictType of dictTypes) {
    await prisma.sysDictType.upsert({
      where: { id: dictType.id },
      update: {},
      create: {
        ...dictType,
        status: Status.ENABLED,
        createdBy: 'system',
      },
    });
  }

  const dictData = [
    { dictType: 'sys_user_gender', label: '男', value: 'MALE', sort: 1 },
    { dictType: 'sys_user_gender', label: '女', value: 'FEMALE', sort: 2 },
    { dictType: 'sys_user_gender', label: '未知', value: 'UNKNOWN', sort: 3 },
    {
      dictType: 'sys_status',
      label: '正常',
      value: 'ENABLED',
      sort: 1,
      listClass: 'success',
    },
    {
      dictType: 'sys_status',
      label: '停用',
      value: 'DISABLED',
      sort: 2,
      listClass: 'danger',
    },
    { dictType: 'sys_notice_type', label: '通知', value: '1', sort: 1 },
    { dictType: 'sys_notice_type', label: '公告', value: '2', sort: 2 },

    // 轮播图位置字典数据
    { dictType: 'banner_position', label: '首页轮播', value: 'home', sort: 1 },
    { dictType: 'banner_position', label: '分类页', value: 'category', sort: 2 },
    { dictType: 'banner_position', label: '详情页', value: 'detail', sort: 3 },
    { dictType: 'banner_position', label: '活动页', value: 'activity', sort: 4 },
    // 会员等级字典数据
    { dictType: 'member_level', label: '普通会员', value: '1', sort: 1 },
    { dictType: 'member_level', label: '白银会员', value: '2', sort: 2 },
    { dictType: 'member_level', label: '黄金会员', value: '3', sort: 3 },
    { dictType: 'member_level', label: '铂金会员', value: '4', sort: 4 },
    { dictType: 'member_level', label: '钻石会员', value: '5', sort: 5 },
  ];

  for (let i = 0; i < dictData.length; i++) {
    const data = dictData[i];
    await prisma.sysDictData.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        id: i + 1,
        ...data,
        status: Status.ENABLED,
        createdBy: 'system',
      },
    });
  }

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('sys_dict_type', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM sys_dict_type)
    )
  `;

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('sys_dict_data', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM sys_dict_data)
    )
  `;

  console.log('字典创建完成');

  // ====================
  // 商城SKU系统测试数据
  // ====================
  console.log('创建SKU系统测试数据...');

  // 创建测试分类
  await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '默认分类',
      code: 'DEFAULT',
      parentId: null,
      ancestors: '0',
      level: 1,
      sort: 0,
      status: Status.ENABLED,
      createdBy: 'system',
    },
  });

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('mall_category', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM mall_category)
    )
  `;

  // 创建一个测试商品
  const testProduct = await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      code: 'TEST001',
      name: '测试商品 - T恤',
      mainImage: 'https://example.com/product1.jpg',
      images: [
        'https://example.com/product1.jpg',
        'https://example.com/product2.jpg',
      ],
      content: '一款高品质的纯棉T恤，舒适透气',
      defaultPrice: 99.99,
      defaultStock: 1000,
      sales: 150,
      defaultWeight: 0.25,
      status: 'ON_SHELF' as any,
      categoryId: 1,
      createdBy: 'system',
    },
  });

  console.log('测试商品创建完成');

  // 重置商品ID序列
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('mall_product', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM mall_product)
    )
  `;

  // 创建规格组
  let colorGroup = await prisma.productSpecGroup.findFirst({
    where: { productId: 1, name: '颜色' }
  });

  if (!colorGroup) {
    colorGroup = await prisma.productSpecGroup.create({
      data: {
        productId: 1,
        name: '颜色',
        sort: 1,
      },
    });
  }

  let sizeGroup = await prisma.productSpecGroup.findFirst({
    where: { productId: 1, name: '尺寸' }
  });

  if (!sizeGroup) {
    sizeGroup = await prisma.productSpecGroup.create({
      data: {
        productId: 1,
        name: '尺寸',
        sort: 2,
      },
    });
  }

  console.log('规格组创建完成');

  // 重置规格组ID序列
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('mall_product_spec_group', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM mall_product_spec_group)
    )
  `;

  // 创建规格值 - 颜色
  const colorValueNames = ['白色', '黑色', '红色', '蓝色'];
  const colorValues = [];

  for (let i = 0; i < colorValueNames.length; i++) {
    let colorValue = await prisma.productSpecValue.findFirst({
      where: { specGroupId: colorGroup.id, name: colorValueNames[i] }
    });

    if (!colorValue) {
      colorValue = await prisma.productSpecValue.create({
        data: {
          specGroupId: colorGroup.id,
          name: colorValueNames[i],
          sort: i + 1,
        },
      });
    }
    colorValues.push(colorValue);
  }

  // 创建规格值 - 尺寸
  const sizeValueNames = ['S', 'M', 'L', 'XL'];
  const sizeValues = [];

  for (let i = 0; i < sizeValueNames.length; i++) {
    let sizeValue = await prisma.productSpecValue.findFirst({
      where: { specGroupId: sizeGroup.id, name: sizeValueNames[i] }
    });

    if (!sizeValue) {
      sizeValue = await prisma.productSpecValue.create({
        data: {
          specGroupId: sizeGroup.id,
          name: sizeValueNames[i],
          sort: i + 1,
        },
      });
    }
    sizeValues.push(sizeValue);
  }

  console.log('规格值创建完成');

  // 重置规格值ID序列
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('mall_product_spec_value', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM mall_product_spec_value)
    )
  `;

  // 创建SKU - 所有颜色和尺寸组合
  for (let color of colorValues) {
    for (let size of sizeValues) {
      const skuCode = `TSHIRT-${color.name.substr(0, 2)}-${size.name}`;

      // 检查SKU是否已存在
      const existingSku = await prisma.productSKU.findFirst({
        where: { skuCode: skuCode }
      });

      if (!existingSku) {
        await prisma.productSKU.create({
          data: {
            productId: 1,
            skuCode: skuCode,
            specCombination: JSON.stringify({
              颜色: color.name,
              尺寸: size.name,
            }),
            price: 99.99,
            costPrice: 49.99,
            stock: 50,
            lowStockAlert: 10,
            sales: Math.floor(Math.random() * 20),
            weight: 0.25,
            images: JSON.stringify([
              `https://example.com/product-${color.name}-${size.name}.jpg`,
            ]),
          },
        });
      }
    }
  }

  console.log(`${colorValues.length * sizeValues.length} 个SKU创建完成`);

  // 重置SKU ID序列
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('mall_product_sku', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM mall_product_sku)
    )
  `;

  console.log('SKU系统测试数据创建完成!');
  console.log('数据初始化完成!');
  console.log('默认账号: admin / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
