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
      leader: '张技术',
      status: Status.ENABLED,
      createdBy: 'system',
    },
  });

  // 财务部
  const financeDept = await prisma.sysDept.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      parentId: 1,
      ancestors: '0,1',
      name: '财务部',
      sort: 2,
      leader: '李财务',
      status: Status.ENABLED,
      createdBy: 'system',
    },
  });

  // 人事部
  const hrDept = await prisma.sysDept.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      parentId: 1,
      ancestors: '0,1',
      name: '人事部',
      sort: 3,
      leader: '王人事',
      status: Status.ENABLED,
      createdBy: 'system',
    },
  });

  // 行政部
  const adminDept = await prisma.sysDept.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      parentId: 1,
      ancestors: '0,1',
      name: '行政部',
      sort: 4,
      leader: '赵行政',
      status: Status.ENABLED,
      createdBy: 'system',
    },
  });

  // 市场部
  const marketDept = await prisma.sysDept.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      parentId: 1,
      ancestors: '0,1',
      name: '市场部',
      sort: 5,
      leader: '孙市场',
      status: Status.ENABLED,
      createdBy: 'system',
    },
  });

  // 运营部
  const operationDept = await prisma.sysDept.upsert({
    where: { id: 7 },
    update: {},
    create: {
      id: 7,
      parentId: 1,
      ancestors: '0,1',
      name: '运营部',
      sort: 6,
      leader: '周运营',
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

  // 部门主管角色
  const deptManagerRole = await prisma.sysRole.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: '部门主管',
      key: 'dept_manager',
      sort: 3,
      dataScope: DataScope.DEPT,
      status: Status.ENABLED,
      remark: '部门主管，负责本部门审批',
      createdBy: 'system',
    },
  });

  // 人事经理角色
  const hrManagerRole = await prisma.sysRole.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: '人事经理',
      key: 'hr_manager',
      sort: 4,
      dataScope: DataScope.ALL,
      status: Status.ENABLED,
      remark: '人事部经理，负责人事相关审批',
      createdBy: 'system',
    },
  });

  // 财务主管角色
  const financeManagerRole = await prisma.sysRole.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      name: '财务主管',
      key: 'finance_manager',
      sort: 5,
      dataScope: DataScope.ALL,
      status: Status.ENABLED,
      remark: '财务部主管，负责5000以内费用审批',
      createdBy: 'system',
    },
  });

  // 财务总监角色
  const financeDirectorRole = await prisma.sysRole.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      name: '财务总监',
      key: 'finance_director',
      sort: 6,
      dataScope: DataScope.ALL,
      status: Status.ENABLED,
      remark: '财务总监，负责大额费用审批',
      createdBy: 'system',
    },
  });

  // 行政主管角色
  const adminManagerRole = await prisma.sysRole.upsert({
    where: { id: 7 },
    update: {},
    create: {
      id: 7,
      name: '行政主管',
      key: 'admin_manager',
      sort: 7,
      dataScope: DataScope.ALL,
      status: Status.ENABLED,
      remark: '行政部主管，负责行政相关审批',
      createdBy: 'system',
    },
  });

  // 部门总监角色
  const deptDirectorRole = await prisma.sysRole.upsert({
    where: { id: 8 },
    update: {},
    create: {
      id: 8,
      name: '部门总监',
      key: 'dept_director',
      sort: 8,
      dataScope: DataScope.DEPT,
      status: Status.ENABLED,
      remark: '部门总监，负责重大事项审批',
      createdBy: 'system',
    },
  });

  // 总经理角色
  const gmRole = await prisma.sysRole.upsert({
    where: { id: 9 },
    update: {},
    create: {
      id: 9,
      name: '总经理',
      key: 'general_manager',
      sort: 9,
      dataScope: DataScope.ALL,
      status: Status.ENABLED,
      remark: '总经理，最高审批权限',
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

  // 创建技术部主管
  const techManager = await prisma.sysUser.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      deptId: 2,
      username: 'zhangjs',
      password: hashedPassword,
      nickname: '张技术',
      email: 'zhangjs@example.com',
      phone: '13800000002',
      gender: Gender.MALE,
      status: Status.ENABLED,
      remark: '技术部主管',
      createdBy: 'system',
    },
  });
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: 2, roleId: 3 } },
    update: {},
    create: { userId: 2, roleId: 3 },
  });

  // 创建财务主管
  const financeManager = await prisma.sysUser.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      deptId: 3,
      username: 'licw',
      password: hashedPassword,
      nickname: '李财务',
      email: 'licw@example.com',
      phone: '13800000003',
      gender: Gender.FEMALE,
      status: Status.ENABLED,
      remark: '财务部主管',
      createdBy: 'system',
    },
  });
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: 3, roleId: 5 } },
    update: {},
    create: { userId: 3, roleId: 5 },
  });

  // 创建财务总监
  const financeDirector = await prisma.sysUser.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      deptId: 3,
      username: 'qiancz',
      password: hashedPassword,
      nickname: '钱总监',
      email: 'qiancz@example.com',
      phone: '13800000004',
      gender: Gender.MALE,
      status: Status.ENABLED,
      remark: '财务总监',
      createdBy: 'system',
    },
  });
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: 4, roleId: 6 } },
    update: {},
    create: { userId: 4, roleId: 6 },
  });

  // 创建人事经理
  const hrManager = await prisma.sysUser.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      deptId: 4,
      username: 'wangrs',
      password: hashedPassword,
      nickname: '王人事',
      email: 'wangrs@example.com',
      phone: '13800000005',
      gender: Gender.FEMALE,
      status: Status.ENABLED,
      remark: '人事部经理',
      createdBy: 'system',
    },
  });
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: 5, roleId: 4 } },
    update: {},
    create: { userId: 5, roleId: 4 },
  });

  // 创建行政主管
  const adminManager = await prisma.sysUser.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      deptId: 5,
      username: 'zhaoxz',
      password: hashedPassword,
      nickname: '赵行政',
      email: 'zhaoxz@example.com',
      phone: '13800000006',
      gender: Gender.MALE,
      status: Status.ENABLED,
      remark: '行政部主管',
      createdBy: 'system',
    },
  });
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: 6, roleId: 7 } },
    update: {},
    create: { userId: 6, roleId: 7 },
  });

  // 创建市场部主管
  const marketManager = await prisma.sysUser.upsert({
    where: { id: 7 },
    update: {},
    create: {
      id: 7,
      deptId: 6,
      username: 'sunsc',
      password: hashedPassword,
      nickname: '孙市场',
      email: 'sunsc@example.com',
      phone: '13800000007',
      gender: Gender.MALE,
      status: Status.ENABLED,
      remark: '市场部主管',
      createdBy: 'system',
    },
  });
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: 7, roleId: 3 } },
    update: {},
    create: { userId: 7, roleId: 3 },
  });

  // 创建运营部主管
  const operationManager = await prisma.sysUser.upsert({
    where: { id: 8 },
    update: {},
    create: {
      id: 8,
      deptId: 7,
      username: 'zhouyy',
      password: hashedPassword,
      nickname: '周运营',
      email: 'zhouyy@example.com',
      phone: '13800000008',
      gender: Gender.FEMALE,
      status: Status.ENABLED,
      remark: '运营部主管',
      createdBy: 'system',
    },
  });
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: 8, roleId: 3 } },
    update: {},
    create: { userId: 8, roleId: 3 },
  });

  // 创建技术部总监
  const techDirector = await prisma.sysUser.upsert({
    where: { id: 9 },
    update: {},
    create: {
      id: 9,
      deptId: 2,
      username: 'wuzj',
      password: hashedPassword,
      nickname: '吴总监',
      email: 'wuzj@example.com',
      phone: '13800000009',
      gender: Gender.MALE,
      status: Status.ENABLED,
      remark: '技术部总监',
      createdBy: 'system',
    },
  });
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: 9, roleId: 8 } },
    update: {},
    create: { userId: 9, roleId: 8 },
  });

  // 创建总经理
  const gm = await prisma.sysUser.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      deptId: 1,
      username: 'chenzy',
      password: hashedPassword,
      nickname: '陈总',
      email: 'chenzy@example.com',
      phone: '13800000010',
      gender: Gender.MALE,
      status: Status.ENABLED,
      remark: '总经理',
      createdBy: 'system',
    },
  });
  await prisma.sysUserRole.upsert({
    where: { userId_roleId: { userId: 10, roleId: 9 } },
    update: {},
    create: { userId: 10, roleId: 9 },
  });

  // 创建几个普通员工
  const employees = [
    { id: 11, deptId: 2, username: 'tech01', nickname: '技术员工1', phone: '13800000011' },
    { id: 12, deptId: 2, username: 'tech02', nickname: '技术员工2', phone: '13800000012' },
    { id: 13, deptId: 3, username: 'finance01', nickname: '财务员工1', phone: '13800000013' },
    { id: 14, deptId: 4, username: 'hr01', nickname: '人事员工1', phone: '13800000014' },
    { id: 15, deptId: 5, username: 'admin01', nickname: '行政员工1', phone: '13800000015' },
    { id: 16, deptId: 6, username: 'market01', nickname: '市场员工1', phone: '13800000016' },
    { id: 17, deptId: 7, username: 'operation01', nickname: '运营员工1', phone: '13800000017' },
  ];

  for (const emp of employees) {
    await prisma.sysUser.upsert({
      where: { id: emp.id },
      update: {},
      create: {
        id: emp.id,
        deptId: emp.deptId,
        username: emp.username,
        password: hashedPassword,
        nickname: emp.nickname,
        email: `${emp.username}@example.com`,
        phone: emp.phone,
        gender: Gender.MALE,
        status: Status.ENABLED,
        remark: '普通员工',
        createdBy: 'system',
      },
    });
    await prisma.sysUserRole.upsert({
      where: { userId_roleId: { userId: emp.id, roleId: 2 } },
      update: {},
      create: { userId: emp.id, roleId: 2 },
    });
  }

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
  options: {
    query?: boolean;
    add?: boolean;
    edit?: boolean;
    remove?: boolean;
    export?: boolean;
    resetPwd?: boolean;
    run?: boolean;
    log?: boolean;
    publish?: boolean;
    disable?: boolean;
    cancel?: boolean;
    terminate?: boolean;
    approve?: boolean;
    reject?: boolean;
    transfer?: boolean;
    countersign?: boolean;
    urge?: boolean;
    read?: boolean;
  } = {}
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
    publish: '发布',
    disable: '停用',
    cancel: '取消',
    terminate: '终止',
    approve: '通过',
    reject: '驳回',
    transfer: '转办',
    countersign: '加签',
    urge: '催办',
    read: '标记已读',
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
    publish: 'publish',
    disable: 'disable',
    cancel: 'cancel',
    terminate: 'terminate',
    approve: 'approve',
    reject: 'reject',
    transfer: 'transfer',
    countersign: 'countersign',
    urge: 'urge',
    read: 'read',
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
  menu(27, 10, '文件管理', '/system/file', 'system/file/index', 'FolderOutlined', 'system:file:list', 13),

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
  menu(205, 200, '运营配置', '/mall/banner', 'banner/index', 'PictureOutlined', 'mall:banner:list', 4),
  menu(206, 200, '规格管理', '/mall/spec', 'product-spec-group/index', 'TagsOutlined', 'mall:product-spec-group:list', 5),
  menu(208, 200, 'SKU管理', '/mall/sku', 'product-sku/index', 'ShoppingCartOutlined', 'mall:product-sku:list', 6),

  // ============================================
  // 会员管理模块
  // ============================================
  dir(500, 0, '会员管理', '/member', 'TeamOutlined', 'member:manage', 5),
  menu(501, 500, '会员列表', '/member/list', 'member/index', 'UserOutlined', 'member:member:list', 1),
  menu(502, 500, '会员等级', '/member/level', 'member-level/index', 'CrownOutlined', 'member:level:list', 2),
  menu(503, 500, '收货地址', '/member/address', 'member-address/index', 'EnvironmentOutlined', 'member:address:list', 3),
  menu(504, 500, '发票信息', '/member/invoice', 'member-invoice/index', 'FileTextOutlined', 'member:invoice:list', 4),
  menu(505, 500, '登录日志', '/member/login-log', 'member-login-log/index', 'LoginOutlined', 'member:login-log:list', 5),
  menu(506, 500, '余额流水', '/member/balance-log', 'member-balance-log/index', 'WalletOutlined', 'member:balance-log:list', 6),
  menu(507, 500, '积分流水', '/member/point-log', 'member-point-log/index', 'GiftOutlined', 'member:point-log:list', 7),

  // ============================================
  // 文章管理模块
  // ============================================
  dir(300, 0, '文章管理', '/article', 'FileTextOutlined', 'article:manage', 6),
  menu(301, 300, '文章列表', '/article/list', 'article/index', 'UnorderedListOutlined', 'article:list', 1),

  // ============================================
  // 审批管理模块
  // ============================================
  dir(400, 0, '审批管理', '/workflow', 'BranchesOutlined', 'workflow:manage', 6),
  menu(401, 400, '流程分类', '/workflow/category', 'workflow/category/index', 'TagsOutlined', 'workflow:category:list', 1),
  menu(402, 400, '流程定义', '/workflow/definition', 'workflow/definition/index', 'ProjectOutlined', 'workflow:definition:list', 2),
  menu(403, 400, '流程实例', '/workflow/instance', 'workflow/instance/index', 'AuditOutlined', 'workflow:instance:list', 3),
  menu(404, 400, '任务管理', '/workflow/task', 'workflow/task/index', 'CheckCircleOutlined', 'workflow:task:list', 4),

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

  // 文件管理按钮
  button(320, 27, '文件查询', 'system:file:query'),
  button(321, 27, '文件删除', 'system:file:remove'),

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

  // 运营配置按钮
  buttons(250, 205, '配置', 'mall:banner', { query: true, add: true, edit: true, remove: true, export: true }),

  // 规格管理按钮（规格组+规格值）
  buttons(260, 206, '规格组', 'mall:product-spec-group', { query: true, add: true, edit: true, remove: true }),
  buttons(270, 206, '规格值', 'mall:product-spec-value', { query: true, add: true, edit: true, remove: true }),

  // SKU管理按钮
  buttons(280, 208, 'SKU', 'mall:product-sku', { query: true, add: true, edit: true, remove: true, export: true }),

  // 会员列表按钮
  buttons(510, 501, '会员', 'member:member', { query: true, add: true, edit: true, remove: true, export: true }),

  // 会员等级按钮
  buttons(520, 502, '会员等级', 'member:level', { query: true, add: true, edit: true, remove: true }),

  // 收货地址按钮
  buttons(530, 503, '收货地址', 'member:address', { query: true, add: true, edit: true, remove: true }),

  // 发票信息按钮
  buttons(540, 504, '发票信息', 'member:invoice', { query: true, add: true, edit: true, remove: true }),

  // 登录日志按钮
  button(550, 505, '查询', 'member:login-log:list'),
  button(551, 505, '删除', 'member:login-log:remove'),

  // 余额流水按钮
  button(560, 506, '查询', 'member:balance-log:list'),
  button(561, 506, '调整', 'member:balance-log:adjust'),

  // 积分流水按钮
  button(570, 507, '查询', 'member:point-log:list'),
  button(571, 507, '调整', 'member:point-log:adjust'),

  // ============================================
  // 数据权限模块
  // ============================================
  dir(600, 0, '数据权限', '/data', 'SafetyCertificateOutlined', 'data:manage', 7),
  menu(601, 600, '敏感数据权限', '/data/sensitive', 'data/sensitive/index', 'EyeInvisibleOutlined', 'data:sensitive:manage', 1),

  // 敏感数据权限按钮
  button(610, 601, '查看所有敏感数据', 'data:sensitive:all'),
  button(611, 601, '查看完整手机号', 'data:sensitive:phone'),
  button(612, 601, '查看完整邮箱', 'data:sensitive:email'),
  button(613, 601, '查看完整身份证', 'data:sensitive:idcard'),
  button(614, 601, '查看完整银行卡号', 'data:sensitive:bankcard'),
  button(615, 601, '查看完整姓名', 'data:sensitive:name'),
  button(616, 601, '查看完整地址', 'data:sensitive:address'),

  // 文章管理按钮
  buttons(310, 301, '文章', 'article', { query: true, add: true, edit: true, remove: true, export: true }),

  // 流程分类按钮
  buttons(410, 401, '分类', 'workflow:category', { query: true, add: true, edit: true, remove: true }),

  // 流程定义按钮
  buttons(420, 402, '流程', 'workflow:definition', { query: true, add: true, edit: true, remove: true, publish: true, disable: true }),
  button(421, 402, '流程设计', 'workflow:definition:design'),

  // 流程实例按钮
  buttons(430, 403, '实例', 'workflow:instance', { query: true, cancel: true, terminate: true }),
  button(435, 403, '发起流程', 'workflow:instance:start'),

  // 任务管理按钮（包含抄送记录权限）
  buttons(440, 404, '任务', 'workflow:task', { query: true, approve: true, reject: true, transfer: true, countersign: true, urge: true }),
  // 抄送记录权限（整合到任务管理中）
  button(450, 404, '抄送查询', 'workflow:copy:query'),
  button(451, 404, '抄送标记已读', 'workflow:copy:read'),

  // ============================================
  // 营销管理模块
  // ============================================
  dir(700, 0, '营销管理', '/marketing', 'GiftOutlined', 'marketing:manage', 8),

  // 优惠券模板
  menu(701, 700, '优惠券模板', '/marketing/coupon-template', 'marketing/coupon-template/index', 'CouponOutlined', 'marketing:coupon-template:list', 1),

  // 用户优惠券
  menu(702, 700, '用户优惠券', '/marketing/member-coupon', 'marketing/member-coupon/index', 'IdcardOutlined', 'marketing:member-coupon:list', 2),

  // 满减活动
  menu(703, 700, '满减活动', '/marketing/full-reduction', 'marketing/full-reduction/index', 'PartitionOutlined', 'marketing:full-reduction:list', 3),

  // 促销活动
  menu(704, 700, '促销活动', '/marketing/promotion', 'marketing/promotion/index', 'ThunderboltOutlined', 'marketing:promotion:list', 4),

  // 促销商品
  menu(705, 700, '促销商品', '/marketing/promotion-product', 'marketing/promotion-product/index', 'AppstoreOutlined', 'marketing:promotion-product:list', 5),

  // 拼团订单
  menu(706, 700, '拼团订单', '/marketing/group-buy-order', 'marketing/group-buy-order/index', 'TeamOutlined', 'marketing:group-buy-order:list', 6),

  // 拼团成员
  menu(707, 700, '拼团成员', '/marketing/group-buy-member', 'marketing/group-buy-member/index', 'UserOutlined', 'marketing:group-buy-member:list', 7),

  // 积分规则
  menu(708, 700, '积分规则', '/marketing/point-rule', 'marketing/point-rule/index', 'SettingOutlined', 'marketing:point-rule:list', 8),

  // 积分商品
  menu(709, 700, '积分商品', '/marketing/point-product', 'marketing/point-product/index', 'ShoppingCartOutlined', 'marketing:point-product:list', 9),

  // 积分兑换记录
  menu(710, 700, '兑换记录', '/marketing/point-exchange', 'marketing/point-exchange/index', 'FileTextOutlined', 'marketing:point-exchange:list', 10),

  // 签到记录
  menu(711, 700, '签到记录', '/marketing/sign-in', 'marketing/sign-in/index', 'CalendarOutlined', 'marketing:sign-in:list', 11),

  // ============================================
  // 营销管理按钮权限
  // ============================================

  // 优惠券模板按钮
  buttons(720, 701, '优惠券模板', 'marketing:coupon-template', { query: true, add: true, edit: true, remove: true, disable: true }),
  button(726, 701, '发放优惠券', 'marketing:coupon-template:grant'),

  // 用户优惠券按钮
  button(730, 702, '查询', 'marketing:member-coupon:query'),
  button(731, 702, '禁用', 'marketing:member-coupon:disable'),
  button(732, 702, '核销', 'marketing:member-coupon:use'),

  // 满减活动按钮
  buttons(740, 703, '满减活动', 'marketing:full-reduction', { query: true, add: true, edit: true, remove: true, disable: true }),

  // 促销活动按钮
  buttons(750, 704, '促销活动', 'marketing:promotion', { query: true, add: true, edit: true, remove: true, disable: true }),

  // 促销商品按钮
  buttons(760, 705, '促销商品', 'marketing:promotion-product', { query: true, add: true, edit: true, remove: true }),

  // 拼团订单按钮
  button(770, 706, '查询', 'marketing:group-buy-order:query'),
  button(771, 706, '取消', 'marketing:group-buy-order:cancel'),
  button(772, 706, '手动成团', 'marketing:group-buy-order:manual-finish'),

  // 拼团成员按钮
  button(780, 707, '查询', 'marketing:group-buy-member:query'),

  // 积分规则按钮
  buttons(790, 708, '积分规则', 'marketing:point-rule', { query: true, add: true, edit: true, remove: true, disable: true }),

  // 积分商品按钮
  buttons(800, 709, '积分商品', 'marketing:point-product', { query: true, add: true, edit: true, remove: true, disable: true }),
  button(806, 709, '下架', 'marketing:point-product:offline'),

  // 积分兑换记录按钮
  button(810, 710, '查询', 'marketing:point-exchange:query'),
  button(811, 710, '发货', 'marketing:point-exchange:ship'),
  button(812, 710, '取消', 'marketing:point-exchange:cancel'),
  button(813, 710, '完成', 'marketing:point-exchange:complete'),

  // 签到记录按钮
  button(820, 711, '查询', 'marketing:sign-in:query'),
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

  console.log('管理员菜单权限分配完成');

  // ============================================
  // 为其他角色分配菜单权限
  // ============================================

  // 普通用户权限（发起流程、查看自己的实例、任务管理中的抄送记录）
  // buttons函数从baseId开始递增分配ID
  // 流程实例(430): query=430, cancel=431, terminate=432; start=435
  // 抄送记录权限(450-451): 现在挂在任务管理(404)下
  const commonUserMenuIds = [
    1,    // 首页
    400,  // 审批管理目录
    403,  // 流程实例菜单
    430,  // workflow:instance:query - 实例查询
    435,  // workflow:instance:start - 发起流程
    404,  // 任务管理菜单（包含抄送记录Tab）
    450,  // workflow:copy:query - 抄送查询
    451,  // workflow:copy:read - 标记已读
  ];

  // 审批人员权限（在普通用户基础上增加任务审批权限）
  // 任务管理(440): query=440, approve=441, reject=442, transfer=443, countersign=444, urge=445
  const approverMenuIds = [
    ...commonUserMenuIds,
    // 404 任务管理菜单已在 commonUserMenuIds 中
    440,  // workflow:task:query - 任务查询
    441,  // workflow:task:approve - 任务通过
    442,  // workflow:task:reject - 任务驳回
    443,  // workflow:task:transfer - 任务转办
    444,  // workflow:task:countersign - 任务加签
    445,  // workflow:task:urge - 任务催办
  ];

  // 为普通用户角色分配权限 (roleId: 2)
  for (const menuId of commonUserMenuIds) {
    await prisma.sysRoleMenu.upsert({
      where: { roleId_menuId: { roleId: 2, menuId } },
      update: {},
      create: { roleId: 2, menuId },
    });
  }
  console.log('普通用户菜单权限分配完成');

  // 为审批类角色分配权限 (roleId: 3-9)
  const approverRoleIds = [3, 4, 5, 6, 7, 8, 9]; // 部门主管、人事经理、财务主管、财务总监、行政主管、部门总监、总经理
  for (const roleId of approverRoleIds) {
    for (const menuId of approverMenuIds) {
      await prisma.sysRoleMenu.upsert({
        where: { roleId_menuId: { roleId, menuId } },
        update: {},
        create: { roleId, menuId },
      });
    }
  }
  console.log('审批角色菜单权限分配完成');

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
            specCombination: {
              颜色: color.name,
              尺寸: size.name,
            },
            price: 99.99,
            costPrice: 49.99,
            stock: 50,
            lowStockAlert: 10,
            sales: Math.floor(Math.random() * 20),
            weight: 0.25,
            images: [
              `https://example.com/product-${color.name}-${size.name}.jpg`,
            ],
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
  // 会员等级规则初始化
  // ============================================
  console.log('创建会员等级规则...');

  const memberLevelRules = [
    {
      id: 1,
      code: 'LEVEL_1',
      name: '普通会员',
      level: 1,
      minGrowth: 0,
      maxGrowth: 999,
      discountRate: 1.0,
      pointsRate: 1.0,
      benefits: '基础会员权益',
      sort: 1,
      remark: '注册即成为普通会员',
    },
    {
      id: 2,
      code: 'LEVEL_2',
      name: '白银会员',
      level: 2,
      minGrowth: 1000,
      maxGrowth: 4999,
      discountRate: 0.98,
      pointsRate: 1.2,
      benefits: '享受98折优惠,积分1.2倍',
      sort: 2,
      remark: '累计成长值达到1000升级',
    },
    {
      id: 3,
      code: 'LEVEL_3',
      name: '黄金会员',
      level: 3,
      minGrowth: 5000,
      maxGrowth: 19999,
      discountRate: 0.95,
      pointsRate: 1.5,
      benefits: '享受95折优惠,积分1.5倍,专属客服',
      sort: 3,
      remark: '累计成长值达到5000升级',
    },
    {
      id: 4,
      code: 'LEVEL_4',
      name: '铂金会员',
      level: 4,
      minGrowth: 20000,
      maxGrowth: 49999,
      discountRate: 0.92,
      pointsRate: 2.0,
      benefits: '享受92折优惠,积分2倍,专属客服,生日礼包',
      sort: 4,
      remark: '累计成长值达到20000升级',
    },
    {
      id: 5,
      code: 'LEVEL_5',
      name: '钻石会员',
      level: 5,
      minGrowth: 50000,
      maxGrowth: null,
      discountRate: 0.88,
      pointsRate: 3.0,
      benefits: '享受88折优惠,积分3倍,专属客服,生日礼包,优先发货',
      sort: 5,
      remark: '累计成长值达到50000升级',
    },
  ];

  for (const rule of memberLevelRules) {
    await prisma.memberLevelRule.upsert({
      where: { id: rule.id },
      update: {},
      create: {
        ...rule,
        status: Status.ENABLED,
        createdBy: 'system',
      },
    });
  }

  // 重置会员等级ID序列
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('member_level_rule', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM member_level_rule)
    )
  `;

  console.log('会员等级规则创建完成!');

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

  // ============================================
  // 工作流示例数据
  // ============================================
  console.log('创建工作流示例数据...');

  // 创建流程分类
  const workflowCategories = [
    {
      id: 1,
      code: 'HR',
      name: '人事审批',
      icon: 'TeamOutlined',
      color: '#1890ff',
      sort: 1,
      remark: '人事相关的审批流程',
    },
    {
      id: 2,
      code: 'FINANCE',
      name: '财务审批',
      icon: 'AccountBookOutlined',
      color: '#52c41a',
      sort: 2,
      remark: '财务相关的审批流程',
    },
    {
      id: 3,
      code: 'ADMIN',
      name: '行政审批',
      icon: 'FileTextOutlined',
      color: '#faad14',
      sort: 3,
      remark: '行政相关的审批流程',
    },
    {
      id: 4,
      code: 'PROJECT',
      name: '项目审批',
      icon: 'ProjectOutlined',
      color: '#722ed1',
      sort: 4,
      remark: '项目相关的审批流程',
    },
  ];

  for (const category of workflowCategories) {
    await prisma.wfCategory.upsert({
      where: { id: category.id },
      update: {},
      create: {
        ...category,
        status: 'ENABLED',
        level: 0,
        createdBy: 'system',
      },
    });
  }

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('wf_category', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM wf_category)
    )
  `;

  console.log('流程分类创建完成');

  // 创建示例流程定义
  const flowDefinitions = [
    {
      id: 1,
      code: 'LEAVE_APPLY',
      name: '请假申请',
      categoryId: 1,
      version: 1,
      status: 'PUBLISHED',
      isMain: true,
      description: '员工请假申请流程，支持年假、事假、病假等类型',
      flowData: {
        nodes: [
          { id: 'start_1', type: 'start-node', x: 300, y: 50, data: { label: '开始', nodeType: 'START' } },
          { id: 'approval_1', type: 'approval-node', x: 300, y: 150, data: { label: '部门主管审批', nodeType: 'APPROVAL' } },
          { id: 'condition_1', type: 'condition-node', x: 300, y: 270, data: { label: '请假天数判断', nodeType: 'CONDITION' } },
          { id: 'approval_2', type: 'approval-node', x: 500, y: 380, data: { label: '人事经理审批', nodeType: 'APPROVAL' } },
          { id: 'end_1', type: 'end-node', x: 300, y: 500, data: { label: '结束', nodeType: 'END' } },
        ],
        edges: [
          { id: 'edge_1', source: 'start_1', target: 'approval_1', sourcePort: 'port-bottom', targetPort: 'port-top' },
          { id: 'edge_2', source: 'approval_1', target: 'condition_1', sourcePort: 'port-bottom', targetPort: 'port-top' },
          { id: 'edge_3', source: 'condition_1', target: 'approval_2', sourcePort: 'port-right', targetPort: 'port-top', data: { label: '>=3天' } },
          { id: 'edge_4', source: 'condition_1', target: 'end_1', sourcePort: 'port-bottom', targetPort: 'port-top', data: { label: '<3天' } },
          { id: 'edge_5', source: 'approval_2', target: 'end_1', sourcePort: 'port-bottom', targetPort: 'port-right' },
        ],
      },
      formData: [
        { fieldName: 'leaveType', fieldLabel: '请假类型', fieldType: 'select', required: true, options: [
          { label: '年假', value: 'annual' },
          { label: '事假', value: 'personal' },
          { label: '病假', value: 'sick' },
          { label: '婚假', value: 'marriage' },
          { label: '产假', value: 'maternity' },
        ]},
        { fieldName: 'startDate', fieldLabel: '开始日期', fieldType: 'date', required: true },
        { fieldName: 'endDate', fieldLabel: '结束日期', fieldType: 'date', required: true },
        { fieldName: 'days', fieldLabel: '请假天数', fieldType: 'number', required: true },
        { fieldName: 'reason', fieldLabel: '请假事由', fieldType: 'textarea', required: true },
      ],
    },
    {
      id: 2,
      code: 'EXPENSE_CLAIM',
      name: '费用报销',
      categoryId: 2,
      version: 1,
      status: 'PUBLISHED',
      isMain: true,
      description: '员工费用报销流程，支持差旅费、交通费、餐饮费等报销',
      flowData: {
        nodes: [
          { id: 'start_1', type: 'start-node', x: 300, y: 50, data: { label: '开始', nodeType: 'START' } },
          { id: 'approval_1', type: 'approval-node', x: 300, y: 150, data: { label: '部门主管审批', nodeType: 'APPROVAL' } },
          { id: 'condition_1', type: 'condition-node', x: 300, y: 270, data: { label: '金额判断', nodeType: 'CONDITION' } },
          { id: 'approval_2', type: 'approval-node', x: 120, y: 380, data: { label: '财务主管审批', nodeType: 'APPROVAL' } },
          { id: 'approval_3', type: 'approval-node', x: 480, y: 380, data: { label: '财务总监审批', nodeType: 'APPROVAL' } },
          { id: 'end_1', type: 'end-node', x: 300, y: 500, data: { label: '结束', nodeType: 'END' } },
        ],
        edges: [
          { id: 'edge_1', source: 'start_1', target: 'approval_1', sourcePort: 'port-bottom', targetPort: 'port-top' },
          { id: 'edge_2', source: 'approval_1', target: 'condition_1', sourcePort: 'port-bottom', targetPort: 'port-top' },
          { id: 'edge_3', source: 'condition_1', target: 'approval_2', sourcePort: 'port-left', targetPort: 'port-top', data: { label: '<=5000' } },
          { id: 'edge_4', source: 'condition_1', target: 'approval_3', sourcePort: 'port-right', targetPort: 'port-top', data: { label: '>5000' } },
          { id: 'edge_5', source: 'approval_2', target: 'end_1', sourcePort: 'port-bottom', targetPort: 'port-left' },
          { id: 'edge_6', source: 'approval_3', target: 'end_1', sourcePort: 'port-bottom', targetPort: 'port-right' },
        ],
      },
      formData: [
        { fieldName: 'expenseType', fieldLabel: '费用类型', fieldType: 'select', required: true, options: [
          { label: '差旅费', value: 'travel' },
          { label: '交通费', value: 'transport' },
          { label: '餐饮费', value: 'meal' },
          { label: '办公用品', value: 'office' },
          { label: '其他', value: 'other' },
        ]},
        { fieldName: 'amount', fieldLabel: '报销金额', fieldType: 'number', required: true },
        { fieldName: 'expenseDate', fieldLabel: '费用发生日期', fieldType: 'date', required: true },
        { fieldName: 'description', fieldLabel: '费用说明', fieldType: 'textarea', required: true },
      ],
    },
    {
      id: 3,
      code: 'PURCHASE_REQUEST',
      name: '采购申请',
      categoryId: 3,
      version: 1,
      status: 'PUBLISHED',
      isMain: true,
      description: '物资采购申请流程，需要部门主管和行政部审批',
      flowData: {
        nodes: [
          { id: 'start_1', type: 'start-node', x: 300, y: 50, data: { label: '开始', nodeType: 'START' } },
          { id: 'approval_1', type: 'approval-node', x: 300, y: 160, data: { label: '部门主管审批', nodeType: 'APPROVAL' } },
          { id: 'approval_2', type: 'approval-node', x: 300, y: 270, data: { label: '行政部审批', nodeType: 'APPROVAL' } },
          { id: 'end_1', type: 'end-node', x: 300, y: 380, data: { label: '结束', nodeType: 'END' } },
        ],
        edges: [
          { id: 'edge_1', source: 'start_1', target: 'approval_1', sourcePort: 'port-bottom', targetPort: 'port-top' },
          { id: 'edge_2', source: 'approval_1', target: 'approval_2', sourcePort: 'port-bottom', targetPort: 'port-top' },
          { id: 'edge_3', source: 'approval_2', target: 'end_1', sourcePort: 'port-bottom', targetPort: 'port-top' },
        ],
      },
      formData: [
        { fieldName: 'itemName', fieldLabel: '物品名称', fieldType: 'text', required: true },
        { fieldName: 'quantity', fieldLabel: '数量', fieldType: 'number', required: true },
        { fieldName: 'estimatedPrice', fieldLabel: '预估单价', fieldType: 'number', required: true },
        { fieldName: 'totalAmount', fieldLabel: '预估总价', fieldType: 'number', required: true },
        { fieldName: 'purpose', fieldLabel: '用途说明', fieldType: 'textarea', required: true },
        { fieldName: 'expectedDate', fieldLabel: '期望到货日期', fieldType: 'date', required: false },
      ],
    },
    {
      id: 4,
      code: 'PROJECT_APPROVAL',
      name: '项目立项申请',
      categoryId: 4,
      version: 1,
      status: 'PUBLISHED',
      isMain: true,
      description: '新项目立项审批流程，需要部门总监和总经理审批',
      flowData: {
        nodes: [
          { id: 'start_1', type: 'start-node', x: 300, y: 50, data: { label: '开始', nodeType: 'START' } },
          { id: 'approval_1', type: 'approval-node', x: 300, y: 160, data: { label: '部门总监审批', nodeType: 'APPROVAL' } },
          { id: 'approval_2', type: 'approval-node', x: 300, y: 270, data: { label: '总经理审批', nodeType: 'APPROVAL' } },
          { id: 'end_1', type: 'end-node', x: 300, y: 380, data: { label: '结束', nodeType: 'END' } },
        ],
        edges: [
          { id: 'edge_1', source: 'start_1', target: 'approval_1', sourcePort: 'port-bottom', targetPort: 'port-top' },
          { id: 'edge_2', source: 'approval_1', target: 'approval_2', sourcePort: 'port-bottom', targetPort: 'port-top' },
          { id: 'edge_3', source: 'approval_2', target: 'end_1', sourcePort: 'port-bottom', targetPort: 'port-top' },
        ],
      },
      formData: [
        { fieldName: 'projectName', fieldLabel: '项目名称', fieldType: 'text', required: true },
        { fieldName: 'projectType', fieldLabel: '项目类型', fieldType: 'select', required: true, options: [
          { label: '研发项目', value: 'rd' },
          { label: '市场项目', value: 'market' },
          { label: '运营项目', value: 'operation' },
          { label: '内部项目', value: 'internal' },
        ]},
        { fieldName: 'budget', fieldLabel: '项目预算', fieldType: 'number', required: true },
        { fieldName: 'startDate', fieldLabel: '预计开始日期', fieldType: 'date', required: true },
        { fieldName: 'endDate', fieldLabel: '预计结束日期', fieldType: 'date', required: true },
        { fieldName: 'objectives', fieldLabel: '项目目标', fieldType: 'textarea', required: true },
        { fieldName: 'teamMembers', fieldLabel: '项目成员', fieldType: 'text', required: false },
      ],
    },
    {
      id: 5,
      code: 'OVERTIME_APPLY',
      name: '加班申请',
      categoryId: 1,
      version: 1,
      status: 'PUBLISHED',
      isMain: true,
      description: '员工加班申请流程，需要部门主管审批',
      flowData: {
        nodes: [
          { id: 'start_1', type: 'start-node', x: 300, y: 50, data: { label: '开始', nodeType: 'START' } },
          { id: 'approval_1', type: 'approval-node', x: 300, y: 160, data: { label: '部门主管审批', nodeType: 'APPROVAL' } },
          { id: 'end_1', type: 'end-node', x: 300, y: 270, data: { label: '结束', nodeType: 'END' } },
        ],
        edges: [
          { id: 'edge_1', source: 'start_1', target: 'approval_1', sourcePort: 'port-bottom', targetPort: 'port-top' },
          { id: 'edge_2', source: 'approval_1', target: 'end_1', sourcePort: 'port-bottom', targetPort: 'port-top' },
        ],
      },
      formData: [
        { fieldName: 'overtimeDate', fieldLabel: '加班日期', fieldType: 'date', required: true },
        { fieldName: 'startTime', fieldLabel: '开始时间', fieldType: 'text', required: true },
        { fieldName: 'endTime', fieldLabel: '结束时间', fieldType: 'text', required: true },
        { fieldName: 'hours', fieldLabel: '加班时长(小时)', fieldType: 'number', required: true },
        { fieldName: 'reason', fieldLabel: '加班事由', fieldType: 'textarea', required: true },
      ],
    },
  ];

  for (const flow of flowDefinitions) {
    await prisma.wfFlowDefinition.upsert({
      where: { id: flow.id },
      update: {},
      create: {
        ...flow,
        status: flow.status as any,
        createdBy: 'system',
      },
    });
  }

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('wf_flow_definition', 'id'),
      (SELECT COALESCE(MAX(id), 0) FROM wf_flow_definition)
    )
  `;

  // 创建节点配置（为每个审批节点配置审批人）
  // 角色ID对应关系：
  // 3 - 部门主管 (dept_manager)
  // 4 - 人事经理 (hr_manager)
  // 5 - 财务主管 (finance_manager)
  // 6 - 财务总监 (finance_director)
  // 7 - 行政主管 (admin_manager)
  // 8 - 部门总监 (dept_director)
  // 9 - 总经理 (general_manager)
  const nodeConfigs = [
    // 请假申请流程节点配置
    { flowDefinitionId: 1, nodeId: 'approval_1', nodeType: 'APPROVAL', nodeName: '部门主管审批', assigneeType: 'ROLE', assigneeConfig: { roleIds: [3] }, emptyAssigneeAction: 'TO_ADMIN' },
    { flowDefinitionId: 1, nodeId: 'approval_2', nodeType: 'APPROVAL', nodeName: '人事经理审批', assigneeType: 'ROLE', assigneeConfig: { roleIds: [4] }, emptyAssigneeAction: 'TO_ADMIN' },
    // 费用报销流程节点配置
    { flowDefinitionId: 2, nodeId: 'approval_1', nodeType: 'APPROVAL', nodeName: '部门主管审批', assigneeType: 'ROLE', assigneeConfig: { roleIds: [3] }, emptyAssigneeAction: 'TO_ADMIN' },
    { flowDefinitionId: 2, nodeId: 'approval_2', nodeType: 'APPROVAL', nodeName: '财务主管审批', assigneeType: 'ROLE', assigneeConfig: { roleIds: [5] }, emptyAssigneeAction: 'TO_ADMIN' },
    { flowDefinitionId: 2, nodeId: 'approval_3', nodeType: 'APPROVAL', nodeName: '财务总监审批', assigneeType: 'ROLE', assigneeConfig: { roleIds: [6] }, emptyAssigneeAction: 'TO_ADMIN' },
    // 采购申请流程节点配置
    { flowDefinitionId: 3, nodeId: 'approval_1', nodeType: 'APPROVAL', nodeName: '部门主管审批', assigneeType: 'ROLE', assigneeConfig: { roleIds: [3] }, emptyAssigneeAction: 'TO_ADMIN' },
    { flowDefinitionId: 3, nodeId: 'approval_2', nodeType: 'APPROVAL', nodeName: '行政部审批', assigneeType: 'ROLE', assigneeConfig: { roleIds: [7] }, emptyAssigneeAction: 'TO_ADMIN' },
    // 项目立项流程节点配置
    { flowDefinitionId: 4, nodeId: 'approval_1', nodeType: 'APPROVAL', nodeName: '部门总监审批', assigneeType: 'ROLE', assigneeConfig: { roleIds: [8] }, emptyAssigneeAction: 'TO_ADMIN' },
    { flowDefinitionId: 4, nodeId: 'approval_2', nodeType: 'APPROVAL', nodeName: '总经理审批', assigneeType: 'ROLE', assigneeConfig: { roleIds: [9] }, emptyAssigneeAction: 'TO_ADMIN' },
    // 加班申请流程节点配置
    { flowDefinitionId: 5, nodeId: 'approval_1', nodeType: 'APPROVAL', nodeName: '部门主管审批', assigneeType: 'ROLE', assigneeConfig: { roleIds: [3] }, emptyAssigneeAction: 'TO_ADMIN' },
  ];

  for (const config of nodeConfigs) {
    // 先检查是否已存在
    const existing = await prisma.wfNodeConfig.findFirst({
      where: {
        flowDefinitionId: config.flowDefinitionId,
        nodeId: config.nodeId,
        deleted: false,
      },
    });

    if (!existing) {
      await prisma.wfNodeConfig.create({
        data: {
          ...config,
          nodeType: config.nodeType as any,
          assigneeType: config.assigneeType as any,
          emptyAssigneeAction: config.emptyAssigneeAction as any,
          createdBy: 'system',
        },
      });
    }
  }

  console.log('节点配置创建完成');
  console.log('流程定义示例创建完成');
  console.log('工作流示例数据创建完成!');

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
