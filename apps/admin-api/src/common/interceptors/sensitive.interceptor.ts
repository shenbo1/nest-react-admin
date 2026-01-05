import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClsService } from 'nestjs-cls';
import { MaskUtil } from '../utils/mask.util';
import {
  SensitiveType,
  SENSITIVE_PERMISSION_MAP,
  SENSITIVE_VIEW_ALL,
  SENSITIVE_METADATA_KEY,
} from '../constants/sensitive.constant';
import { SensitiveFieldMeta } from '../decorators/sensitive.decorator';

/**
 * 字段脱敏配置
 */
interface FieldMaskConfig {
  field: string;
  type: SensitiveType;
}

/**
 * 预定义的敏感字段映射表
 * 用于 Prisma 原生对象的自动脱敏
 */
const SENSITIVE_FIELD_CONFIG: Record<string, FieldMaskConfig[]> = {
  // Member 会员表
  member: [
    { field: 'phone', type: SensitiveType.PHONE },
    { field: 'email', type: SensitiveType.EMAIL },
  ],
  // MemberAddress 会员地址表
  memberAddress: [
    { field: 'phone', type: SensitiveType.PHONE },
    { field: 'receiver', type: SensitiveType.NAME },
  ],
  // MemberInvoiceInfo 会员发票表
  memberInvoiceInfo: [
    { field: 'invoiceTaxNo', type: SensitiveType.BANK_CARD },
    { field: 'invoiceEmail', type: SensitiveType.EMAIL },
    { field: 'invoicePhone', type: SensitiveType.PHONE },
    { field: 'bankAccount', type: SensitiveType.BANK_CARD },
  ],
};

@Injectable()
export class SensitiveInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const user = this.cls.get('user');
        const permissions: string[] = user?.permissions || [];

        // 超级管理员或拥有查看所有敏感数据权限，不脱敏
        if (
          user?.roles?.includes('admin') ||
          permissions.includes(SENSITIVE_VIEW_ALL)
        ) {
          return data;
        }

        // 计算需要脱敏的类型
        const typesToMask = this.getTypesToMask(permissions);

        // 如果所有权限都有，不需要脱敏
        if (typesToMask.size === 0) {
          return data;
        }

        // 处理响应数据
        return this.processData(data, typesToMask);
      }),
    );
  }

  /**
   * 获取需要脱敏的类型列表
   */
  private getTypesToMask(permissions: string[]): Set<SensitiveType> {
    const typesToMask = new Set<SensitiveType>();

    for (const type of Object.values(SensitiveType)) {
      const requiredPermission = SENSITIVE_PERMISSION_MAP[type];
      if (!permissions.includes(requiredPermission)) {
        typesToMask.add(type);
      }
    }

    return typesToMask;
  }

  /**
   * 递归处理数据
   */
  private processData(data: any, typesToMask: Set<SensitiveType>): any {
    if (data === null || data === undefined) {
      return data;
    }

    // 处理数组
    if (Array.isArray(data)) {
      return data.map((item) => this.processData(item, typesToMask));
    }

    // 处理对象
    if (typeof data === 'object') {
      return this.processObject(data, typesToMask);
    }

    return data;
  }

  /**
   * 处理单个对象
   */
  private processObject(obj: any, typesToMask: Set<SensitiveType>): any {
    const result = { ...obj };

    // 方式一：通过装饰器元数据获取敏感字段
    const sensitiveFields = this.getSensitiveFieldsFromMetadata(obj);

    // 方式二：通过预定义配置获取敏感字段
    const configFields = this.getSensitiveFieldsFromConfig(obj);

    // 合并两种方式获取的字段
    const allFields = [...sensitiveFields, ...configFields];

    // 执行脱敏
    for (const { propertyKey, type } of allFields) {
      if (
        typesToMask.has(type) &&
        result[propertyKey] !== undefined &&
        result[propertyKey] !== null
      ) {
        result[propertyKey] = MaskUtil.mask(String(result[propertyKey]), type);
      }
    }

    // 递归处理嵌套对象
    for (const key of Object.keys(result)) {
      const value = result[key];
      if (value && typeof value === 'object' && !allFields.some((f) => f.propertyKey === key)) {
        result[key] = this.processData(value, typesToMask);
      }
    }

    return result;
  }

  /**
   * 从装饰器元数据获取敏感字段
   */
  private getSensitiveFieldsFromMetadata(obj: any): SensitiveFieldMeta[] {
    if (!obj || !obj.constructor) return [];
    return Reflect.getMetadata(SENSITIVE_METADATA_KEY, obj.constructor) || [];
  }

  /**
   * 从预定义配置获取敏感字段
   */
  private getSensitiveFieldsFromConfig(obj: any): SensitiveFieldMeta[] {
    const fields: SensitiveFieldMeta[] = [];

    // 检测 MemberInvoiceInfo（有 invoiceTaxNo 字段）
    if ('invoiceTaxNo' in obj || 'invoiceEmail' in obj) {
      const config = SENSITIVE_FIELD_CONFIG.memberInvoiceInfo;
      for (const { field, type } of config) {
        if (field in obj) {
          fields.push({ propertyKey: field, type });
        }
      }
      return fields;
    }

    // 检测 MemberAddress（有 receiver 和 address 字段）
    if ('receiver' in obj && 'address' in obj) {
      const config = SENSITIVE_FIELD_CONFIG.memberAddress;
      for (const { field, type } of config) {
        if (field in obj) {
          fields.push({ propertyKey: field, type });
        }
      }
      return fields;
    }

    // 检测 Member（有 memberLevelId 或 points 字段）
    if ('memberLevelId' in obj || ('points' in obj && 'username' in obj)) {
      const config = SENSITIVE_FIELD_CONFIG.member;
      for (const { field, type } of config) {
        if (field in obj) {
          fields.push({ propertyKey: field, type });
        }
      }
      return fields;
    }

    return fields;
  }
}
