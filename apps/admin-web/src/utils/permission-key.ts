const ACTION_PATTERNS: Array<[RegExp, string]> = [
  [/reset\s*pwd|重置密码|重置/i, 'resetPwd'],
  [/assign|allocate|授权|分配|配置/i, 'assign'],
  [/enable|启用/i, 'enable'],
  [/disable|停用|禁用/i, 'disable'],
  [/approve|audit|review|审核|审查/i, 'approve'],
  [/reject|驳回|拒绝/i, 'reject'],
  [/submit|提交/i, 'submit'],
  [/publish|release|发布/i, 'publish'],
  [/unpublish|withdraw|撤回|下架/i, 'unpublish'],
  [/sync|同步/i, 'sync'],
  [/import|导入/i, 'import'],
  [/export|导出/i, 'export'],
  [/download|导出文件|下载/i, 'download'],
  [/upload|上传/i, 'upload'],
  [/print|打印/i, 'print'],
  [/add|新增|添加|创建|新建/i, 'add'],
  [/edit|修改|编辑|更新/i, 'edit'],
  [/remove|delete|删除|移除/i, 'remove'],
  [/query|detail|详情|查看|查询/i, 'query'],
  [/list|列表/i, 'list'],
];

const normalizePathToPermPrefix = (path?: string): string => {
  const trimmed = (path || '').trim();
  if (!trimmed) return '';
  const cleaned = trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!cleaned) return '';
  return cleaned.split('/').filter(Boolean).join(':');
};

const stripActionFromPerms = (perms?: string): string => {
  if (!perms) return '';
  const parts = perms.split(':').filter(Boolean);
  if (parts.length <= 1) return '';
  return parts.slice(0, -1).join(':');
};

const inferActionFromName = (name?: string): string => {
  if (!name) return '';
  for (const [pattern, action] of ACTION_PATTERNS) {
    if (pattern.test(name)) return action;
  }
  return '';
};

export type MenuPermInput = {
  type?: string;
  path?: string;
  name?: string;
  parentPath?: string;
  parentPerms?: string;
};

export const generateMenuPermission = ({
  type,
  path,
  name,
  parentPath,
  parentPerms,
}: MenuPermInput): string => {
  const prefixFromPath = normalizePathToPermPrefix(path);
  const parentPrefix =
    normalizePathToPermPrefix(parentPath) || stripActionFromPerms(parentPerms);
  const prefix = prefixFromPath || parentPrefix;

  if (!prefix) return '';

  if (type === 'BUTTON') {
    const action = inferActionFromName(name);
    return `${prefix}:${action || 'execute'}`;
  }

  return `${prefix}:list`;
};
