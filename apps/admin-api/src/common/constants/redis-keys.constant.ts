/**
 * Redis 缓存键常量定义
 * 所有缓存键前缀都应该在这里定义，统一管理
 */

// 系统相关
export const REDIS_KEY_PREFIX = {
  // 系统缓存
  SYSTEM: 'system:',

  // 认证相关
  AUTH: 'auth:',
  USER_TOKEN: 'user:token:',
  TOKEN_BLACKLIST: 'token:blacklist:',

  // 权限相关
  PERMISSION: 'permission:',
  ROLE: 'role:',
  MENU: 'menu:',

  // 配置相关
  CONFIG: 'config:',

  // 任务队列（Bull）
  BULL: 'bull:',

  // 用户相关
  USER: 'user:',
  USER_SESSION: 'user:session:',

  // 部门相关
  DEPT: 'dept:',

  // 岗位相关
  POST: 'post:',

  // 字典相关
  DICT: 'dict:',
  DICT_DATA: 'dict:data:',

  // 文件相关
  FILE: 'file:',
  UPLOAD: 'upload:',

  // 操作日志
  OPERLOG: 'operlog:',

  // 登录日志
  LOGININFOR: 'logininfor:',

  // 在线用户
  ONLINE_USER: 'online:user:',

  // 系统监控
  MONITOR: 'monitor:',
  SERVER_INFO: 'server:info:',
  CACHE_INFO: 'cache:info:',
} as const;

// 受保护的键前缀（不能删除的）
export const PROTECTED_KEY_PREFIXES = [
  REDIS_KEY_PREFIX.SYSTEM,
  REDIS_KEY_PREFIX.AUTH,
  REDIS_KEY_PREFIX.USER_TOKEN,
  REDIS_KEY_PREFIX.TOKEN_BLACKLIST,
  REDIS_KEY_PREFIX.PERMISSION,
  REDIS_KEY_PREFIX.ROLE,
  REDIS_KEY_PREFIX.MENU,
  REDIS_KEY_PREFIX.CONFIG,
  REDIS_KEY_PREFIX.BULL,
] as const;

// 生成完整的缓存键
export const generateRedisKey = (prefix: string, ...parts: (string | number)[]): string => {
  return prefix + parts.join(':');
};

// 用户相关的缓存键生成器
export const getUserRedisKeys = (userId: number | string) => {
  return {
    userInfo: generateRedisKey(REDIS_KEY_PREFIX.USER, 'info', userId),
    userPermissions: generateRedisKey(REDIS_KEY_PREFIX.USER, 'permissions', userId),
    userRoles: generateRedisKey(REDIS_KEY_PREFIX.USER, 'roles', userId),
    userMenus: generateRedisKey(REDIS_KEY_PREFIX.USER, 'menus', userId),
    userDept: generateRedisKey(REDIS_KEY_PREFIX.USER, 'dept', userId),
    userPosts: generateRedisKey(REDIS_KEY_PREFIX.USER, 'posts', userId),
  };
};

// 认证相关的缓存键生成器
export const getAuthRedisKeys = (token: string) => {
  return {
    tokenInfo: generateRedisKey(REDIS_KEY_PREFIX.AUTH, 'token', token),
    tokenExpire: generateRedisKey(REDIS_KEY_PREFIX.AUTH, 'expire', token),
  };
};

// 黑名单相关的缓存键
export const getBlacklistRedisKeys = () => {
  return {
    // 黑名单token集合（用于统计）
    blacklistTokens: generateRedisKey(REDIS_KEY_PREFIX.TOKEN_BLACKLIST, 'tokens'),
    // 黑名单token详情前缀
    blacklistTokenPrefix: REDIS_KEY_PREFIX.TOKEN_BLACKLIST,
  };
};

// 系统配置相关的缓存键
export const getConfigRedisKeys = () => {
  return {
    systemConfig: generateRedisKey(REDIS_KEY_PREFIX.CONFIG, 'system'),
    uploadConfig: generateRedisKey(REDIS_KEY_PREFIX.CONFIG, 'upload'),
    emailConfig: generateRedisKey(REDIS_KEY_PREFIX.CONFIG, 'email'),
    smsConfig: generateRedisKey(REDIS_KEY_PREFIX.CONFIG, 'sms'),
  };
};

// 字典相关的缓存键生成器
export const getDictRedisKeys = (dictType?: string) => {
  const keys = {
    allDictTypes: generateRedisKey(REDIS_KEY_PREFIX.DICT, 'types'),
    dictData: (type: string) => generateRedisKey(REDIS_KEY_PREFIX.DICT_DATA, type),
  };

  if (dictType) {
    return {
      ...keys,
      currentDictData: keys.dictData(dictType),
    };
  }

  return keys;
};

// 部门相关的缓存键
export const getDeptRedisKeys = () => {
  return {
    deptTree: generateRedisKey(REDIS_KEY_PREFIX.DEPT, 'tree'),
    deptList: generateRedisKey(REDIS_KEY_PREFIX.DEPT, 'list'),
    deptTreeSelect: generateRedisKey(REDIS_KEY_PREFIX.DEPT, 'tree', 'select'),
  };
};

// 菜单相关的缓存键
export const getMenuRedisKeys = () => {
  return {
    menuTree: generateRedisKey(REDIS_KEY_PREFIX.MENU, 'tree'),
    menuList: generateRedisKey(REDIS_KEY_PREFIX.MENU, 'list'),
    menuTreeSelect: generateRedisKey(REDIS_KEY_PREFIX.MENU, 'tree', 'select'),
    menuRoutes: generateRedisKey(REDIS_KEY_PREFIX.MENU, 'routes'),
  };
};

// 角色相关的缓存键
export const getRoleRedisKeys = () => {
  return {
    roleList: generateRedisKey(REDIS_KEY_PREFIX.ROLE, 'list'),
    roleSelect: generateRedisKey(REDIS_KEY_PREFIX.ROLE, 'select'),
    roleMenuIds: (roleId: number) => generateRedisKey(REDIS_KEY_PREFIX.ROLE, 'menus', roleId),
    roleDeptIds: (roleId: number) => generateRedisKey(REDIS_KEY_PREFIX.ROLE, 'depts', roleId),
  };
};

// 监控相关的缓存键
export const getMonitorRedisKeys = () => {
  return {
    serverInfo: generateRedisKey(REDIS_KEY_PREFIX.SERVER_INFO),
    cacheInfo: generateRedisKey(REDIS_KEY_PREFIX.CACHE_INFO),
    onlineUsers: generateRedisKey(REDIS_KEY_PREFIX.ONLINE_USER, 'list'),
    systemInfo: generateRedisKey(REDIS_KEY_PREFIX.MONITOR, 'system'),
  };
};

// 文件上传相关的缓存键
export const getUploadRedisKeys = () => {
  return {
    uploadConfig: generateRedisKey(REDIS_KEY_PREFIX.CONFIG, 'upload'),
    uploadLimit: generateRedisKey(REDIS_KEY_PREFIX.UPLOAD, 'limit'),
  };
};

// 通用的缓存过期时间（秒）
export const CACHE_TTL = {
  // 短期缓存（5分钟）
  SHORT: 300,
  // 中期缓存（30分钟）
  MEDIUM: 1800,
  // 长期缓存（2小时）
  LONG: 7200,
  // 超长期缓存（24小时）
  VERY_LONG: 86400,
  // 永久缓存（不设置过期时间）
  FOREVER: null,
} as const;

// 检查键是否受保护
export const isProtectedKey = (key: string): boolean => {
  return PROTECTED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
};