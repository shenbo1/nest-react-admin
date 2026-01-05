import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Image, Tooltip } from 'antd';
import {
  DeleteOutlined,
  DownloadOutlined,
  FileOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileZipOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { ProColumns } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { fileApi, SysFile } from '@/services/system/file';
import { PermissionButton } from '@/components/PermissionButton';
import { SYSTEM } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import dayjs from 'dayjs';

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 根据 MIME 类型获取文件图标
const getFileIcon = (mimetype: string) => {
  if (mimetype.startsWith('image/')) return <FileImageOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
  if (mimetype === 'application/pdf') return <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
  if (mimetype.includes('word') || mimetype.includes('document')) return <FileWordOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return <FilePptOutlined style={{ fontSize: 24, color: '#fa8c16' }} />;
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) return <FileZipOutlined style={{ fontSize: 24, color: '#722ed1' }} />;
  if (mimetype.includes('text')) return <FileTextOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />;
  return <FileOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />;
};

// 判断是否是图片
const isImage = (mimetype: string): boolean => mimetype.startsWith('image/');

export default function FilePage() {
  const actionRef = useRef<ProTableRef>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // 删除
  const deleteMutation = useMutation({
    mutationFn: fileApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文件吗？删除后无法恢复。',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handlePreview = (record: SysFile) => {
    if (isImage(record.mimetype)) {
      setPreviewUrl(record.url);
      setPreviewVisible(true);
    } else {
      window.open(record.url, '_blank');
    }
  };

  const handleDownload = (record: SysFile) => {
    const link = document.createElement('a');
    link.href = record.url;
    link.download = record.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ProColumns<SysFile>[] = [
    {
      title: '文件信息',
      dataIndex: 'originalName',
      width: 300,
      render: (_, record) => (
        <div
          style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
          onClick={() => handlePreview(record)}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#fafafa',
              flexShrink: 0,
            }}
          >
            {isImage(record.mimetype) ? (
              <Image
                src={record.url}
                alt={record.originalName}
                width={48}
                height={48}
                style={{ objectFit: 'cover' }}
                preview={false}
              />
            ) : (
              getFileIcon(record.mimetype)
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Tooltip title={record.originalName}>
              <div
                style={{
                  fontWeight: 500,
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {record.originalName}
              </div>
            </Tooltip>
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.mimetype}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'fileType',
      width: 80,
      align: 'center',
      valueType: 'select',
      valueEnum: {
        image: { text: '图片', status: 'Success' },
        file: { text: '文件', status: 'Processing' },
      },
      render: (_, record) => (
        <Tag color={record.fileType === 'image' ? 'green' : 'blue'}>
          {record.fileType === 'image' ? '图片' : '文件'}
        </Tag>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      width: 100,
      align: 'right',
      search: false,
      render: (_, record) => formatFileSize(record.size),
    },
    {
      title: '上传人',
      dataIndex: 'uploader',
      width: 120,
      search: false,
      render: (_, record) => record.uploader?.nickname || record.uploader?.username || '-',
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      width: 180,
      valueType: 'dateTime',
      search: false,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <PermissionButton
            permission={SYSTEM.FILE.QUERY}
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
          </PermissionButton>
          <PermissionButton
            permission={SYSTEM.FILE.REMOVE}
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </PermissionButton>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<SysFile>
        headerTitle="文件管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1000 }}
        api="/system/file"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewVisible,
          src: previewUrl,
          onVisibleChange: (visible) => setPreviewVisible(visible),
        }}
      />
    </>
  );
}
