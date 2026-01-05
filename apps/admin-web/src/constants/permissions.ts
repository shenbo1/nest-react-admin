/**
 * 权限标识常量
 * 格式：模块:操作:资源
 */

// 仪表盘权限
export const DASHBOARD = {
  LIST: 'dashboard:list',
} as const;

// 系统管理权限
export const SYSTEM = {
  MANAGE: 'system:manage',
  USER: {
    LIST: 'system:user:list',
    ADD: 'system:user:add',
    EDIT: 'system:user:edit',
    REMOVE: 'system:user:remove',
    QUERY: 'system:user:query',
    RESET_PWD: 'system:user:resetPwd',
    EXPORT: 'system:user:export',
    IMPORT: 'system:user:import',
  },
  ROLE: {
    LIST: 'system:role:list',
    ADD: 'system:role:add',
    EDIT: 'system:role:edit',
    REMOVE: 'system:role:remove',
    QUERY: 'system:role:query',
    EXPORT: 'system:role:export',
  },
  MENU: {
    LIST: 'system:menu:list',
    ADD: 'system:menu:add',
    EDIT: 'system:menu:edit',
    REMOVE: 'system:menu:remove',
    QUERY: 'system:menu:query',
  },
  DEPT: {
    LIST: 'system:dept:list',
    ADD: 'system:dept:add',
    EDIT: 'system:dept:edit',
    REMOVE: 'system:dept:remove',
    QUERY: 'system:dept:query',
    EXPORT: 'system:dept:export',
  },
  DICT: {
    LIST: 'system:dict:list',
    ADD: 'system:dict:add',
    EDIT: 'system:dict:edit',
    REMOVE: 'system:dict:remove',
    QUERY: 'system:dict:query',
  },
  POST: {
    LIST: 'system:post:list',
    ADD: 'system:post:add',
    EDIT: 'system:post:edit',
    REMOVE: 'system:post:remove',
    QUERY: 'system:post:query',
  },
  CONFIG: {
    LIST: 'system:config:list',
    ADD: 'system:config:add',
    EDIT: 'system:config:edit',
    REMOVE: 'system:config:remove',
    QUERY: 'system:config:query',
    EXPORT: 'system:config:export',
  },
  NOTICE: {
    LIST: 'system:notice:list',
    ADD: 'system:notice:add',
    EDIT: 'system:notice:edit',
    REMOVE: 'system:notice:remove',
    QUERY: 'system:notice:query',
  },
  CODEGEN: {
    LIST: 'system:codegen:list',
    GENERATE: 'system:codegen:generate',
  },
  JOB: {
    LIST: 'system:job:list',
    ADD: 'system:job:add',
    EDIT: 'system:job:edit',
    REMOVE: 'system:job:remove',
    QUERY: 'system:job:query',
    RUN: 'system:job:run',
    LOG: 'system:job:log',
    MONITOR: 'system:job:monitor',
  },
  LOG: {
    LIST: 'system:log:list',
    OPERLOG: {
      LIST: 'system:operlog:list',
      QUERY: 'system:operlog:query',
      REMOVE: 'system:operlog:remove',
      EXPORT: 'system:operlog:export',
    },
    LOGINLOG: {
      LIST: 'system:loginlog:list',
      QUERY: 'system:loginlog:query',
      REMOVE: 'system:loginlog:remove',
      EXPORT: 'system:loginlog:export',
    },
  },
  CACHE: {
    LIST: 'system:cache:list',
    QUERY: 'system:cache:query',
    EDIT: 'system:cache:edit',
    REMOVE: 'system:cache:remove',
  },
  SESSION: {
    LIST: 'system:session:list',
    QUERY: 'system:session:query',
    KICK: 'system:session:kick',
  },
  FILE: {
    LIST: 'system:file:list',
    QUERY: 'system:file:query',
    REMOVE: 'system:file:remove',
  },
} as const;

// 商城管理权限
export const MALL = {
  MANAGE: 'mall:manage',
  PRODUCT: {
    LIST: 'product:list',
    ADD: 'product:add',
    EDIT: 'product:edit',
    REMOVE: 'product:remove',
    QUERY: 'product:query',
    EXPORT: 'product:export',
  },
  PRODUCT_SPEC_GROUP: {
    LIST: 'mall:product-spec-group:list',
    ADD: 'mall:product-spec-group:add',
    EDIT: 'mall:product-spec-group:edit',
    REMOVE: 'mall:product-spec-group:remove',
    QUERY: 'mall:product-spec-group:query',
  },
  PRODUCT_SPEC_VALUE: {
    LIST: 'mall:product-spec-value:list',
    ADD: 'mall:product-spec-value:add',
    EDIT: 'mall:product-spec-value:edit',
    REMOVE: 'mall:product-spec-value:remove',
    QUERY: 'mall:product-spec-value:query',
  },
  PRODUCT_SKU: {
    LIST: 'mall:product-sku:list',
    ADD: 'mall:product-sku:add',
    EDIT: 'mall:product-sku:edit',
    REMOVE: 'mall:product-sku:remove',
    QUERY: 'mall:product-sku:query',
  },
  CATEGORY: {
    LIST: 'mall:category:list',
    ADD: 'mall:category:add',
    EDIT: 'mall:category:edit',
    REMOVE: 'mall:category:remove',
    QUERY: 'mall:category:query',
    EXPORT: 'mall:category:export',
  },
  ORDER: {
    LIST: 'mall:order:list',
    ADD: 'mall:order:add',
    EDIT: 'mall:order:edit',
    REMOVE: 'mall:order:remove',
    QUERY: 'mall:order:query',
    EXPORT: 'mall:order:export',
  },
  BANNER: {
    LIST: 'mall:banner:list',
    ADD: 'mall:banner:add',
    EDIT: 'mall:banner:edit',
    REMOVE: 'mall:banner:remove',
    QUERY: 'mall:banner:query',
    EXPORT: 'mall:banner:export',
  },
} as const;

// 会员管理权限
export const MEMBER = {
  MANAGE: 'member:manage',
  MEMBER: {
    LIST: 'member:member:list',
    ADD: 'member:member:add',
    EDIT: 'member:member:edit',
    REMOVE: 'member:member:remove',
    QUERY: 'member:member:query',
    EXPORT: 'member:member:export',
  },
  LEVEL: {
    LIST: 'member:level:list',
    ADD: 'member:level:add',
    EDIT: 'member:level:edit',
    REMOVE: 'member:level:remove',
    QUERY: 'member:level:query',
  },
  ADDRESS: {
    LIST: 'member:address:list',
    ADD: 'member:address:add',
    EDIT: 'member:address:edit',
    REMOVE: 'member:address:remove',
    QUERY: 'member:address:query',
  },
  INVOICE: {
    LIST: 'member:invoice:list',
    ADD: 'member:invoice:add',
    EDIT: 'member:invoice:edit',
    REMOVE: 'member:invoice:remove',
    QUERY: 'member:invoice:query',
  },
  LOGIN_LOG: {
    LIST: 'member:login-log:list',
    REMOVE: 'member:login-log:remove',
  },
  BALANCE_LOG: {
    LIST: 'member:balance-log:list',
    ADJUST: 'member:balance-log:adjust',
  },
  POINT_LOG: {
    LIST: 'member:point-log:list',
    ADJUST: 'member:point-log:adjust',
  },
} as const;

// article管理权限
export const ARTICLE = {
  LIST: 'article:list',
  ADD: 'article:add',
  EDIT: 'article:edit',
  REMOVE: 'article:remove',
  QUERY: 'article:query',
  EXPORT: 'article:export',
} as const;

// 数据权限
export const DATA = {
  MANAGE: 'data:manage',
  SENSITIVE: {
    MANAGE: 'data:sensitive:manage',
    ALL: 'data:sensitive:all',
    PHONE: 'data:sensitive:phone',
    EMAIL: 'data:sensitive:email',
    IDCARD: 'data:sensitive:idcard',
    BANKCARD: 'data:sensitive:bankcard',
    NAME: 'data:sensitive:name',
    ADDRESS: 'data:sensitive:address',
  },
} as const;

// 工作流权限
export const WORKFLOW = {
  MANAGE: 'workflow:manage',
  // 流程分类
  CATEGORY: {
    LIST: 'workflow:category:list',
    ADD: 'workflow:category:add',
    EDIT: 'workflow:category:edit',
    REMOVE: 'workflow:category:remove',
    QUERY: 'workflow:category:query',
  },
  // 流程定义
  DEFINITION: {
    LIST: 'workflow:definition:list',
    ADD: 'workflow:definition:add',
    EDIT: 'workflow:definition:edit',
    REMOVE: 'workflow:definition:remove',
    QUERY: 'workflow:definition:query',
    PUBLISH: 'workflow:definition:publish',
    DESIGN: 'workflow:definition:design',
  },
  // 流程实例
  INSTANCE: {
    LIST: 'workflow:instance:list',
    QUERY: 'workflow:instance:query',
    START: 'workflow:instance:start',
    TERMINATE: 'workflow:instance:terminate',
  },
  // 审批任务
  TASK: {
    LIST: 'workflow:task:list',
    QUERY: 'workflow:task:query',
    APPROVE: 'workflow:task:approve',
    REJECT: 'workflow:task:reject',
    TRANSFER: 'workflow:task:transfer',
    COUNTERSIGN: 'workflow:task:countersign',
  },
  // 抄送记录
  COPY: {
    LIST: 'workflow:copy:list',
    QUERY: 'workflow:copy:query',
  },
} as const;

// 营销管理权限
export const MARKETING = {
  MANAGE: 'marketing:manage',
  // 优惠券模板
  COUPON_TEMPLATE: {
    LIST: 'marketing:coupon-template:list',
    ADD: 'marketing:coupon-template:add',
    EDIT: 'marketing:coupon-template:edit',
    REMOVE: 'marketing:coupon-template:remove',
    QUERY: 'marketing:coupon-template:query',
    DISABLE: 'marketing:coupon-template:disable',
    GRANT: 'marketing:coupon-template:grant',
  },
  // 用户优惠券
  MEMBER_COUPON: {
    LIST: 'marketing:member-coupon:list',
    QUERY: 'marketing:member-coupon:query',
    DISABLE: 'marketing:member-coupon:disable',
    USE: 'marketing:member-coupon:use',
  },
  // 满减活动
  FULL_REDUCTION: {
    LIST: 'marketing:full-reduction:list',
    ADD: 'marketing:full-reduction:add',
    EDIT: 'marketing:full-reduction:edit',
    REMOVE: 'marketing:full-reduction:remove',
    QUERY: 'marketing:full-reduction:query',
    DISABLE: 'marketing:full-reduction:disable',
  },
  // 促销活动
  PROMOTION: {
    LIST: 'marketing:promotion:list',
    ADD: 'marketing:promotion:add',
    EDIT: 'marketing:promotion:edit',
    REMOVE: 'marketing:promotion:remove',
    QUERY: 'marketing:promotion:query',
    DISABLE: 'marketing:promotion:disable',
  },
  // 促销商品
  PROMOTION_PRODUCT: {
    LIST: 'marketing:promotion-product:list',
    ADD: 'marketing:promotion-product:add',
    EDIT: 'marketing:promotion-product:edit',
    REMOVE: 'marketing:promotion-product:remove',
    QUERY: 'marketing:promotion-product:query',
  },
  // 拼团订单
  GROUP_BUY_ORDER: {
    LIST: 'marketing:group-buy-order:list',
    QUERY: 'marketing:group-buy-order:query',
    CANCEL: 'marketing:group-buy-order:cancel',
    MANUAL_FINISH: 'marketing:group-buy-order:manual-finish',
  },
  // 拼团成员
  GROUP_BUY_MEMBER: {
    LIST: 'marketing:group-buy-member:list',
    QUERY: 'marketing:group-buy-member:query',
  },
  // 积分规则
  POINT_RULE: {
    LIST: 'marketing:point-rule:list',
    ADD: 'marketing:point-rule:add',
    EDIT: 'marketing:point-rule:edit',
    REMOVE: 'marketing:point-rule:remove',
    QUERY: 'marketing:point-rule:query',
    DISABLE: 'marketing:point-rule:disable',
  },
  // 积分商品
  POINT_PRODUCT: {
    LIST: 'marketing:point-product:list',
    ADD: 'marketing:point-product:add',
    EDIT: 'marketing:point-product:edit',
    REMOVE: 'marketing:point-product:remove',
    QUERY: 'marketing:point-product:query',
    DISABLE: 'marketing:point-product:disable',
    OFFLINE: 'marketing:point-product:offline',
  },
  // 积分兑换记录
  POINT_EXCHANGE: {
    LIST: 'marketing:point-exchange:list',
    QUERY: 'marketing:point-exchange:query',
    SHIP: 'marketing:point-exchange:ship',
    CANCEL: 'marketing:point-exchange:cancel',
    COMPLETE: 'marketing:point-exchange:complete',
  },
  // 签到记录
  SIGN_IN: {
    LIST: 'marketing:sign-in:list',
    QUERY: 'marketing:sign-in:query',
  },
} as const;

// 所有权限
export const ALL_PERMISSIONS = {
  ...DASHBOARD,
  ...SYSTEM,
  ...MALL,
  ...MEMBER,
  ...ARTICLE,
  ...DATA,
  ...WORKFLOW,
  ...MARKETING,
} as const;

// 菜单权限映射
export const MENU_PERMISSIONS = {
  '/dashboard': DASHBOARD.LIST,
  '/system': SYSTEM.MENU.LIST,
  '/system/user': SYSTEM.USER.LIST,
  '/system/role': SYSTEM.ROLE.LIST,
  '/system/menu': SYSTEM.MENU.LIST,
  '/system/dept': SYSTEM.DEPT.LIST,
  '/system/dict': SYSTEM.DICT.LIST,
  '/system/codegen': SYSTEM.CODEGEN.LIST,
  '/log': SYSTEM.LOG.LIST,
  '/log/operlog': SYSTEM.LOG.OPERLOG.LIST,
  '/log/loginlog': SYSTEM.LOG.LOGINLOG.LIST,
  '/monitor': 'system:monitor:manage',
  '/monitor/database': 'system:database-monitor:query',
  '/monitor/api': 'system:api-monitor:query',
  '/monitor/log': 'system:log-monitor:query',
  '/monitor/alert': 'system:alert:manage',
  '/mall': MALL.MANAGE,
  '/mall/product': MALL.PRODUCT.LIST,
  '/mall/spec': MALL.PRODUCT_SPEC_GROUP.LIST,
  '/mall/sku': MALL.PRODUCT_SKU.LIST,
  '/mall/category': MALL.CATEGORY.LIST,
  '/mall/order': MALL.ORDER.LIST,
  '/mall/banner': MALL.BANNER.LIST,

  '/member': MEMBER.MANAGE,
  '/member/list': MEMBER.MEMBER.LIST,
  '/member/level': MEMBER.LEVEL.LIST,
  '/member/address': MEMBER.ADDRESS.LIST,
  '/member/invoice': MEMBER.INVOICE.LIST,
  '/member/login-log': MEMBER.LOGIN_LOG.LIST,
  '/member/balance-log': MEMBER.BALANCE_LOG.LIST,
  '/member/point-log': MEMBER.POINT_LOG.LIST,

  '/article': ARTICLE.LIST,

  // 工作流
  '/workflow': WORKFLOW.MANAGE,
  '/workflow/category': WORKFLOW.CATEGORY.LIST,
  '/workflow/definition': WORKFLOW.DEFINITION.LIST,
  '/workflow/definition/design': WORKFLOW.DEFINITION.DESIGN,
  '/workflow/instance': WORKFLOW.INSTANCE.LIST,
  '/workflow/task': WORKFLOW.TASK.LIST,
  '/workflow/task/pending': WORKFLOW.TASK.LIST,
  '/workflow/task/completed': WORKFLOW.TASK.LIST,
  '/workflow/copy': WORKFLOW.COPY.LIST,

  // 营销管理
  '/marketing': MARKETING.MANAGE,
  '/marketing/coupon-template': MARKETING.COUPON_TEMPLATE.LIST,
  '/marketing/member-coupon': MARKETING.MEMBER_COUPON.LIST,
  '/marketing/full-reduction': MARKETING.FULL_REDUCTION.LIST,
  '/marketing/promotion': MARKETING.PROMOTION.LIST,
  '/marketing/promotion-product': MARKETING.PROMOTION_PRODUCT.LIST,
  '/marketing/group-buy-order': MARKETING.GROUP_BUY_ORDER.LIST,
  '/marketing/group-buy-member': MARKETING.GROUP_BUY_MEMBER.LIST,
  '/marketing/point-rule': MARKETING.POINT_RULE.LIST,
  '/marketing/point-product': MARKETING.POINT_PRODUCT.LIST,
  '/marketing/point-exchange': MARKETING.POINT_EXCHANGE.LIST,
  '/marketing/sign-in': MARKETING.SIGN_IN.LIST,
} as const;

// 路由权限要求
export const ROUTE_PERMISSIONS = {
  '/dashboard': DASHBOARD.LIST,
  '/system/user': SYSTEM.USER.LIST,
  '/system/role': SYSTEM.ROLE.LIST,
  '/system/menu': SYSTEM.MENU.LIST,
  '/system/dept': SYSTEM.DEPT.LIST,
  '/system/dict': SYSTEM.DICT.LIST,
  '/system/codegen': SYSTEM.CODEGEN.LIST,
  '/log/operlog': SYSTEM.LOG.OPERLOG.LIST,
  '/log/loginlog': SYSTEM.LOG.LOGINLOG.LIST,
  '/monitor/database': 'system:database-monitor:query',
  '/monitor/api': 'system:api-monitor:query',
  '/monitor/log': 'system:log-monitor:query',
  '/monitor/alert': 'system:alert:manage',
  '/mall/product': MALL.PRODUCT.LIST,
  '/mall/spec': MALL.PRODUCT_SPEC_GROUP.LIST,
  '/mall/sku': MALL.PRODUCT_SKU.LIST,
  '/mall/category': MALL.CATEGORY.LIST,
  '/mall/order': MALL.ORDER.LIST,
  '/mall/banner': MALL.BANNER.LIST,

  '/member/list': MEMBER.MEMBER.LIST,
  '/member/level': MEMBER.LEVEL.LIST,
  '/member/address': MEMBER.ADDRESS.LIST,
  '/member/invoice': MEMBER.INVOICE.LIST,
  '/member/login-log': MEMBER.LOGIN_LOG.LIST,
  '/member/balance-log': MEMBER.BALANCE_LOG.LIST,
  '/member/point-log': MEMBER.POINT_LOG.LIST,

  '/article': ARTICLE.LIST,

  // 工作流
  '/workflow/category': WORKFLOW.CATEGORY.LIST,
  '/workflow/definition': WORKFLOW.DEFINITION.LIST,
  '/workflow/definition/design': WORKFLOW.DEFINITION.DESIGN,
  '/workflow/instance': WORKFLOW.INSTANCE.LIST,
  '/workflow/task/pending': WORKFLOW.TASK.LIST,
  '/workflow/task/completed': WORKFLOW.TASK.LIST,
  '/workflow/copy': WORKFLOW.COPY.LIST,

  // 营销管理
  '/marketing/coupon-template': MARKETING.COUPON_TEMPLATE.LIST,
  '/marketing/member-coupon': MARKETING.MEMBER_COUPON.LIST,
  '/marketing/full-reduction': MARKETING.FULL_REDUCTION.LIST,
  '/marketing/promotion': MARKETING.PROMOTION.LIST,
  '/marketing/promotion-product': MARKETING.PROMOTION_PRODUCT.LIST,
  '/marketing/group-buy-order': MARKETING.GROUP_BUY_ORDER.LIST,
  '/marketing/group-buy-member': MARKETING.GROUP_BUY_MEMBER.LIST,
  '/marketing/point-rule': MARKETING.POINT_RULE.LIST,
  '/marketing/point-product': MARKETING.POINT_PRODUCT.LIST,
  '/marketing/point-exchange': MARKETING.POINT_EXCHANGE.LIST,
  '/marketing/sign-in': MARKETING.SIGN_IN.LIST,
} as const;

export type Permission = (typeof ALL_PERMISSIONS)[keyof typeof ALL_PERMISSIONS];
