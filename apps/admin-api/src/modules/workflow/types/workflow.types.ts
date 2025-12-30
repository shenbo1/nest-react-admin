/**
 * 工作流核心类型定义
 */
import {
  WfCategoryStatus,
  WfNodeType,
  WfApprovalType,
  WfAssigneeType,
  WfEmptyAssigneeAction,
  WfTimeoutAction,
  WfInstanceStatus,
  WfTaskStatus,
  WfTaskResult,
  WfLogAction,
  WfFlowStatus,
} from '@prisma/client';

// 重新导出 Prisma 枚举，方便其他模块使用
export {
  WfCategoryStatus,
  WfNodeType,
  WfApprovalType,
  WfAssigneeType,
  WfEmptyAssigneeAction,
  WfTimeoutAction,
  WfInstanceStatus,
  WfTaskStatus,
  WfTaskResult,
  WfLogAction,
  WfFlowStatus,
};

// 条件操作符
export type ConditionOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'contains';

// 条件逻辑
export type ConditionLogic = 'and' | 'or';

// 条件类型
export type ConditionType = 'single' | 'group';

// 表单字段类型
export type FormFieldType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'dateRange'
  | 'file';

// 流程图节点
export interface FlowNode {
  id: string;
  type: WfNodeType;
  position: { x: number; y: number };
  data: { label: string };
}

// 流程图边
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  data?: { condition?: ConditionExpression };
}

// 流程图数据
export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

// 条件表达式
export interface ConditionExpression {
  type: ConditionType;
  // 单条件
  field?: string;
  operator?: ConditionOperator;
  value?: unknown;
  // 组合条件
  logic?: ConditionLogic;
  conditions?: ConditionExpression[];
}

// 审批人配置
export interface AssigneeConfig {
  roleIds?: number[];
  userIds?: number[];
  deptLevel?: number;
  fieldName?: string;
}

// 表单字段权限
export interface FormFieldPermission {
  visible: boolean;
  editable: boolean;
}

// 表单权限配置
export interface FormPermissions {
  [fieldName: string]: FormFieldPermission;
}

// 抄送配置
export interface CcConfig {
  roleIds?: number[];
  userIds?: number[];
}

// 表单字段定义
export interface FormFieldDefinition {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  defaultValue?: unknown;
  placeholder?: string;
  rules?: unknown[];
}

// 表单配置
export interface FormData {
  fields: FormFieldDefinition[];
}

// 流程变量
export interface FlowVariables {
  [key: string]: unknown;
}

// 审批人信息
export interface AssigneeInfo {
  id: number;
  name: string;
  deptId?: number;
  deptName?: string;
}

// 节点配置（用于类型安全的节点配置）
export interface NodeConfig {
  nodeId: string;
  nodeType: WfNodeType;
  nodeName: string;

  // 审批节点配置
  approvalType?: WfApprovalType;
  assigneeType?: WfAssigneeType;
  assigneeConfig?: AssigneeConfig;
  emptyAssigneeAction?: WfEmptyAssigneeAction;

  // 表单权限
  formPerms?: FormPermissions;

  // 抄送配置
  ccConfig?: CcConfig;

  // 超时配置
  timeLimit?: number;
  timeoutAction?: WfTimeoutAction;

  // 条件配置
  conditionExpr?: ConditionExpression;
}
