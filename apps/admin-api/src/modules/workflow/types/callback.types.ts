/**
 * 业务回调相关类型定义
 */

export interface BusinessCallback {
  /**
   * 回调URL
   */
  url: string;

  /**
   * 回调方法
   */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';

  /**
   * 请求头
   */
  headers?: Record<string, string>;

  /**
   * 请求体模板（POST/PUT/PATCH）
   */
  bodyTemplate?: string;

  /**
   * 重试次数
   */
  retryCount?: number;

  /**
   * 重试间隔（毫秒）
   */
  retryInterval?: number;

  /**
   * 超时时间（毫秒）
   */
  timeout?: number;

  /**
   * 回调条件
   */
  conditions?: CallbackCondition[];
}

export interface CallbackCondition {
  /**
   * 条件类型
   */
  type: 'status' | 'result' | 'node' | 'custom';

  /**
   * 条件值
   */
  value: any;

  /**
   * 操作符
   */
  operator: 'eq' | 'ne' | 'in' | 'not_in';
}

export interface CallbackPayload {
  /**
   * 事件类型
   */
  eventType: 'flow_started' | 'flow_completed' | 'flow_rejected' | 'flow_cancelled' | 'flow_terminated' | 'task_approved' | 'task_rejected' | 'task_transferred' | 'task_urged';

  /**
   * 流程实例ID
   */
  flowInstanceId: number;

  /**
   * 流程实例编号
   */
  instanceNo: string;

  /**
   * 流程定义ID
   */
  flowDefinitionId: number;

  /**
   * 流程定义名称
   */
  flowDefinitionName: string;

  /**
   * 业务ID
   */
  businessId?: string;

  /**
   * 业务编号
   */
  businessNo?: string;

  /**
   * 发起人信息
   */
  initiator: {
    id: number;
    name: string;
    deptId?: number;
    deptName?: string;
  };

  /**
   * 当前状态
   */
  status: string;

  /**
   * 当前节点（如果有）
   */
  currentNode?: {
    id: string;
    name: string;
  };

  /**
   * 任务信息（任务相关事件）
   */
  task?: {
    id: number;
    taskNo: string;
    nodeId: string;
    nodeName: string;
    assigneeId: number;
    assigneeName: string;
    result?: string;
    comment?: string;
  };

  /**
   * 时间戳
   */
  timestamp: string;

  /**
   * 扩展数据
   */
  [key: string]: any;
}

export interface CallbackResult {
  /**
   * 是否成功
   */
  success: boolean;

  /**
   * 响应状态码
   */
  statusCode?: number;

  /**
   * 响应数据
   */
  data?: any;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 执行时间
   */
  duration?: number;
}

export interface CallbackLog {
  /**
   * 日志ID
   */
  id: number;

  /**
   * 流程实例ID
   */
  flowInstanceId: number;

  /**
   * 事件类型
   */
  eventType: string;

  /**
   * 回调配置
   */
  callbackConfig: BusinessCallback;

  /**
   * 请求数据
   */
  requestData: CallbackPayload;

  /**
   * 响应结果
   */
  result?: CallbackResult;

  /**
   * 执行状态
   */
  status: 'pending' | 'success' | 'failed' | 'retrying';

  /**
   * 重试次数
   */
  retryCount: number;

  /**
   * 最大重试次数
   */
  maxRetryCount: number;

  /**
   * 下次重试时间
   */
  nextRetryAt?: Date;

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 更新时间
   */
  updatedAt: Date;
}