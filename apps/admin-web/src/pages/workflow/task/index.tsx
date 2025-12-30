import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ProColumns,
  ModalForm,
  ProFormSelect,
  ProFormTextArea,
  ProForm,
} from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { message, Space, Tag, Tabs, Badge, Button } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  SwapOutlined,
  EyeOutlined,
  UserAddOutlined,
  BellOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  queryPendingTasks,
  queryCompletedTasks,
  approveTask,
  rejectTask,
  transferTask,
  countersignTask,
  urgeTask,
  type Task,
} from '@/services/workflow/task';
import {
  queryCopyRecords,
  markCopyAsRead,
  markAllCopyAsRead,
  getUnreadCopyCount,
  type CopyRecord,
} from '@/services/workflow/copy';
import { userApi } from '@/services/system/system';
import PermissionButton from '@/components/PermissionButton';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { WORKFLOW } from '@/constants/permissions';

// 流程状态映射
const instanceStatusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待处理', color: 'default' },
  RUNNING: { text: '进行中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  REJECTED: { text: '已驳回', color: 'error' },
  CANCELLED: { text: '已取消', color: 'default' },
  TERMINATED: { text: '已终止', color: 'error' },
};

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tableRef = useRef<ProTableRef>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'copy'>('pending');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [countersignModalOpen, setCountersignModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [approveForm] = ProForm.useForm();
  const [rejectForm] = ProForm.useForm();
  const [transferForm] = ProForm.useForm();
  const [countersignForm] = ProForm.useForm();

  // 批量操作
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [batchApproveModalOpen, setBatchApproveModalOpen] = useState(false);
  const [batchRejectModalOpen, setBatchRejectModalOpen] = useState(false);
  const [batchApproveForm] = ProForm.useForm();
  const [batchRejectForm] = ProForm.useForm();

  // 获取用户列表
  const { data: usersData } = useQuery({
    queryKey: ['users-simple'],
    queryFn: async () => {
      const res = await userApi.list({ page: 1, pageSize: 100 });
      return res.data.map((user) => ({
        label: `${user.nickname || user.username} (${user.username})`,
        value: user.id,
      }));
    },
  });

  // 获取未读抄送数量
  const { data: unreadCountData } = useQuery({
    queryKey: ['unread-copy-count'],
    queryFn: getUnreadCopyCount,
    refetchInterval: 30000,
  });

  // 审批通过
  const approveMutation = useMutation({
    mutationFn: async (values: { comment?: string }) => {
      if (!currentTask) throw new Error('No task selected');
      await approveTask(currentTask.id, values);
    },
    onSuccess: () => {
      message.success('审批通过');
      setApproveModalOpen(false);
      approveForm.resetFields();
      tableRef.current?.reload();
    },
  });

  // 审批驳回
  const rejectMutation = useMutation({
    mutationFn: async (values: { comment: string }) => {
      if (!currentTask) throw new Error('No task selected');
      await rejectTask(currentTask.id, values);
    },
    onSuccess: () => {
      message.success('审批已驳回');
      setRejectModalOpen(false);
      rejectForm.resetFields();
      tableRef.current?.reload();
    },
  });

  // 转办任务
  const transferMutation = useMutation({
    mutationFn: async (values: { targetUserId: number; comment?: string }) => {
      if (!currentTask) throw new Error('No task selected');
      await transferTask(currentTask.id, values);
    },
    onSuccess: () => {
      message.success('转办成功');
      setTransferModalOpen(false);
      transferForm.resetFields();
      tableRef.current?.reload();
    },
  });

  // 加签任务
  const countersignMutation = useMutation({
    mutationFn: async (values: { userIds: number[]; comment?: string }) => {
      if (!currentTask) throw new Error('No task selected');
      await countersignTask(currentTask.id, values);
    },
    onSuccess: () => {
      message.success('加签成功');
      setCountersignModalOpen(false);
      countersignForm.resetFields();
      tableRef.current?.reload();
    },
  });

  // 催办任务
  const urgeMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await urgeTask(taskId, '催办：请尽快处理');
    },
    onSuccess: () => {
      message.success('催办成功');
    },
  });

  // 批量审批通过
  const batchApproveMutation = useMutation({
    mutationFn: async (values: { comment?: string }) => {
      const results = await Promise.allSettled(
        selectedRowKeys.map((taskId) => approveTask(taskId, values))
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.filter((r) => r.status === 'rejected').length;
      return { successCount, failCount };
    },
    onSuccess: ({ successCount, failCount }) => {
      if (failCount === 0) {
        message.success(`批量通过成功，共 ${successCount} 条`);
      } else {
        message.warning(`批量通过完成，成功 ${successCount} 条，失败 ${failCount} 条`);
      }
      setBatchApproveModalOpen(false);
      batchApproveForm.resetFields();
      setSelectedRowKeys([]);
      tableRef.current?.reload();
    },
  });

  // 批量审批驳回
  const batchRejectMutation = useMutation({
    mutationFn: async (values: { comment: string }) => {
      const results = await Promise.allSettled(
        selectedRowKeys.map((taskId) => rejectTask(taskId, values))
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.filter((r) => r.status === 'rejected').length;
      return { successCount, failCount };
    },
    onSuccess: ({ successCount, failCount }) => {
      if (failCount === 0) {
        message.success(`批量驳回成功，共 ${successCount} 条`);
      } else {
        message.warning(`批量驳回完成，成功 ${successCount} 条，失败 ${failCount} 条`);
      }
      setBatchRejectModalOpen(false);
      batchRejectForm.resetFields();
      setSelectedRowKeys([]);
      tableRef.current?.reload();
    },
  });

  const handleShowApprove = (task: Task) => {
    setCurrentTask(task);
    setApproveModalOpen(true);
    approveForm.resetFields();
  };

  const handleShowReject = (task: Task) => {
    setCurrentTask(task);
    setRejectModalOpen(true);
    rejectForm.resetFields();
  };

  const handleShowTransfer = (task: Task) => {
    setCurrentTask(task);
    setTransferModalOpen(true);
    transferForm.resetFields();
  };

  const handleShowCountersign = (task: Task) => {
    setCurrentTask(task);
    setCountersignModalOpen(true);
    countersignForm.resetFields();
  };

  const handleViewDetail = (record: Task) => {
    // 跳转到流程实例详情页
    navigate(`/workflow/instance/detail/${record.flowInstanceId}`);
  };

  // 抄送记录表格 ref（提前声明，用于 mutation）
  const copyTableRef = useRef<ProTableRef>(null);

  // 抄送记录 - 标记为已读
  const markReadMutation = useMutation({
    mutationFn: markCopyAsRead,
    onSuccess: () => {
      message.success('已标记为已读');
      copyTableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['unread-copy-count'] });
    },
  });

  // 抄送记录 - 全部标记为已读
  const markAllReadMutation = useMutation({
    mutationFn: markAllCopyAsRead,
    onSuccess: () => {
      message.success('已全部标记为已读');
      copyTableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['unread-copy-count'] });
    },
  });

  const handleViewCopyDetail = (record: CopyRecord) => {
    // 查看时自动标记为已读
    if (!record.isRead) {
      markReadMutation.mutate(record.id);
    }
    navigate(`/workflow/instance/detail/${record.flowInstanceId}`);
  };

  const handleMarkAsRead = (record: CopyRecord) => {
    markReadMutation.mutate(record.id);
  };

  const pendingColumns: ProColumns<Task>[] = [
    {
      title: '任务编号',
      dataIndex: 'taskNo',
      width: 160,
      render: (_, record) => (
        <a onClick={() => handleViewDetail(record)} style={{ cursor: 'pointer' }}>
          {record.taskNo}
        </a>
      ),
    },
    {
      title: '流程标题',
      dataIndex: ['flowInstance', 'title'],
      width: 200,
      hideInSearch: true,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.flowInstance?.title}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            流程编号: {record.flowInstance?.instanceNo}
          </div>
        </div>
      ),
    },
    {
      title: '流程定义',
      dataIndex: ['flowInstance', 'flowDefinition', 'name'],
      width: 150,
      hideInSearch: true,
    },
    {
      title: '节点名称',
      dataIndex: 'nodeName',
      width: 120,
    },
    {
      title: '发起人',
      dataIndex: ['flowInstance', 'initiatorName'],
      width: 100,
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      hideInSearch: true,
      render: () => (
        <Tag color="processing" icon={<ClockCircleOutlined />}>
          待处理
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '截止时间',
      dataIndex: 'dueTime',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => record.dueTime || '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            permission={WORKFLOW.TASK.QUERY}
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            fallbackMode="disabled"
          >
            详情
          </PermissionButton>
          <PermissionButton
            permission={WORKFLOW.TASK.APPROVE}
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleShowApprove(record)}
            fallbackMode="disabled"
          >
            通过
          </PermissionButton>
          <PermissionButton
            permission={WORKFLOW.TASK.REJECT}
            type="link"
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleShowReject(record)}
            fallbackMode="disabled"
          >
            驳回
          </PermissionButton>
          <PermissionButton
            permission={WORKFLOW.TASK.TRANSFER}
            type="link"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => handleShowTransfer(record)}
            fallbackMode="disabled"
          >
            转办
          </PermissionButton>
          <PermissionButton
            permission={WORKFLOW.TASK.COUNTERSIGN}
            type="link"
            size="small"
            icon={<UserAddOutlined />}
            onClick={() => handleShowCountersign(record)}
            fallbackMode="disabled"
          >
            加签
          </PermissionButton>
          <PermissionButton
            permission={WORKFLOW.TASK.QUERY}
            type="link"
            size="small"
            icon={<BellOutlined />}
            onClick={() => urgeMutation.mutate(record.id)}
            fallbackMode="disabled"
          >
            催办
          </PermissionButton>
        </Space>
      ),
    },
  ];

  const completedColumns: ProColumns<Task>[] = [
    {
      title: '任务编号',
      dataIndex: 'taskNo',
      width: 160,
      render: (_, record) => (
        <a onClick={() => handleViewDetail(record)} style={{ cursor: 'pointer' }}>
          {record.taskNo}
        </a>
      ),
    },
    {
      title: '流程标题',
      dataIndex: ['flowInstance', 'title'],
      width: 200,
      hideInSearch: true,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.flowInstance?.title}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            流程编号: {record.flowInstance?.instanceNo}
          </div>
        </div>
      ),
    },
    {
      title: '流程定义',
      dataIndex: ['flowInstance', 'flowDefinition', 'name'],
      width: 150,
      hideInSearch: true,
    },
    {
      title: '节点名称',
      dataIndex: 'nodeName',
      width: 120,
    },
    {
      title: '发起人',
      dataIndex: ['flowInstance', 'initiatorName'],
      width: 100,
      hideInSearch: true,
    },
    {
      title: '处理结果',
      dataIndex: 'result',
      width: 100,
      valueType: 'select',
      valueEnum: {
        APPROVED: { text: '已通过', status: 'Success' },
        REJECTED: { text: '已驳回', status: 'Error' },
        TRANSFERRED: { text: '已转办', status: 'Warning' },
        COUNTERSIGNED: { text: '已加签', status: 'Processing' },
      },
    },
    {
      title: '处理时间',
      dataIndex: 'completedAt',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => record.completedAt || '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <PermissionButton
          permission={WORKFLOW.TASK.QUERY}
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
          fallbackMode="disabled"
        >
          详情
        </PermissionButton>
      ),
    },
  ];

  const loadPendingData = async (params: any) => {
    const res = await queryPendingTasks({
      page: params.current,
      pageSize: params.pageSize,
      taskNo: params.taskNo || undefined,
      nodeName: params.nodeName || undefined,
    });
    return {
      data: res.list,
      total: res.total,
      success: true,
    };
  };

  const loadCompletedData = async (params: any) => {
    const res = await queryCompletedTasks({
      page: params.current,
      pageSize: params.pageSize,
      taskNo: params.taskNo || undefined,
      nodeName: params.nodeName || undefined,
      result: params.result || undefined,
    });
    return {
      data: res.list,
      total: res.total,
      success: true,
    };
  };

  // 抄送记录列配置
  const copyColumns: ProColumns<CopyRecord>[] = [
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
        const config = instanceStatusMap[status] || { text: status, color: 'default' };
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
            onClick={() => handleViewCopyDetail(record)}
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

  const loadCopyData = async (params: any) => {
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

  const tabItems = [
    { key: 'pending', label: '待办任务' },
    { key: 'completed', label: '已办任务' },
    {
      key: 'copy',
      label: (
        <span>
          抄送记录
          {unreadCount > 0 && (
            <Badge count={unreadCount} size="small" offset={[6, -2]} />
          )}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="任务管理">
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) => {
          setActiveTab(key as 'pending' | 'completed' | 'copy');
          setSelectedRowKeys([]);
        }}
      />

      {/* 待办任务 */}
      {activeTab === 'pending' && (
        <ProTable<Task>
          ref={tableRef}
          columns={pendingColumns}
          request={loadPendingData}
          rowKey="id"
          scroll={{ x: 1400 }}
          search={{
            labelWidth: 'auto',
            span: 6,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as number[]),
          }}
          tableAlertOptionRender={() => (
            <Space>
              <PermissionButton
                permission={WORKFLOW.TASK.APPROVE}
                type="link"
                onClick={() => setBatchApproveModalOpen(true)}
              >
                批量通过
              </PermissionButton>
              <PermissionButton
                permission={WORKFLOW.TASK.REJECT}
                type="link"
                danger
                onClick={() => setBatchRejectModalOpen(true)}
              >
                批量驳回
              </PermissionButton>
            </Space>
          )}
        />
      )}

      {/* 已办任务 */}
      {activeTab === 'completed' && (
        <ProTable<Task>
          ref={tableRef}
          columns={completedColumns}
          request={loadCompletedData}
          rowKey="id"
          scroll={{ x: 1400 }}
          search={{
            labelWidth: 'auto',
            span: 6,
          }}
        />
      )}

      {/* 抄送记录 */}
      {activeTab === 'copy' && (
        <ProTable<CopyRecord>
          ref={copyTableRef}
          columns={copyColumns}
          request={loadCopyData}
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
      )}

      {/* 审批通过模态框 */}
      <ModalForm
        title="审批通过"
        open={approveModalOpen}
        onOpenChange={setApproveModalOpen}
        form={approveForm}
        width={600}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          await approveMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormTextArea name="comment" label="审批意见" placeholder="请输入审批意见（可选）" />
      </ModalForm>

      {/* 审批驳回模态框 */}
      <ModalForm
        title="审批驳回"
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        form={rejectForm}
        width={600}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          await rejectMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormTextArea
          name="comment"
          label="驳回原因"
          rules={[{ required: true, message: '请输入驳回原因' }]}
          placeholder="请输入驳回原因"
        />
      </ModalForm>

      {/* 转办模态框 */}
      <ModalForm
        title="转办任务"
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        form={transferForm}
        width={600}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          await transferMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormSelect
          name="targetUserId"
          label="转办给"
          rules={[{ required: true, message: '请选择转办人' }]}
          placeholder="请选择转办人"
          showSearch
          options={usersData || []}
        />
        <ProFormTextArea name="comment" label="转办说明" placeholder="请输入转办说明（可选）" />
      </ModalForm>

      {/* 加签模态框 */}
      <ModalForm
        title="加签任务"
        open={countersignModalOpen}
        onOpenChange={setCountersignModalOpen}
        form={countersignForm}
        width={600}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          await countersignMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormSelect
          name="userIds"
          label="加签人员"
          rules={[{ required: true, message: '请选择加签人员' }]}
          placeholder="请选择加签人员"
          mode="multiple"
          showSearch
          options={usersData || []}
        />
        <ProFormTextArea name="comment" label="加签说明" placeholder="请输入加签说明（可选）" />
      </ModalForm>

      {/* 批量通过模态框 */}
      <ModalForm
        title={`批量通过（已选 ${selectedRowKeys.length} 条）`}
        open={batchApproveModalOpen}
        onOpenChange={setBatchApproveModalOpen}
        form={batchApproveForm}
        width={600}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          await batchApproveMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormTextArea name="comment" label="审批意见" placeholder="请输入审批意见（可选，将应用于所有选中任务）" />
      </ModalForm>

      {/* 批量驳回模态框 */}
      <ModalForm
        title={`批量驳回（已选 ${selectedRowKeys.length} 条）`}
        open={batchRejectModalOpen}
        onOpenChange={setBatchRejectModalOpen}
        form={batchRejectForm}
        width={600}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          await batchRejectMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormTextArea
          name="comment"
          label="驳回原因"
          rules={[{ required: true, message: '请输入驳回原因' }]}
          placeholder="请输入驳回原因（将应用于所有选中任务）"
        />
      </ModalForm>
    </PageContainer>
  );
};

export default TaskList;
