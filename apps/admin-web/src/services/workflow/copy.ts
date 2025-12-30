import request from '@/utils/request';

// 抄送记录
export interface CopyRecord {
  id: number;
  flowInstanceId: number;
  flowInstance?: {
    instanceNo: string;
    title: string;
    initiatorName: string;
    status: string;
    startTime: string;
    flowDefinition?: {
      name: string;
      category?: {
        id: number;
        name: string;
      };
    };
  };
  taskId?: number;
  task?: {
    nodeName: string;
    assigneeName: string;
  };
  userId: number;
  isRead: boolean;
  readTime?: string;
  createdAt: string;
}

/**
 * 查询抄送给我的记录
 */
export function queryCopyRecords(params: {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
}) {
  return request.get<{
    list: CopyRecord[];
    total: number;
    page: number;
    pageSize: number;
  }>('/workflow/copy', { params });
}

/**
 * 获取未读抄送数量
 */
export function getUnreadCopyCount() {
  return request.get<{ count: number }>('/workflow/copy/unread-count');
}

/**
 * 标记抄送记录为已读
 */
export function markCopyAsRead(id: number) {
  return request.post(`/workflow/copy/${id}/read`);
}

/**
 * 全部标记为已读
 */
export function markAllCopyAsRead() {
  return request.post('/workflow/copy/read-all');
}
