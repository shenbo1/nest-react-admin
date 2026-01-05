import { useRef } from 'react';
import { Space, Popconfirm, Tag, message, Card, Statistic, Row, Col, Progress } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import ProTable, { ProTableRef } from '@/components/ProTable';
import type { ProColumns } from '@ant-design/pro-components';
import PermissionButton from '@/components/PermissionButton';
import { MARKETING } from '@/constants/permissions';
import {
  groupBuyOrderApi,
  GroupBuyOrder,
  GroupBuyOrderStatus,
  GroupBuyOrderStats,
} from '@/services/marketing/group-buy-order';

// 状态颜色映射
const statusColorMap: Record<GroupBuyOrderStatus, string> = {
  WAITING: 'processing',
  SUCCESS: 'success',
  FAILED: 'error',
  CANCELLED: 'default',
};

// 状态中文映射
const statusLabelMap: Record<GroupBuyOrderStatus, string> = {
  WAITING: '待成团',
  SUCCESS: '已成团',
  FAILED: '拼团失败',
  CANCELLED: '已取消',
};

// 格式化剩余时间
const formatRemainingTime = (ms: number) => {
  if (ms <= 0) return '已过期';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}天${hours % 24}小时`;
  }
  return `${hours}小时${minutes}分钟`;
};

const GroupBuyOrderList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);
  const queryClient = useQueryClient();

  // 获取统计数据
  const { data: stats } = useQuery<GroupBuyOrderStats>({
    queryKey: ['group-buy-order-stats'],
    queryFn: groupBuyOrderApi.getStats,
  });

  // 取消拼团
  const cancelMutation = useMutation({
    mutationFn: groupBuyOrderApi.cancel,
    onSuccess: () => {
      message.success('取消成功');
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['group-buy-order-stats'] });
    },
  });

  // 手动成团
  const finishMutation = useMutation({
    mutationFn: groupBuyOrderApi.manualFinish,
    onSuccess: () => {
      message.success('手动成团成功');
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['group-buy-order-stats'] });
    },
  });

  // 表格列
  const columns: ProColumns<GroupBuyOrder>[] = [
    {
      title: '团单号',
      dataIndex: 'groupNo',
      width: 180,
      fixed: 'left',
    },
    {
      title: '活动名称',
      dataIndex: ['promotion', 'name'],
      width: 150,
      hideInSearch: true,
    },
    {
      title: '商品ID',
      dataIndex: 'productId',
      width: 100,
    },
    {
      title: '拼团价',
      dataIndex: 'groupPrice',
      width: 100,
      hideInSearch: true,
      render: (_: any, record: GroupBuyOrder) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ¥{Number(record.groupPrice).toFixed(2)}
        </span>
      ),
    },
    {
      title: '成团进度',
      dataIndex: 'progress',
      width: 150,
      hideInSearch: true,
      render: (_: any, record: GroupBuyOrder) => (
        <div>
          <Progress
            percent={record.progress || 0}
            size="small"
            format={() => `${record.currentCount}/${record.requiredCount}`}
          />
        </div>
      ),
    },
    {
      title: '已支付人数',
      dataIndex: 'paidCount',
      width: 100,
      hideInSearch: true,
      render: (_: any, record: GroupBuyOrder) => (
        <Tag color={record.paidCount === record.currentCount ? 'green' : 'orange'}>
          {record.paidCount}/{record.currentCount}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        WAITING: { text: '待成团', status: 'Processing' },
        SUCCESS: { text: '已成团', status: 'Success' },
        FAILED: { text: '拼团失败', status: 'Error' },
        CANCELLED: { text: '已取消', status: 'Default' },
      },
      render: (_: any, record: GroupBuyOrder) => (
        <Tag color={statusColorMap[record.status]}>
          {statusLabelMap[record.status]}
        </Tag>
      ),
    },
    {
      title: '剩余时间',
      dataIndex: 'remainingTime',
      width: 120,
      hideInSearch: true,
      render: (_: any, record: GroupBuyOrder) => {
        if (record.status !== 'WAITING') return '-';
        return (
          <span style={{ color: (record.remainingTime || 0) < 3600000 ? '#ff4d4f' : 'inherit' }}>
            {formatRemainingTime(record.remainingTime || 0)}
          </span>
        );
      },
    },
    {
      title: '开团时间',
      dataIndex: 'startTime',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_: any, record: GroupBuyOrder) => dayjs(record.startTime).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '截止时间',
      dataIndex: 'expireTime',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_: any, record: GroupBuyOrder) => dayjs(record.expireTime).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '成团时间',
      dataIndex: 'successTime',
      width: 160,
      hideInSearch: true,
      render: (_: any, record: GroupBuyOrder) =>
        record.successTime ? dayjs(record.successTime).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_: any, record: GroupBuyOrder) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          {record.status === 'WAITING' && (
            <>
              <Popconfirm
                title="确定手动成团吗？"
                description="将直接完成该拼团，无论人数是否满足"
                onConfirm={() => finishMutation.mutate(record.id)}
              >
                <PermissionButton
                  type="link"
                  size="small"
                  permission={MARKETING.GROUP_BUY_ORDER.MANUAL_FINISH}
                  icon={<CheckCircleOutlined />}
                  fallbackMode="disabled"
                >
                  手动成团
                </PermissionButton>
              </Popconfirm>
              <Popconfirm
                title="确定取消该拼团吗？"
                onConfirm={() => cancelMutation.mutate(record.id)}
              >
                <PermissionButton
                  type="link"
                  size="small"
                  danger
                  permission={MARKETING.GROUP_BUY_ORDER.CANCEL}
                  icon={<CloseCircleOutlined />}
                  fallbackMode="disabled"
                >
                  取消
                </PermissionButton>
              </Popconfirm>
            </>
          )}
          {record.status === 'FAILED' && record.failReason && (
            <span style={{ color: '#999' }}>{record.failReason}</span>
          )}
        </Space>
      ),
    },
  ];

  // 获取数据
  const fetchData = async (params: any) => {
    const { current, pageSize, ...rest } = params;
    const result = await groupBuyOrderApi.list({
      page: current,
      pageSize,
      ...rest,
    });
    return {
      data: result.data,
      total: result.total,
      success: true,
    };
  };

  return (
    <>
      {/* 统计卡片 */}
      {stats && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="待成团"
                value={stats.waiting}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已成团"
                value={stats.success}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="拼团失败"
                value={stats.failed}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已取消"
                value={stats.cancelled}
                valueStyle={{ color: '#999' }}
              />
            </Col>
            <Col span={4}>
              <Statistic title="总计" value={stats.total} />
            </Col>
            <Col span={4}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 8 }}>成团率</div>
                <Progress
                  type="circle"
                  percent={stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}
                  size={60}
                />
              </div>
            </Col>
          </Row>
        </Card>
      )}

      <ProTable
        ref={tableRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1800 }}
        request={fetchData}
        search={{ labelWidth: 'auto' }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }}
      />
    </>
  );
};

export default GroupBuyOrderList;
