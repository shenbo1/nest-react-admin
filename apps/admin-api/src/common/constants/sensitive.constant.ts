/**
 * 敏感数据类型枚举
 */
export enum SensitiveType {
  /** 手机号 */
  PHONE = 'PHONE',
  /** 邮箱 */
  EMAIL = 'EMAIL',
  /** 身份证号 */
  ID_CARD = 'ID_CARD',
  /** 银行卡号/税号 */
  BANK_CARD = 'BANK_CARD',
  /** 姓名 */
  NAME = 'NAME',
  /** 地址 */
  ADDRESS = 'ADDRESS',
}

/**
 * 敏感数据类型与查看权限的映射
 * 拥有对应权限的用户可以查看完整信息
 */
export const SENSITIVE_PERMISSION_MAP: Record<SensitiveType, string> = {
  [SensitiveType.PHONE]: 'data:sensitive:phone',
  [SensitiveType.EMAIL]: 'data:sensitive:email',
  [SensitiveType.ID_CARD]: 'data:sensitive:idcard',
  [SensitiveType.BANK_CARD]: 'data:sensitive:bankcard',
  [SensitiveType.NAME]: 'data:sensitive:name',
  [SensitiveType.ADDRESS]: 'data:sensitive:address',
};

/**
 * 查看所有敏感数据的超级权限
 */
export const SENSITIVE_VIEW_ALL = 'data:sensitive:all';

/**
 * 敏感数据装饰器的元数据 key
 */
export const SENSITIVE_METADATA_KEY = 'sensitive:fields';
