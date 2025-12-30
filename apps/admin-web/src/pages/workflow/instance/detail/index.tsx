import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageContainer,
  ProCard,
  ProDescriptions,
  ModalForm,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Tag,
  Button,
  Space,
  Modal,
  message,
  Row,
  Col,
  Tabs,
  Timeline,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  UserOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { getFlowInstance, getFlowProgress, cancelFlow } from '@/services/workflow/instance';
import { queryPendingTasks, approveTask, rejectTask, type Task } from '@/services/workflow/task';
import { useUserStore } from '@/stores/user';
import { WORKFLOW } from '@/constants/permissions';
import PermissionButton from '@/components/PermissionButton';
import dayjs from 'dayjs';

interface FlowProgressNode {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED';
  assigneeId?: number;
  assigneeName?: string;
  result?: string;
  comment?: string;
  startTime?: string;
  endTime?: string;
  tasks?: Array<{
    id: number;
    taskNo: string;
    assigneeId: number;
    assigneeName: string;
    status: string;
    result?: string;
    comment?: string;
    completedAt?: string;
  }>;
}

const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const FlowInstanceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userInfo } = useUserStore();

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  // 获取流程实例
  const { data: instance, isLoading: instanceLoading } = useQuery({
    queryKey: ['flow-instance', id],
    queryFn: () => getFlowInstance(Number(id)),
    enabled: !!id,
  });

  // 获取流程进度
  const { data: progress = [] } = useQuery<FlowProgressNode[]>({
    queryKey: ['flow-progress', id],
    queryFn: () => getFlowProgress(Number(id)),
    enabled: !!id,
  });

  // 查询当前用户在此流程下的待办任务
  const { data: pendingTasksData } = useQuery({
    queryKey: ['pending-tasks', id],
    queryFn: () => queryPendingTasks({ flowInstanceId: Number(id), pageSize: 100 }),
    enabled: !!id && instance?.status === 'RUNNING',
  });

  // 当前用户的待办任务
  const myPendingTask: Task | undefined = pendingTasksData?.list?.find(
    (task) => task.assigneeId === userInfo?.id
  );

  // 撤回流程
  const cancelMutation = useMutation({
    mutationFn: (params: { id: number; reason: string }) => cancelFlow(params.id, params.reason),
    onSuccess: () => {
      message.success('流程已撤回');
      queryClient.invalidateQueries({ queryKey: ['flow-instance', id] });
      queryClient.invalidateQueries({ queryKey: ['flow-progress', id] });
    },
    onError: () => {
      message.error('撤回失败');
    },
  });

  // 审批通过
  const approveMutation = useMutation({
    mutationFn: (params: { taskId: number; comment?: string }) =>
      approveTask(params.taskId, { comment: params.comment }),
    onSuccess: () => {
      message.success('审批通过');
      setApproveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['flow-instance', id] });
      queryClient.invalidateQueries({ queryKey: ['flow-progress', id] });
      queryClient.invalidateQueries({ queryKey: ['pending-tasks', id] });
    },
    onError: () => {
      message.error('操作失败');
    },
  });

  // 审批驳回
  const rejectMutation = useMutation({
    mutationFn: (params: { taskId: number; comment?: string }) =>
      rejectTask(params.taskId, { comment: params.comment }),
    onSuccess: () => {
      message.success('已驳回');
      setRejectModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['flow-instance', id] });
      queryClient.invalidateQueries({ queryKey: ['flow-progress', id] });
      queryClient.invalidateQueries({ queryKey: ['pending-tasks', id] });
    },
    onError: () => {
      message.error('操作失败');
    },
  });

  const handleCancel = () => {
    if (!instance) return;

    Modal.confirm({
      title: '确认撤回流程',
      content: '确定要撤回该流程吗？撤回后流程将终止。',
      onOk: () => {
        cancelMutation.mutate({ id: instance.id, reason: '用户主动撤回' });
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'RUNNING':
        return 'processing';
      case 'REJECTED':
      case 'CANCELLED':
      case 'TERMINATED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      RUNNING: '进行中',
      COMPLETED: '已完成',
      REJECTED: '已驳回',
      CANCELLED: '已撤回',
      TERMINATED: '已终止',
      PENDING: '待处理',
    };
    return map[status] || status;
  };

  const renderFlowGraph = () => {
    if (!progress.length) return <div style={{ textAlign: 'center', color: '#999' }}>暂无流程进度数据</div>;

    return (
      <div style={{ padding: 24, background: '#fafafa', borderRadius: 8 }}>
        <Row gutter={[16, 16]}>
          {progress.map((node) => {
            const isCompleted = node.status === 'COMPLETED';
            const isRunning = node.status === 'RUNNING';
            const isSkipped = node.status === 'SKIPPED';

            return (
              <Col key={node.nodeId} span={8}>
                <ProCard
                  title={node.nodeName}
                  headerBordered
                  style={{
                    background: isCompleted ? '#f6ffed' : isRunning ? '#e6f7ff' : '#fafafa',
                    borderColor: isCompleted ? '#52c41a' : isRunning ? '#1890ff' : '#d9d9d9',
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>
                      {isCompleted ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : isRunning ? (
                        <SyncOutlined spin style={{ color: '#1890ff' }} />
                      ) : isSkipped ? (
                        <CloseCircleOutlined style={{ color: '#999' }} />
                      ) : (
                        <ClockCircleOutlined style={{ color: '#999' }} />
                      )}
                    </div>
                    <Tag color={getStatusColor(node.status)}>
                      {isCompleted ? '已完成' : isRunning ? '进行中' : isSkipped ? '已跳过' : '待处理'}
                    </Tag>
                  </div>

                  {node.assigneeName && (
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <UserOutlined /> {node.assigneeName}
                    </div>
                  )}

                  {node.tasks && node.tasks.map(task => (
                    <div key={task.id} style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                      {task.assigneeName}
                      {task.result && (
                        <span style={{ marginLeft: 8 }}>
                          <Tag color={task.result === 'APPROVED' ? 'success' : 'error'}>
                            {task.result === 'APPROVED' ? '通过' : '驳回'}
                          </Tag>
                        </span>
                      )}
                    </div>
                  ))}

                  {node.startTime && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                      {formatDate(node.startTime)}
                      {node.endTime && (
                        <span> - {formatDate(node.endTime)}</span>
                      )}
                    </div>
                  )}
                </ProCard>
              </Col>
            );
          })}
        </Row>

        <div style={{ marginTop: 24, textAlign: 'center', color: '#999' }}>
          提示：流程图展示了各节点的执行状态和进度
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    if (!progress.length) return <div style={{ textAlign: 'center', color: '#999' }}>暂无审批记录</div>;

    return (
      <Timeline mode="left">
        {progress.map((node) => {
          const completedTasks = node.tasks?.filter(t => t.status === 'COMPLETED') || [];
          const pendingTasks = node.tasks?.filter(t => t.status === 'PENDING') || [];

          return (
            <Timeline.Item
              key={node.nodeId}
              color={node.status === 'COMPLETED' ? 'green' : node.status === 'RUNNING' ? 'blue' : 'gray'}
              dot={node.status === 'RUNNING' ? <SyncOutlined spin /> : undefined}
            >
              <div style={{ marginBottom: 12 }}>
                <strong>{node.nodeName}</strong>
                <Tag color={node.status === 'COMPLETED' ? 'success' : 'default'} style={{ marginLeft: 8 }}>
                  {node.status === 'COMPLETED' ? '已完成' : node.status === 'RUNNING' ? '进行中' : '待处理'}
                </Tag>
              </div>

              {completedTasks.map(task => (
                <div key={task.id} style={{ marginBottom: 8, paddingLeft: 24 }}>
                  <Space>
                    <UserOutlined />
                    <span>{task.assigneeName}</span>
                    <Tag color={task.result === 'APPROVED' ? 'success' : 'error'}>
                      {task.result === 'APPROVED' ? '通过' : '驳回'}
                    </Tag>
                    {task.comment && <span style={{ color: '#666' }}>{task.comment}</span>}
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {task.completedAt && formatDate(task.completedAt)}
                    </span>
                  </Space>
                </div>
              ))}

              {pendingTasks.map(task => (
                <div key={task.id} style={{ marginBottom: 8, paddingLeft: 24, color: '#999' }}>
                  <Space>
                    <UserOutlined />
                    <span>{task.assigneeName}（待处理）</span>
                  </Space>
                </div>
              ))}
            </Timeline.Item>
          );
        })}
      </Timeline>
    );
  };

  if (!instance && !instanceLoading) {
    return (
      <PageContainer title="流程详情">
        <ProCard>
          <div style={{ textAlign: 'center', padding: 40 }}>流程实例不存在</div>
        </ProCard>
      </PageContainer>
    );
  }

  const tabItems = [
    { key: 'graph', label: '流程图', children: renderFlowGraph() },
    { key: 'timeline', label: '审批记录', children: renderTimeline() },
  ];

  return (
    <PageContainer
      title="流程详情"
      loading={instanceLoading}
      extra={
        <Space>
          {myPendingTask && instance?.status === 'RUNNING' && (
            <>
              <PermissionButton
                permission={WORKFLOW.TASK.APPROVE}
                type="primary"
                onClick={() => setApproveModalOpen(true)}
              >
                审批通过
              </PermissionButton>
              <PermissionButton
                permission={WORKFLOW.TASK.REJECT}
                danger
                onClick={() => setRejectModalOpen(true)}
              >
                驳回
              </PermissionButton>
            </>
          )}
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
        </Space>
      }
    >
      <ProCard title="基本信息" headerBordered style={{ marginBottom: 24 }}>
        <ProDescriptions column={2}>
          <ProDescriptions.Item label="流程编号">
            {instance?.instanceNo}
          </ProDescriptions.Item>
          <ProDescriptions.Item label="流程标题">
            {instance?.title}
          </ProDescriptions.Item>
          <ProDescriptions.Item label="流程定义">
            {instance?.flowDefinition?.name} (v{instance?.flowDefinition?.version})
          </ProDescriptions.Item>
          <ProDescriptions.Item label="发起人">
            {instance?.initiator?.name} {instance?.initiator?.deptName && `(${instance.initiator.deptName})`}
          </ProDescriptions.Item>
          <ProDescriptions.Item label="状态">
            {instance && (
              <Tag color={getStatusColor(instance.status)}>
                {getStatusText(instance.status)}
              </Tag>
            )}
          </ProDescriptions.Item>
          <ProDescriptions.Item label="当前节点">
            {instance?.currentNodeName || '-'}
          </ProDescriptions.Item>
          {instance?.status === 'RUNNING' && pendingTasksData?.list && pendingTasksData.list.length > 0 && (
            <ProDescriptions.Item label="当前审批人">
              {pendingTasksData.list.map((task) => task.assignee?.name || task.assigneeName).filter(Boolean).join('、') || '-'}
            </ProDescriptions.Item>
          )}
          <ProDescriptions.Item label="发起时间">
            {formatDate(instance?.startTime)}
          </ProDescriptions.Item>
          <ProDescriptions.Item label="结束时间">
            {instance?.endTime ? formatDate(instance.endTime) : '-'}
          </ProDescriptions.Item>
          {instance?.duration && (
            <ProDescriptions.Item label="耗时">
              {Math.floor(instance.duration / 60)}分{instance.duration % 60}秒
            </ProDescriptions.Item>
          )}
          {instance?.businessNo && (
            <ProDescriptions.Item label="业务编号">
              {instance.businessNo}
            </ProDescriptions.Item>
          )}
          {instance?.remark && (
            <ProDescriptions.Item label="备注" span={2}>
              {instance.remark}
            </ProDescriptions.Item>
          )}
        </ProDescriptions>

        {instance?.status === 'RUNNING' && instance.initiatorId === userInfo?.id && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button danger onClick={handleCancel} loading={cancelMutation.isPending}>
              撤回流程
            </Button>
          </div>
        )}
      </ProCard>

      <ProCard title="流程进度" headerBordered>
        <Tabs defaultActiveKey="graph" items={tabItems} />
      </ProCard>

      {/* 审批通过弹窗 */}
      <ModalForm
        title="审批通过"
        open={approveModalOpen}
        onOpenChange={setApproveModalOpen}
        width={500}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          if (!myPendingTask) return false;
          await approveMutation.mutateAsync({
            taskId: myPendingTask.id,
            comment: values.comment,
          });
          return true;
        }}
      >
        <ProFormTextArea
          name="comment"
          label="审批意见"
          placeholder="请输入审批意见（选填）"
          fieldProps={{ rows: 4 }}
        />
      </ModalForm>

      {/* 驳回弹窗 */}
      <ModalForm
        title="驳回"
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        width={500}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          if (!myPendingTask) return false;
          await rejectMutation.mutateAsync({
            taskId: myPendingTask.id,
            comment: values.comment,
          });
          return true;
        }}
      >
        <ProFormTextArea
          name="comment"
          label="驳回原因"
          placeholder="请输入驳回原因"
          rules={[{ required: true, message: '请输入驳回原因' }]}
          fieldProps={{ rows: 4 }}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default FlowInstanceDetail;
