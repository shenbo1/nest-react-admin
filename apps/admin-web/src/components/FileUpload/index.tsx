import React, { useState } from 'react';
import { Upload, Button, Modal, message } from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileTextOutlined,
  FileZipOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { uploadFile, uploadImage, isImageFile, formatFileSize } from '@/services/upload';

export interface FileItem {
  url: string;
  filename: string;
  originalname?: string;
  size?: number;
  mimetype?: string;
}

interface FileUploadProps {
  value?: FileItem | FileItem[];
  onChange?: (value: FileItem | FileItem[] | null) => void;
  maxCount?: number;
  maxSize?: number; // MB
  accept?: string;
  uploadType?: 'image' | 'file' | 'all';
  showFileList?: boolean;
  listType?: 'text' | 'picture' | 'picture-card';
  buttonText?: string;
  disabled?: boolean;
}

// 获取文件图标
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, React.ReactNode> = {
    pdf: <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />,
    doc: <FileWordOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
    docx: <FileWordOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
    xls: <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
    xlsx: <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
    ppt: <FilePptOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
    pptx: <FilePptOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
    txt: <FileTextOutlined style={{ fontSize: 24, color: '#666' }} />,
    csv: <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
    zip: <FileZipOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
    rar: <FileZipOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
    '7z': <FileZipOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
  };
  return iconMap[ext] || <FileOutlined style={{ fontSize: 24, color: '#666' }} />;
};

export function FileUpload({
  value,
  onChange,
  maxCount = 1,
  maxSize = 20,
  accept,
  uploadType = 'all',
  showFileList = true,
  listType = 'text',
  buttonText = '上传文件',
  disabled = false,
}: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 统一处理为数组格式
  const files: FileItem[] = Array.isArray(value) ? value : value ? [value] : [];
  const isSingleMode = maxCount === 1;

  // 根据 uploadType 确定 accept
  const getAccept = () => {
    if (accept) return accept;
    switch (uploadType) {
      case 'image':
        return 'image/*';
      case 'file':
        return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z';
      default:
        return undefined;
    }
  };

  const handleUpload = async (file: File) => {
    // 检查文件大小
    if (file.size / 1024 / 1024 > maxSize) {
      message.error(`文件大小不能超过 ${maxSize}MB`);
      return;
    }

    setLoading(true);
    try {
      // 根据文件类型选择上传接口
      const isImage = file.type.startsWith('image/');
      const res = isImage ? await uploadImage(file) : await uploadFile(file);

      const newFile: FileItem = {
        url: res.url,
        filename: res.filename,
        originalname: res.originalname,
        size: res.size,
        mimetype: res.mimetype,
      };

      if (isSingleMode) {
        onChange?.(newFile);
      } else {
        const newFiles = [...files, newFile].slice(0, maxCount);
        onChange?.(newFiles);
      }
      message.success('上传成功');
    } catch (error) {
      message.error('上传失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (index: number) => {
    if (isSingleMode) {
      onChange?.(null);
    } else {
      const newFiles = files.filter((_, i) => i !== index);
      onChange?.(newFiles.length > 0 ? newFiles : null);
    }
  };

  const handlePreview = (file: FileItem) => {
    if (isImageFile(file.url)) {
      setPreviewImage(file.url);
      setPreviewOpen(true);
    } else {
      // 非图片文件直接下载/打开
      window.open(file.url, '_blank');
    }
  };

  // 渲染文件列表项
  const renderFileItem = (file: FileItem, index: number) => {
    const isImage = isImageFile(file.url);

    if (listType === 'picture-card') {
      // 卡片模式
      return (
        <div
          key={index}
          style={{
            position: 'relative',
            width: 96,
            height: 96,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid #d9d9d9',
              borderRadius: 8,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fafafa',
              cursor: 'pointer',
            }}
            onClick={() => handlePreview(file)}
          >
            {isImage ? (
              <img
                src={file.url}
                alt={file.originalname || file.filename}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 8 }}>
                {getFileIcon(file.filename)}
                <div
                  style={{
                    fontSize: 11,
                    color: '#666',
                    marginTop: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 80,
                  }}
                >
                  {file.originalname || file.filename}
                </div>
              </div>
            )}
          </div>
          {/* 删除按钮 */}
          {!disabled && (
            <Button
              type="primary"
              danger
              size="small"
              shape="circle"
              icon={<DeleteOutlined style={{ fontSize: 12 }} />}
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                width: 22,
                height: 22,
                padding: 0,
                minWidth: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 10,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(index);
              }}
            />
          )}
        </div>
      );
    }

    // 列表模式
    return (
      <div
        key={index}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          marginBottom: 8,
          background: '#fafafa',
          borderRadius: 6,
          border: '1px solid #e8e8e8',
        }}
      >
        {isImage ? (
          <img
            src={file.url}
            alt={file.originalname}
            style={{
              width: 40,
              height: 40,
              objectFit: 'cover',
              borderRadius: 4,
              marginRight: 12,
            }}
          />
        ) : (
          <div style={{ marginRight: 12 }}>{getFileIcon(file.filename)}</div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              fontSize: 14,
              color: '#333',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {file.originalname || file.filename}
          </div>
          {file.size && (
            <div style={{ fontSize: 12, color: '#999' }}>
              {formatFileSize(file.size)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="text"
            size="small"
            icon={isImage ? <EyeOutlined /> : <DownloadOutlined />}
            onClick={() => handlePreview(file)}
          />
          {!disabled && (
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(index)}
            />
          )}
        </div>
      </div>
    );
  };

  // 渲染上传按钮
  const renderUploadButton = () => {
    if (listType === 'picture-card') {
      return (
        <Upload
          showUploadList={false}
          accept={getAccept()}
          disabled={disabled}
          customRequest={async ({ file }) => {
            await handleUpload(file as File);
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              border: '1px dashed #d9d9d9',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: disabled ? '#f5f5f5' : '#fafafa',
              transition: 'border-color 0.3s',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = '#1890ff';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d9d9d9';
            }}
          >
            {loading ? (
              <span>上传中...</span>
            ) : (
              <>
                <UploadOutlined style={{ fontSize: 20, color: '#999' }} />
                <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>上传</div>
              </>
            )}
          </div>
        </Upload>
      );
    }

    return (
      <Upload
        showUploadList={false}
        accept={getAccept()}
        disabled={disabled}
        customRequest={async ({ file }) => {
          await handleUpload(file as File);
        }}
      >
        <Button icon={<UploadOutlined />} loading={loading} disabled={disabled}>
          {buttonText}
        </Button>
      </Upload>
    );
  };

  return (
    <div>
      {/* 文件列表 */}
      {showFileList && files.length > 0 && (
        <div
          style={{
            display: listType === 'picture-card' ? 'flex' : 'block',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: files.length < maxCount ? 12 : 0,
            padding: listType === 'picture-card' ? 4 : 0,
          }}
        >
          {files.map((file, index) => renderFileItem(file, index))}
        </div>
      )}

      {/* 上传按钮 */}
      {files.length < maxCount && renderUploadButton()}

      {/* 图片预览弹窗 */}
      <Modal
        open={previewOpen}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={600}
      >
        <img
          alt="预览"
          style={{ width: '100%', maxHeight: 500, objectFit: 'contain' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
}

export default FileUpload;
