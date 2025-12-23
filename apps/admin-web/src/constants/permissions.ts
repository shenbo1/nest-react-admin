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
  LOG: {
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
  MEMBER: {
    LIST: 'mall:member:list',
    ADD: 'mall:member:add',
    EDIT: 'mall:member:edit',
    REMOVE: 'mall:member:remove',
    QUERY: 'mall:member:query',
    EXPORT: 'mall:member:export',
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

// article管理权限
export const ARTICLE = {
  LIST: 'article:list',
  ADD: 'article:add',
  EDIT: 'article:edit',
  REMOVE: 'article:remove',
  QUERY: 'article:query',
  EXPORT: 'article:export',
} as const;

// 所有权限
export const ALL_PERMISSIONS = {
  ...DASHBOARD,
  ...SYSTEM,
  ...MALL,
  ...ARTICLE,
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
  '/system/operlog': SYSTEM.LOG.OPERLOG.LIST,
  '/system/loginlog': SYSTEM.LOG.LOGINLOG.LIST,
  '/system/codegen': SYSTEM.CODEGEN.LIST,
  '/mall': MALL.MANAGE,
  '/mall/product': MALL.PRODUCT.LIST,
  '/mall/product-spec-group': MALL.PRODUCT_SPEC_GROUP.LIST,
  '/mall/product-spec-value': MALL.PRODUCT_SPEC_VALUE.LIST,
  '/mall/product-sku': MALL.PRODUCT_SKU.LIST,
  '/mall/category': MALL.CATEGORY.LIST,
  '/mall/order': MALL.ORDER.LIST,
  '/mall/member': MALL.MEMBER.LIST,
  '/mall/banner': MALL.BANNER.LIST,

  '/article/list': ARTICLE.LIST,
} as const;

// 路由权限要求
export const ROUTE_PERMISSIONS = {
  '/dashboard': DASHBOARD.LIST,
  '/system/user': SYSTEM.USER.LIST,
  '/system/role': SYSTEM.ROLE.LIST,
  '/system/menu': SYSTEM.MENU.LIST,
  '/system/dept': SYSTEM.DEPT.LIST,
  '/system/dict': SYSTEM.DICT.LIST,
  '/system/operlog': SYSTEM.LOG.OPERLOG.LIST,
  '/system/loginlog': SYSTEM.LOG.LOGINLOG.LIST,
  '/system/codegen': SYSTEM.CODEGEN.LIST,
  '/mall/product': MALL.PRODUCT.LIST,
  '/mall/product-spec-group': MALL.PRODUCT_SPEC_GROUP.LIST,
  '/mall/product-spec-value': MALL.PRODUCT_SPEC_VALUE.LIST,
  '/mall/product-sku': MALL.PRODUCT_SKU.LIST,
  '/mall/category': MALL.CATEGORY.LIST,
  '/mall/order': MALL.ORDER.LIST,
  '/mall/member': MALL.MEMBER.LIST,
  '/mall/banner': MALL.BANNER.LIST,

  '/article/list': ARTICLE.LIST,
} as const;

export type Permission = (typeof ALL_PERMISSIONS)[keyof typeof ALL_PERMISSIONS];
