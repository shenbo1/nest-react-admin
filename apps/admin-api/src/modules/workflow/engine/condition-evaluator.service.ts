import { Injectable, Logger } from '@nestjs/common';
import { ConditionExpression } from '../types';

@Injectable()
export class ConditionEvaluatorService {
  private readonly logger = new Logger(ConditionEvaluatorService.name);

  /**
   * 评估条件表达式
   */
  evaluate(
    condition: ConditionExpression,
    formData: Record<string, unknown>,
  ): boolean {
    if (condition.type === 'group') {
      return this.evaluateGroup(condition, formData);
    }

    return this.evaluateSingle(condition, formData);
  }

  /**
   * 评估单个条件
   */
  private evaluateSingle(
    condition: ConditionExpression,
    formData: Record<string, unknown>,
  ): boolean {
    if (!condition.field || !condition.operator) {
      return true;
    }

    const fieldValue = this.getFieldValue(formData, condition.field);
    const compareValue = condition.value;

    this.logger.debug(
      `评估条件: ${condition.field} ${condition.operator} ${compareValue}, 实际值: ${fieldValue}`,
    );

    switch (condition.operator) {
      case 'eq':
        return fieldValue === compareValue;

      case 'ne':
        return fieldValue !== compareValue;

      case 'gt':
        return Number(fieldValue) > Number(compareValue);

      case 'gte':
        return Number(fieldValue) >= Number(compareValue);

      case 'lt':
        return Number(fieldValue) < Number(compareValue);

      case 'lte':
        return Number(fieldValue) <= Number(compareValue);

      case 'in':
        if (Array.isArray(compareValue)) {
          return compareValue.includes(fieldValue);
        }
        return false;

      case 'contains':
        if (typeof fieldValue === 'string' && typeof compareValue === 'string') {
          return fieldValue.includes(compareValue);
        }
        return false;

      default:
        this.logger.warn(`未知操作符: ${condition.operator}`);
        return false;
    }
  }

  /**
   * 评估组合条件
   */
  private evaluateGroup(
    condition: ConditionExpression,
    formData: Record<string, unknown>,
  ): boolean {
    if (!condition.conditions?.length) {
      return true;
    }

    const results = condition.conditions.map((c) =>
      this.evaluate(c, formData),
    );

    if (condition.logic === 'or') {
      return results.some((r) => r);
    }

    // 默认 AND 逻辑
    return results.every((r) => r);
  }

  /**
   * 获取字段值（支持嵌套路径）
   */
  private getFieldValue(
    data: Record<string, unknown>,
    fieldPath: string,
  ): unknown {
    const parts = fieldPath.split('.');
    let value: unknown = data;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = (value as Record<string, unknown>)[part];
    }

    return value;
  }
}
