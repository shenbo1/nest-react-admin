import type { NodeTemplate } from './types';

// 节点模板列表
export const nodeTemplates: NodeTemplate[] = [
  {
    type: 'START',
    label: '开始节点',
    icon: 'PlayCircleOutlined',
    color: '#52c41a',
    description: '流程开始',
  },
  {
    type: 'APPROVAL',
    label: '审批节点',
    icon: 'CheckCircleOutlined',
    color: '#1890ff',
    description: '人工审批节点',
  },
  {
    type: 'CONDITION',
    label: '条件分支',
    icon: 'BranchesOutlined',
    color: '#faad14',
    description: '根据条件分流',
  },
  {
    type: 'PARALLEL',
    label: '并行网关',
    icon: 'FullscreenOutlined',
    color: '#722ed1',
    description: '同时执行多个分支',
  },
  {
    type: 'JOIN',
    label: '汇聚网关',
    icon: 'FullscreenExitOutlined',
    color: '#13c2c2',
    description: '等待所有分支完成',
  },
  {
    type: 'END',
    label: '结束节点',
    icon: 'StopOutlined',
    color: '#ff4d4f',
    description: '流程结束',
  },
];

// 审批方式选项
export const approvalTypeOptions = [
  { label: '或签（任一人通过即可）', value: 'OR_SIGN' },
  { label: '会签（所有人通过才能通过）', value: 'AND_SIGN' },
];

// 审批人选择方式选项
export const assigneeTypeOptions = [
  { label: '按角色', value: 'ROLE' },
  { label: '部门领导', value: 'DEPT_LEADER' },
  { label: '指定人员', value: 'SPECIFIC_USER' },
  { label: '发起人上级', value: 'INITIATOR_LEADER' },
  { label: '表单字段', value: 'FORM_FIELD' },
];

// 审批人为空处理策略选项
export const emptyAssigneeActionOptions = [
  { label: '跳过节点', value: 'SKIP' },
  { label: '转给管理员', value: 'TO_ADMIN' },
  { label: '报错终止', value: 'ERROR' },
];

// 条件运算符选项
export const conditionOperatorOptions = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'ne' },
  { label: '大于', value: 'gt' },
  { label: '大于等于', value: 'gte' },
  { label: '小于', value: 'lt' },
  { label: '小于等于', value: 'lte' },
  { label: '包含', value: 'contains' },
  { label: '在列表中', value: 'in' },
];

// 超时处理方式选项
export const timeoutActionOptions = [
  { label: '自动通过', value: 'AUTO_PASS' },
  { label: '自动驳回', value: 'AUTO_REJECT' },
  { label: '发送提醒', value: 'REMIND' },
];

// 默认节点宽度和高度
export const DEFAULT_NODE_WIDTH = 120;
export const DEFAULT_NODE_HEIGHT = 48;

// 默认节点位置
export const DEFAULT_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  START: { x: 100, y: 250 },
  END: { x: 700, y: 250 },
  APPROVAL: { x: 300, y: 250 },
  CONDITION: { x: 300, y: 250 },
  PARALLEL: { x: 300, y: 250 },
  JOIN: { x: 500, y: 250 },
};
