import request from '@/utils/request';

export interface SysFile {
  id: number;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  fileType: string;
  uploadedBy: number | null;
  uploader: {
    id: number;
    username: string;
    nickname: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileQuery {
  page?: number;
  pageSize?: number;
  originalName?: string;
  fileType?: string;
}

export const fileApi = {
  /** 获取文件列表 */
  list(params?: FileQuery) {
    return request.get<{ data: SysFile[]; total: number }>('/system/file', { params });
  },

  /** 获取文件详情 */
  get(id: number) {
    return request.get<SysFile>(`/system/file/${id}`);
  },

  /** 删除文件 */
  delete(id: number) {
    return request.delete(`/system/file/${id}`);
  },
};
