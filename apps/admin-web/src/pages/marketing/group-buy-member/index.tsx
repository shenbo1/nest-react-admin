import { useRef } from 'react';
import { Tag, Card, Statistic, Row, Col } from 'antd';
import {
  CrownOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import ProTable, { ProTableRef } from '@/components/ProTable';
import type { ProColumns } from '@ant-design/pro-components';
import {
  groupBuyMemberApi,
  GroupBuyMember,
  GroupBuyPayStatus,
  GroupBuyMemberStats,
} from '@/services/marketing/group-buy-member';

// 支付状态颜色映射
const payStatusColorMap: Record<GroupBuyPayStatus, string> = {
  UNPAID: 'warning',
  PAID: 'success',
  REFUNDED: 'default',
};

// 支付状态中文映射
const payStatusLabelMap: Record<GroupBuyPayStatus, string> = {
  UNPAID: '未支付',
  PAID: '已支付',
  REFUNDED: '已退款',
};

const GroupBuyMemberList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);

  // 获取统计数据
  const { data: stats } = useQuery<GroupBuyMemberStats>({
    queryKey: ['group-buy-member-stats'],
    queryFn: groupBuyMemberApi.getStats,
  });

  // 表格列
  const columns: ProColumns<GroupBuyMember>[] = [
    {
      title: '团单号',
      dataIndex: ['groupOrder', 'groupNo'],
      width: 180,
      hideInSearch: true,
    },
    {
      title: '团单ID',
      dataIndex: 'groupOrderId',
      width: 100,
    },
    {
      title: '会员ID',
      dataIndex: 'memberId',
      width: 100,
    },
    {
      title: '身份',
      dataIndex: 'isLeader',
      width: 100,
      valueType: 'select',
      valueEnum: {
        true: { text: '团长' },
        false: { text: '团员' },
      },
      render: (_: any, record: GroupBuyMember) => (
        record.isLeader ? (
          <Tag color="gold" icon={<CrownOutlined />}>团长</Tag>
        ) : (
          <Tag>团员</Tag>
        )
      ),
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      hideInSearch: true,
      render: (_: any, record: GroupBuyMember) => record.orderNo || '-',
    },
    {
      title: '支付状态',
      dataIndex: 'payStatus',
      width: 100,
      valueType: 'select',
      valueEnum: {
        UNPAID: { text: '未支付', status: 'Warning' },
        PAID: { text: '已支付', status: 'Success' },
        REFUNDED: { text: '已退款', status: 'Default' },
      },
      render: (_: any, record: GroupBuyMember) => (
        <Tag color={payStatusColorMap[record.payStatus]}>
          {payStatusLabelMap[record.payStatus]}
        </Tag>
      ),
    },
    {
      title: '拼团价',
      dataIndex: ['groupOrder', 'groupPrice'],
      width: 100,
      hideInSearch: true,
      render: (_: any, record: GroupBuyMember) =>
        record.groupOrder ? (
          <span style={{ color: '#ff4d4f' }}>
            ¥{Number(record.groupOrder.groupPrice).toFixed(2)}
          </span>
        ) : '-',
    },
    {
      title: '团单状态',
      dataIndex: ['groupOrder', 'status'],
      width: 100,
      hideInSearch: true,
      render: (_: any, record: GroupBuyMember) => {
        if (!record.groupOrder) return '-';
        const statusMap: Record<string, { color: string; text: string }> = {
          WAITING: { color: 'processing', text: '待成团' },
          SUCCESS: { color: 'success', text: '已成团' },
          FAILED: { color: 'error', text: '失败' },
          CANCELLED: { color: 'default', text: '已取消' },
        };
        const status = statusMap[record.groupOrder.status] || { color: 'default', text: record.groupOrder.status };
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '参团时间',
      dataIndex: 'joinTime',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_: any, record: GroupBuyMember) => dayjs(record.joinTime).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '支付时间',
      dataIndex: 'payTime',
      width: 160,
      hideInSearch: true,
      render: (_: any, record: GroupBuyMember) =>
        record.payTime ? dayjs(record.payTime).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '退款时间',
      dataIndex: 'refundTime',
      width: 160,
      hideInSearch: true,
      render: (_: any, record: GroupBuyMember) =>
        record.refundTime ? dayjs(record.refundTime).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '退款原因',
      dataIndex: 'refundReason',
      width: 150,
      hideInSearch: true,
      ellipsis: true,
      render: (_: any, record: GroupBuyMember) => record.refundReason || '-',
    },
  ];

  // 获取数据
  const fetchData = async (params: any) => {
    const { current, pageSize, ...rest } = params;
    const result = await groupBuyMemberApi.list({
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
                title="团长数"
                value={stats.leaders}
                prefix={<CrownOutlined style={{ color: '#faad14' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="未支付"
                value={stats.unpaid}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已支付"
                value={stats.paid}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已退款"
                value={stats.refunded}
                valueStyle={{ color: '#999' }}
              />
            </Col>
            <Col span={4}>
              <Statistic title="总参团人次" value={stats.total} />
            </Col>
            <Col span={4}>
              <Statistic
                title="支付率"
                value={stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}
                suffix="%"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      <ProTable
        ref={tableRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1600 }}
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

export default GroupBuyMemberList;
