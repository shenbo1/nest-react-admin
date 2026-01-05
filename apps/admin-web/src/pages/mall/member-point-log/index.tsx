import { useRef, useState } from 'react';
import { message, Space, Tag, Avatar } from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormSelect,
  ProFormDigit,
  ProFormTextArea,
  ProFormRadio,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  memberPointLogApi,
  MemberPointLog,
  CreateMemberPointLogDto,
  PointChangeType,
} from '@/services/mall/member-point-log';
import { memberApi } from '@/services/mall/member';
import { PermissionButton } from '@/components/PermissionButton';
import { MEMBER } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import dayjs from 'dayjs';

const pointTypeOptions: { label: string; value: PointChangeType }[] = [
  { label: '获取', value: 'EARN' },
  { label: '使用', value: 'USE' },
  { label: '退款', value: 'REFUND' },
  { label: '调整', value: 'ADJUST' },
];

const pointTypeMap: Record<PointChangeType, { text: string; color: string }> = {
  EARN: { text: '获取', color: 'success' },
  USE: { text: '使用', color: 'warning' },
  REFUND: { text: '退款', color: 'processing' },
  ADJUST: { text: '调整', color: 'default' },
};

export default function MemberPointLogPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 获取会员列表用于选择
  const { data: memberOptions = [] } = useQuery({
    queryKey: ['memberOptionsForPointLog'],
    queryFn: async () => {
      const res = await memberApi.list({ pageSize: 1000 });
      return res.data.map((m) => ({
        label: `${m.nickname || m.username} (积分: ${m.points || 0})`,
        value: m.id,
      }));
    },
  });

  // 调整积分
  const adjustMutation = useMutation({
    mutationFn: memberPointLogApi.adjust,
    onSuccess: () => {
      message.success('积分调整成功');
      setModalOpen(false);
      actionRef.current?.reload();
    },
  });

  const columns: ProColumns<MemberPointLog>[] = [
    {
      title: '会员',
      dataIndex: 'memberId',
      width: 200,
      valueType: 'select',
      fieldProps: {
        options: memberOptions,
        showSearch: true,
        placeholder: '请选择会员',
      },
      render: (_, record) => (
        <Space>
          <Avatar
            size="small"
            src={record.member?.avatar}
            icon={<UserOutlined />}
          />
          <div>
            <div>{record.member?.nickname || record.member?.username || '-'}</div>
            <div style={{ fontSize: 12, color: '#999' }}>
              <GiftOutlined style={{ marginRight: 4 }} />
              当前积分: {record.member?.points || 0}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '变动类型',
      dataIndex: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: {
        EARN: { text: '获取', status: 'Success' },
        USE: { text: '使用', status: 'Warning' },
        REFUND: { text: '退款', status: 'Processing' },
        ADJUST: { text: '调整', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={pointTypeMap[record.type]?.color}>
          {pointTypeMap[record.type]?.text}
        </Tag>
      ),
    },
    {
      title: '变动积分',
      dataIndex: 'points',
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        const isPositive = record.points >= 0;
        return (
          <span style={{ color: isPositive ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
            {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {isPositive ? '+' : ''}
            {record.points}
          </span>
        );
      },
    },
    {
      title: '变动前积分',
      dataIndex: 'beforePoints',
      width: 110,
      hideInSearch: true,
    },
    {
      title: '变动后积分',
      dataIndex: 'afterPoints',
      width: 110,
      hideInSearch: true,
      render: (_, record) => (
        <span style={{ fontWeight: 500 }}>{record.afterPoints}</span>
      ),
    },
    {
      title: '关联订单',
      dataIndex: 'orderId',
      width: 100,
      hideInSearch: true,
      render: (text) => text || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 200,
      hideInSearch: true,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      valueType: 'dateTimeRange',
      search: {
        transform: (value) => ({
          startTime: value?.[0],
          endTime: value?.[1],
        }),
      },
      render: (_, record) =>
        record.createdAt
          ? dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')
          : '-',
    },
  ];

  return (
    <>
      <ProTable
        headerTitle="会员积分流水"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1200 }}
        api="/mall/member-point-log"
        toolBarRender={() => [
          <PermissionButton
            key="adjust"
            permission={MEMBER.POINT_LOG.ADJUST}
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            调整积分
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ModalForm<CreateMemberPointLogDto>
        title="调整会员积分"
        open={modalOpen}
        onOpenChange={setModalOpen}
        width={500}
        initialValues={{
          type: 'ADJUST',
        }}
        onFinish={async (values) => {
          await adjustMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
        }}
      >
        <ProFormSelect
          name="memberId"
          label="选择会员"
          placeholder="请选择会员"
          rules={[{ required: true, message: '请选择会员' }]}
          options={memberOptions}
          fieldProps={{
            showSearch: true,
            optionFilterProp: 'label',
          }}
        />
        <ProFormRadio.Group
          name="type"
          label="变动类型"
          options={pointTypeOptions}
          rules={[{ required: true, message: '请选择变动类型' }]}
        />
        <ProFormDigit
          name="points"
          label="变动积分"
          placeholder="正数增加，负数减少"
          rules={[{ required: true, message: '请输入变动积分' }]}
          fieldProps={{
            precision: 0,
            style: { width: '100%' },
          }}
          extra="正数为增加积分，负数为减少积分"
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注信息"
          fieldProps={{
            autoSize: { minRows: 2, maxRows: 4 },
          }}
        />
      </ModalForm>
    </>
  );
}
