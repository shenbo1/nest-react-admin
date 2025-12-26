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

// ============================================
// 菜单辅助函数
// ============================================

/** 创建目录菜单 */
function dir(
  id: number,
  parentId: number,
  name: string,
  path: string,
  icon: string,
  perms: string,
  sort = 0
) {
  return { id, parentId, name, path, type: MenuType.DIR, icon, perms, sort };
}

/** 创建页面菜单 */
function menu(
  id: number,
  parentId: number,
  name: string,
  path: string,
  component: string,
  icon: string,
  perms: string,
  sort = 0
) {
  return { id, parentId, name, path, component, type: MenuType.MENU, icon, perms, sort };
}

/** 创建单个按钮 */
function button(id: number, parentId: number, name: string, perms: string, sort = 0) {
  return { id, parentId, name, path: null, type: MenuType.BUTTON, icon: null, perms, sort };
}

/** 批量创建按钮权限（标准 CRUD） */
function buttons(
  baseId: number,
  parentId: number,
  name: string,
  permsPrefix: string,
  options: { query?: boolean; add?: boolean; edit?: boolean; remove?: boolean; export?: boolean; resetPwd?: boolean; run?: boolean; log?: boolean } = {}
) {
  const result: ReturnType<typeof button>[] = [];
  const labels: Record<string, string> = {
    query: '查询',
    add: '新增',
    edit: '修改',
    remove: '删除',
    export: '导出',
    resetPwd: '重置密码',
    run: '立即执行',
    log: '执行记录',
  };
  const permsMap: Record<string, string> = {
    query: 'query',
    add: 'add',
    edit: 'edit',
    remove: 'remove',
    export: 'export',
    resetPwd: 'resetPwd',
    run: 'run',
    log: 'log',
  };

  let i = 0;
  for (const [key, enabled] of Object.entries(options)) {
    if (enabled) {
      result.push(button(baseId + i++, parentId, `${name}${labels[key]}`, `${permsPrefix}:${permsMap[key]}`));
    }
  }
  return result;
}

/** 批量创建告警按钮权限 */
function alertButtons(baseId: number, parentId: number, name: string) {
  return [
    button(baseId, parentId, `${name}规则查询`, `${name}:rule:query`),
    button(baseId + 1, parentId, `${name}规则新增`, `${name}:rule:add`),
    button(baseId + 2, parentId, `${name}规则修改`, `${name}:rule:edit`),
    button(baseId + 3, parentId, `${name}规则删除`, `${name}:rule:remove`),
    button(baseId + 4, parentId, `${name}事件处理`, `${name}:event:handle`),
  ];
}

/** 批量创建缓存/会话按钮权限 */
function simpleButtons(baseId: number, parentId: number, name: string) {
  return [
    button(baseId, parentId, `${name}查询`, `${name}:query`),
    button(baseId + 1, parentId, `${name}编辑`, `${name}:edit`),
    button(baseId + 2, parentId, `${name}删除`, `${name}:remove`),
  ];
}

// ============================================
// 菜单定义
// ============================================

const menus = [
  // 首页仪表盘
  menu(1, 0, '首页', '/dashboard', 'dashboard/index', 'DashboardOutlined', 'dashboard:list', 0),

  // ============================================
  // 系统管理模块
  // ============================================
  dir(10, 0, '系统管理', '/system', 'SettingOutlined', 'system:manage', 1),
  menu(11, 10, '用户管理', '/system/user', 'system/user/index', 'UserOutlined', 'system:user:list', 1),
  menu(12, 10, '角色管理', '/system/role', 'system/role/index', 'TeamOutlined', 'system:role:list', 2),
  menu(13, 10, '菜单管理', '/system/menu', 'system/menu/index', 'MenuOutlined', 'system:menu:list', 3),
  menu(14, 10, '部门管理', '/system/dept', 'system/dept/index', 'ApartmentOutlined', 'system:dept:list', 4),
  menu(16, 10, '字典管理', '/system/dict', 'system/dict/index', 'BookOutlined', 'system:dict:list', 5),
  menu(17, 10, '参数设置', '/system/config', 'system/config/index', 'ToolOutlined', 'system:config:list', 6),
  menu(18, 10, '通知公告', '/system/notice', 'system/notice/index', 'NotificationOutlined', 'system:notice:list', 7),
  menu(22, 10, '代码生成', '/system/codegen', 'system/codegen/index', 'CodeOutlined', 'system:codegen:list', 8),
  menu(23, 10, '定时任务', '/system/job', 'system/job/index', 'ClockCircleOutlined', 'system:job:list', 9),
  menu(24, 10, '任务监控', '/system/job-monitor', 'system/job-monitor/index', 'MonitorOutlined', 'system:job:monitor', 10),
  menu(25, 10, '缓存管理', '/system/cache', 'system/cache/index', 'CloudOutlined', 'system:cache:query', 11),
  menu(26, 10, '在线用户', '/system/session', 'system/session/index', 'SyncOutlined', 'system:session:query', 12),

  // ============================================
  // 日志管理模块 (一级目录)
  // ============================================
  dir(30, 0, '日志管理', '/log', 'FileTextOutlined', 'system:log:list', 2),
  menu(31, 30, '操作日志', '/log/operlog', 'system/operlog/index', 'FormOutlined', 'system:operlog:list', 1),
  menu(32, 30, '登录日志', '/log/loginlog', 'system/loginlog/index', 'LoginOutlined', 'system:loginlog:list', 2),

  // ============================================
  // 监控管理模块 (一级目录)
  // ============================================
  dir(40, 0, '监控管理', '/monitor', 'MonitorOutlined', 'system:monitor:manage', 3),
  menu(41, 40, '数据库监控', '/monitor/database', 'system/database-monitor/index', 'DatabaseOutlined', 'system:database-monitor:query', 1),
  menu(42, 40, 'API监控', '/monitor/api', 'system/api-monitor/index', 'ApiOutlined', 'system:api-monitor:query', 2),
  menu(43, 40, '日志监控', '/monitor/log', 'system/log-monitor/index', 'BarChartOutlined', 'system:log-monitor:query', 3),
  menu(44, 40, '告警管理', '/monitor/alert', 'system/alert/index', 'BellOutlined', 'system:alert:manage', 4),

  // ============================================
  // 商城管理模块
  // ============================================
  dir(200, 0, '商城管理', '/mall', 'ShopOutlined', 'mall:manage', 4),
  menu(201, 200, '商品管理', '/mall/product', 'product/index', 'AppstoreOutlined', 'mall:product:list', 1),
  menu(202, 200, '分类管理', '/mall/category', 'category/index', 'TagsOutlined', 'mall:category:list', 2),
  menu(203, 200, '订单管理', '/mall/order', 'order/index', 'ShoppingCartOutlined', 'mall:order:list', 3),
  menu(204, 200, '会员管理', '/mall/member', 'member/index', 'UserOutlined', 'mall:member:list', 4),
  menu(205, 200, '运营配置', '/mall/banner', 'banner/index', 'PictureOutlined', 'mall:banner:list', 5),
  menu(206, 200, '商品规格组', '/mall/spec-group', 'product-spec-group/index', 'TagsOutlined', 'mall:product-spec-group:list', 6),
  menu(207, 200, '商品规格值', '/mall/spec-value', 'product-spec-value/index', 'TagsOutlined', 'mall:product-spec-value:list', 7),
  menu(208, 200, 'SKU管理', '/mall/sku', 'product-sku/index', 'ShoppingCartOutlined', 'mall:product-sku:list', 8),

  // ============================================
  // 文章管理模块
  // ============================================
  dir(300, 0, '文章管理', '/article', 'FileTextOutlined', 'article:manage', 5),
  menu(301, 300, '文章列表', '/article/list', 'article/index', 'UnorderedListOutlined', 'article:list', 1),

  // ============================================
  // 按钮权限
  // ============================================

  // 用户管理按钮
  buttons(100, 11, '用户', 'system:user', { query: true, add: true, edit: true, remove: true, resetPwd: true }),

  // 角色管理按钮
  buttons(110, 12, '角色', 'system:role', { query: true, add: true, edit: true, remove: true }),

  // 菜单管理按钮
  buttons(120, 13, '菜单', 'system:menu', { query: true, add: true, edit: true, remove: true }),

  // 部门管理按钮
  buttons(130, 14, '部门', 'system:dept', { query: true, add: true, edit: true, remove: true }),

  // 字典管理按钮
  buttons(140, 16, '字典', 'system:dict', { query: true, add: true, edit: true, remove: true }),

  // 参数设置按钮
  buttons(160, 17, '参数', 'system:config', { query: true, add: true, edit: true, remove: true }),

  // 通知公告按钮
  buttons(170, 18, '公告', 'system:notice', { query: true, add: true, edit: true, remove: true }),

  // 代码生成按钮
  button(190, 22, '生成代码', 'system:codegen:generate'),

  // 定时任务按钮
  buttons(191, 23, '任务', 'system:job', { query: true, add: true, edit: true, remove: true, run: true, log: true }),

  // 缓存管理按钮
  simpleButtons(300, 25, '缓存'),

  // 在线用户按钮
  button(303, 26, '会话查询', 'system:session:query'),
  button(304, 26, '踢出用户', 'system:session:kick'),

  // 操作日志按钮
  button(180, 31, '操作日志查询', 'system:operlog:query'),
  button(181, 31, '操作日志删除', 'system:operlog:remove'),

  // 登录日志按钮
  button(185, 32, '登录日志查询', 'system:loginlog:query'),
  button(186, 32, '登录日志删除', 'system:loginlog:remove'),

  // 告警管理按钮
  alertButtons(305, 44, 'system:alert'),

  // 商品管理按钮
  buttons(210, 201, '商品', 'mall:product', { query: true, add: true, edit: true, remove: true, export: true }),

  // 分类管理按钮
  buttons(220, 202, '分类', 'mall:category', { query: true, add: true, edit: true, remove: true, export: true }),

  // 订单管理按钮
  buttons(230, 203, '订单', 'mall:order', { query: true, add: true, edit: true, remove: true, export: true }),

  // 会员管理按钮
  buttons(240, 204, '会员', 'mall:member', { query: true, add: true, edit: true, remove: true, export: true }),

  // 运营配置按钮
  buttons(250, 205, '配置', 'mall:banner', { query: true, add: true, edit: true, remove: true, export: true }),

  // 商品规格组按钮
  buttons(260, 206, '规格组', 'mall:product-spec-group', { query: true, add: true, edit: true, remove: true, export: true }),

  // 商品规格值按钮
  buttons(270, 207, '规格值', 'mall:product-spec-value', { query: true, add: true, edit: true, remove: true, export: true }),

  // SKU管理按钮
  buttons(280, 208, 'SKU', 'mall:product-sku', { query: true, add: true, edit: true, remove: true, export: true }),

  // 文章管理按钮
  buttons(310, 301, '文章', 'article', { query: true, add: true, edit: true, remove: true, export: true }),
];

  // 扁平化所有菜单（展平 buttons 返回的数组）
  const flatMenus: any[] = [];

  for (const item of menus) {
    if (Array.isArray(item)) {
      flatMenus.push(...item);
    } else {
      flatMenus.push(item);
    }
  }

  for (const menu of flatMenus) {
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

  // ============================================
  // 告警规则初始化
  // ============================================
  console.log('创建默认告警规则...');

  const defaultAlertRules = [
    {
      id: 1,
      name: 'CPU使用率过高',
      type: 'CPU',
      condition: 'GT',
      threshold: 80,
      level: 'WARNING',
      notifyType: 'WEBHOOK',
      silenceMins: 10,
      remark: 'CPU使用率超过80%时告警',
    },
    {
      id: 2,
      name: '内存使用率过高',
      type: 'MEMORY',
      condition: 'GT',
      threshold: 85,
      level: 'WARNING',
      notifyType: 'WEBHOOK',
      silenceMins: 10,
      remark: '内存使用率超过85%时告警',
    },
    {
      id: 3,
      name: '磁盘使用率过高',
      type: 'DISK',
      condition: 'GT',
      threshold: 90,
      level: 'CRITICAL',
      notifyType: 'WEBHOOK,EMAIL',
      silenceMins: 30,
      remark: '磁盘使用率超过90%时告警',
    },
    {
      id: 4,
      name: 'API错误率过高',
      type: 'API_ERROR_RATE',
      condition: 'GT',
      threshold: 5,
      level: 'ERROR',
      notifyType: 'WEBHOOK',
      silenceMins: 5,
      remark: 'API错误率超过5%时告警',
    },
    {
      id: 5,
      name: 'API响应时间过慢',
      type: 'API_RESPONSE_TIME',
      condition: 'GT',
      threshold: 1000,
      level: 'WARNING',
      notifyType: 'WEBHOOK',
      silenceMins: 5,
      remark: 'API平均响应时间超过1000ms时告警',
    },
    {
      id: 6,
      name: '登录失败次数过多',
      type: 'LOGIN_FAIL',
      condition: 'GT',
      threshold: 10,
      level: 'WARNING',
      silenceMins: 15,
      remark: '15分钟内登录失败超过10次时告警',
    },
    {
      id: 7,
      name: '数据库连接数过高',
      type: 'DB_CONNECTION',
      condition: 'GT',
      threshold: 80,
      level: 'WARNING',
      notifyType: 'WEBHOOK',
      silenceMins: 10,
      remark: '数据库连接数使用率超过80%时告警',
    },
  ];

  for (const rule of defaultAlertRules) {
    await prisma.sysAlertRule.upsert({
      where: { id: rule.id },
      update: {},
      create: {
        ...rule,
        enabled: true,
        createdBy: 'system',
      },
    });
  }

  // 重置告警规则ID序列
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('sys_alert_rule', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM sys_alert_rule)
    )
  `;

  console.log('默认告警规则创建完成!');
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
