import request from '@/utils/request';

export interface UploadResponse {
  url: string;
  filename: string;
  originalname: string;
  size: number;
  mimetype: string;
}

/**
 * 上传图片
 * @param file 图片文件
 * @returns 上传结果
 */
export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request.post<UploadResponse>('/upload/image', formData);

  return response;
};

/**
 * 上传文件（支持文档、压缩包等）
 * @param file 文件
 * @returns 上传结果
 */
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request.post<UploadResponse>('/upload/file', formData);

  return response;
};

/**
 * 根据文件类型判断是否为图片
 */
export const isImageFile = (file: File | string): boolean => {
  if (typeof file === 'string') {
    // URL 判断
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file);
  }
  return file.type.startsWith('image/');
};

/**
 * 获取文件图标类型
 */
export const getFileIconType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    pdf: 'pdf',
    doc: 'word',
    docx: 'word',
    xls: 'excel',
    xlsx: 'excel',
    ppt: 'ppt',
    pptx: 'ppt',
    txt: 'text',
    csv: 'excel',
    zip: 'zip',
    rar: 'zip',
    '7z': 'zip',
  };
  return iconMap[ext] || 'file';
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
