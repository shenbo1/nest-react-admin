import 'reflect-metadata';
import {
  SensitiveType,
  SENSITIVE_METADATA_KEY,
} from '../constants/sensitive.constant';

/**
 * 敏感字段元数据信息
 */
export interface SensitiveFieldMeta {
  propertyKey: string;
  type: SensitiveType;
}

/**
 * 敏感数据装饰器
 * 用于标记需要脱敏的字段
 *
 * @param type 脱敏类型
 *
 * @example
 * class MemberVo {
 *   @Sensitive(SensitiveType.PHONE)
 *   phone: string;
 *
 *   @Sensitive(SensitiveType.EMAIL)
 *   email: string;
 * }
 */
export function Sensitive(type: SensitiveType): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existingFields: SensitiveFieldMeta[] =
      Reflect.getMetadata(SENSITIVE_METADATA_KEY, target.constructor) || [];

    existingFields.push({
      propertyKey: propertyKey as string,
      type,
    });

    Reflect.defineMetadata(
      SENSITIVE_METADATA_KEY,
      existingFields,
      target.constructor,
    );
  };
}

/**
 * 获取类上所有敏感字段的元数据
 */
export function getSensitiveFields(target: any): SensitiveFieldMeta[] {
  if (!target) return [];

  const constructor = target.constructor || target;

  return Reflect.getMetadata(SENSITIVE_METADATA_KEY, constructor) || [];
}
