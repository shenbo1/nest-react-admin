import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ProColumns } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { message, Space, Modal, Tabs } from 'antd';
import {
  queryFlowInstances,
  queryMyInitiatedFlows,
  cancelFlow,
  terminateFlow,
  type FlowInstance,
} from '@/services/workflow/instance';
import PermissionButton from '@/components/PermissionButton';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { WORKFLOW } from '@/constants/permissions';

const FlowInstanceList: React.FC = () => {
  const navigate = useNavigate();
  const tableRef = useRef<ProTableRef>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // 取消流程
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => cancelFlow(id, reason),
    onSuccess: () => {
      message.success('流程已取消');
      tableRef.current?.reload();
    },
  });

  // 终止流程
  const terminateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => terminateFlow(id, reason),
    onSuccess: () => {
      message.success('流程已终止');
      tableRef.current?.reload();
    },
  });

  const handleCancel = (record: FlowInstance) => {
    Modal.confirm({
      title: '确认取消流程',
      content: `确定要取消流程「${record.title}」吗？`,
      onOk: () => cancelMutation.mutate({ id: record.id, reason: '用户主动取消' }),
    });
  };

  const handleTerminate = (record: FlowInstance) => {
    Modal.confirm({
      title: '确认终止流程',
      content: `确定要终止流程「${record.title}」吗？终止后将无法恢复。`,
      onOk: () => terminateMutation.mutate({ id: record.id, reason: '管理员强制终止' }),
    });
  };

  const getDuration = (duration?: number) => {
    if (!duration) return '-';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  };

  const columns: ProColumns<FlowInstance>[] = [
    {
      title: '流程编号',
      dataIndex: 'instanceNo',
      width: 160,
      render: (_, record) => (
        <a onClick={() => navigate(`/workflow/instance/detail/${record.id}`)}>
          {record.instanceNo}
        </a>
      ),
    },
    {
      title: '流程标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.title}</div>
          {record.businessNo && (
            <div style={{ fontSize: 12, color: '#999' }}>业务编号: {record.businessNo}</div>
          )}
        </div>
      ),
    },
    {
      title: '流程定义',
      dataIndex: ['flowDefinition', 'name'],
      width: 150,
      hideInSearch: true,
      render: (_, record) => (
        <div>
          <div>{record.flowDefinition?.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>v{record.flowDefinition?.version}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        RUNNING: { text: '进行中', status: 'Processing' },
        COMPLETED: { text: '已完成', status: 'Success' },
        REJECTED: { text: '已驳回', status: 'Error' },
        CANCELLED: { text: '已取消', status: 'Default' },
        TERMINATED: { text: '已终止', status: 'Error' },
      },
    },
    {
      title: '当前节点',
      dataIndex: 'currentNodeName',
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.currentNodeName || '-',
    },
    {
      title: '当前审批人',
      dataIndex: 'currentAssignees',
      width: 120,
      hideInSearch: true,
      render: (_, record) =>
        record.status === 'RUNNING' ? record.currentAssignees || '-' : '-',
    },
    {
      title: '发起人',
      dataIndex: 'initiatorName',
      width: 120,
      hideInSearch: true,
    },
    {
      title: '发起时间',
      dataIndex: 'startTime',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      width: 100,
      hideInSearch: true,
      render: (_, record) => getDuration(record.duration),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          {record.status === 'RUNNING' && (
            <>
              <PermissionButton
                permission={WORKFLOW.INSTANCE.QUERY}
                type="link"
                size="small"
                onClick={() => handleCancel(record)}
                fallbackMode="disabled"
              >
                取消
              </PermissionButton>
              {activeTab === 'all' && (
                <PermissionButton
                  permission={WORKFLOW.INSTANCE.TERMINATE}
                  type="link"
                  size="small"
                  danger
                  onClick={() => handleTerminate(record)}
                  fallbackMode="disabled"
                >
                  终止
                </PermissionButton>
              )}
            </>
          )}
          {record.status !== 'RUNNING' && '-'}
        </Space>
      ),
    },
  ];

  const loadData = async (params: any) => {
    if (activeTab === 'my') {
      const res = await queryMyInitiatedFlows({
        page: params.current,
        pageSize: params.pageSize,
        status: params.status || undefined,
      });
      return {
        data: res.list,
        total: res.total,
        success: true,
      };
    } else {
      const res = await queryFlowInstances({
        page: params.current,
        pageSize: params.pageSize,
        instanceNo: params.instanceNo || undefined,
        title: params.title || undefined,
        status: params.status || undefined,
        flowDefinitionId: params.flowDefinitionId ? Number(params.flowDefinitionId) : undefined,
      });
      return {
        data: res.list,
        total: res.total,
        success: true,
      };
    }
  };

  const tabItems = [
    { key: 'all', label: '全部流程' },
    { key: 'my', label: '我发起的' },
  ];

  return (
    <PageContainer title="流程实例">
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) => {
          setActiveTab(key as 'all' | 'my');
          tableRef.current?.reload();
        }}
      />

      <ProTable
        ref={tableRef}
        columns={columns}
        request={loadData}
        rowKey="id"
        scroll={{ x: 1500 }}
        search={{
          labelWidth: 'auto',
          span: 6,
        }}
        toolBarRender={() =>
          activeTab === 'all'
            ? [
                <PermissionButton
                  key="start"
                  permission={WORKFLOW.INSTANCE.START}
                  type="primary"
                  onClick={() => navigate('/workflow/instance/start')}
                >
                  发起流程
                </PermissionButton>,
              ]
            : []
        }
      />
    </PageContainer>
  );
};

export default FlowInstanceList;
