import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProColumns } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { message, Space, Tag, Button, Badge } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import {
  queryCopyRecords,
  markCopyAsRead,
  markAllCopyAsRead,
  getUnreadCopyCount,
  type CopyRecord,
} from '@/services/workflow/copy';
import PermissionButton from '@/components/PermissionButton';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { WORKFLOW } from '@/constants/permissions';
import dayjs from 'dayjs';

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待处理', color: 'default' },
  RUNNING: { text: '进行中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  REJECTED: { text: '已驳回', color: 'error' },
  CANCELLED: { text: '已取消', color: 'default' },
  TERMINATED: { text: '已终止', color: 'error' },
};

const CopyList: React.FC = () => {
  const navigate = useNavigate();
  const tableRef = useRef<ProTableRef>(null);
  const queryClient = useQueryClient();

  // 获取未读抄送数量
  const { data: unreadCountData } = useQuery({
    queryKey: ['unread-copy-count'],
    queryFn: getUnreadCopyCount,
    refetchInterval: 30000,
  });

  // 标记为已读
  const markReadMutation = useMutation({
    mutationFn: markCopyAsRead,
    onSuccess: () => {
      message.success('已标记为已读');
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['unread-copy-count'] });
    },
  });

  // 全部标记为已读
  const markAllReadMutation = useMutation({
    mutationFn: markAllCopyAsRead,
    onSuccess: () => {
      message.success('已全部标记为已读');
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['unread-copy-count'] });
    },
  });

  const handleViewDetail = (record: CopyRecord) => {
    // 查看时自动标记为已读
    if (!record.isRead) {
      markReadMutation.mutate(record.id);
    }
    navigate(`/workflow/instance/${record.flowInstanceId}`);
  };

  const handleMarkAsRead = (record: CopyRecord) => {
    markReadMutation.mutate(record.id);
  };

  const columns: ProColumns<CopyRecord>[] = [
    {
      title: '流程标题',
      dataIndex: ['flowInstance', 'title'],
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: record.isRead ? 400 : 600 }}>
            {record.flowInstance?.title}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            流程编号: {record.flowInstance?.instanceNo}
          </div>
        </div>
      ),
    },
    {
      title: '流程类型',
      dataIndex: ['flowInstance', 'flowDefinition', 'name'],
      width: 120,
      hideInSearch: true,
    },
    {
      title: '发起人',
      dataIndex: ['flowInstance', 'initiatorName'],
      width: 100,
      hideInSearch: true,
    },
    {
      title: '抄送节点',
      dataIndex: ['task', 'nodeName'],
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.task?.nodeName || '-',
    },
    {
      title: '阅读状态',
      dataIndex: 'isRead',
      width: 100,
      valueType: 'select',
      valueEnum: {
        false: { text: '未读', status: 'Processing' },
        true: { text: '已读', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.isRead ? 'default' : 'blue'}>
          {record.isRead ? '已读' : '未读'}
        </Tag>
      ),
    },
    {
      title: '流程状态',
      dataIndex: ['flowInstance', 'status'],
      width: 100,
      hideInSearch: true,
      render: (_, record) => {
        const status = record.flowInstance?.status;
        if (!status) return '-';
        const config = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '抄送时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '阅读时间',
      dataIndex: 'readTime',
      width: 160,
      hideInSearch: true,
      render: (_, record) =>
        record.readTime ? dayjs(record.readTime).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            permission={WORKFLOW.COPY.QUERY}
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            fallbackMode="disabled"
          >
            查看
          </PermissionButton>
          {!record.isRead && (
            <PermissionButton
              permission={WORKFLOW.COPY.QUERY}
              type="link"
              size="small"
              onClick={() => handleMarkAsRead(record)}
              fallbackMode="disabled"
            >
              标为已读
            </PermissionButton>
          )}
        </Space>
      ),
    },
  ];

  const loadData = async (params: any) => {
    const res = await queryCopyRecords({
      page: params.current,
      pageSize: params.pageSize,
      isRead: params.isRead !== undefined ? params.isRead === 'true' : undefined,
    });
    return {
      data: res.list,
      total: res.total,
      success: true,
    };
  };

  const unreadCount = unreadCountData?.count || 0;

  return (
    <PageContainer
      title="抄送记录"
      extra={
        unreadCount > 0 ? (
          <Badge count={unreadCount} showZero offset={[10, 0]}>
            <span style={{ color: '#999' }}>未读抄送</span>
          </Badge>
        ) : null
      }
    >
      <ProTable
        ref={tableRef}
        columns={columns}
        request={loadData}
        rowKey="id"
        scroll={{ x: 1200 }}
        search={{
          labelWidth: 'auto',
          span: 6,
        }}
        toolBarRender={() =>
          unreadCount > 0
            ? [
                <Button
                  key="mark-all-read"
                  onClick={() => markAllReadMutation.mutate()}
                  loading={markAllReadMutation.isPending}
                >
                  全部标为已读
                </Button>,
              ]
            : []
        }
      />
    </PageContainer>
  );
};

export default CopyList;
