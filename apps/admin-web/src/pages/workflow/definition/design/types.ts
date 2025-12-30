// 节点类型
export type NodeType = 'START' | 'END' | 'APPROVAL' | 'CONDITION' | 'PARALLEL' | 'JOIN';

// 审批方式
export type ApprovalType = 'OR_SIGN' | 'AND_SIGN';

// 审批人选择方式
export type AssigneeType = 'ROLE' | 'DEPT_LEADER' | 'SPECIFIC_USER' | 'INITIATOR_LEADER' | 'FORM_FIELD';

// 审批人为空处理策略
export type EmptyAssigneeAction = 'SKIP' | 'TO_ADMIN' | 'ERROR';

// 流程数据（对应 X6 graph.toJSON()）
export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  data?: NodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  data?: EdgeData;
}

// 节点数据
export interface NodeData {
  label: string;
  nodeType: NodeType;
  // 审批节点配置
  approvalType?: ApprovalType;
  assigneeType?: AssigneeType;
  assigneeConfig?: AssigneeConfig;
  emptyAssigneeAction?: EmptyAssigneeAction;
  conditionExpr?: ConditionExpression;
  formPerms?: Record<string, FormPerm>;
  timeLimit?: number;
  timeoutAction?: 'AUTO_PASS' | 'AUTO_REJECT' | 'REMIND';
  ccConfig?: CcConfig;
}

// 边数据
export interface EdgeData {
  label?: string;
  condition?: ConditionExpression;
}

// 审批人配置
export interface AssigneeConfig {
  roleIds?: number[];
  userIds?: number[];
  deptLevel?: number;
  fieldName?: string;
}

// 表单字段权限
export interface FormPerm {
  visible: boolean;
  editable: boolean;
}

// 条件表达式
export interface ConditionExpression {
  type: 'single' | 'group';
  // 单条件
  field?: string;
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value?: unknown;
  // 组合条件
  logic?: 'and' | 'or';
  conditions?: ConditionExpression[];
}

// 抄送配置
export interface CcConfig {
  enable: boolean;
  type: 'SPECIFIC_USER' | 'ROLE';
  userIds?: number[];
  roleIds?: number[];
}

// 节点模板（用于左侧面板拖拽）
export interface NodeTemplate {
  type: NodeType;
  label: string;
  icon: string;
  color: string;
  description: string;
}

// 节点配置 DTO（用于保存到后端）
export interface NodeConfigDto {
  nodeId: string;
  nodeType: NodeType;
  nodeName: string;
  approvalType?: ApprovalType;
  assigneeType?: AssigneeType;
  assigneeConfig?: AssigneeConfig;
  emptyAssigneeAction?: EmptyAssigneeAction;
  conditionExpr?: ConditionExpression;
  formPerms?: Record<string, FormPerm>;
  timeLimit?: number;
  timeoutAction?: 'AUTO_PASS' | 'AUTO_REJECT' | 'REMIND';
  ccConfig?: CcConfig;
}

// 流程定义详情（从后端获取）
export interface FlowDefinitionDetail {
  id: number;
  code: string;
  name: string;
  categoryId?: number;
  category?: {
    id: number;
    code: string;
    name: string;
    color?: string;
  };
  flowData?: FlowData;
  formData?: FormField[];
  businessTable?: string;
  description?: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'DISABLED';
  nodeConfigs?: NodeConfigFromDb[];
  createdAt: string;
  updatedAt: string;
}

// 表单字段定义
export interface FormField {
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'time' | 'select' | 'user' | 'dept';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];  // 用于 select 类型（手动配置）
  optionsSource?: 'manual' | 'dict';  // 选项来源：手动配置 或 字典
  dictType?: string;  // 字典类型编码（当 optionsSource 为 dict 时使用）
  multiple?: boolean;  // 用于 user/dept/select 是否多选
}

// 数据库中的节点配置
export interface NodeConfigFromDb {
  id: number;
  nodeId: string;
  nodeType: string;
  nodeName: string;
  approvalType?: string;
  assigneeType?: string;
  assigneeConfig?: AssigneeConfig;
  emptyAssigneeAction?: string;
  conditionExpr?: ConditionExpression;
  formPerms?: Record<string, FormPerm>;
  timeLimit?: number;
  timeoutAction?: string;
  ccConfig?: CcConfig;
}
