import { useRef, useState } from 'react';
import { message, Space, Tag, Avatar } from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
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
  memberBalanceLogApi,
  MemberBalanceLog,
  CreateMemberBalanceLogDto,
  BalanceChangeType,
} from '@/services/mall/member-balance-log';
import { memberApi } from '@/services/mall/member';
import { PermissionButton } from '@/components/PermissionButton';
import { MEMBER } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import dayjs from 'dayjs';

const balanceTypeOptions: { label: string; value: BalanceChangeType }[] = [
  { label: '充值', value: 'RECHARGE' },
  { label: '消费', value: 'CONSUME' },
  { label: '退款', value: 'REFUND' },
  { label: '调整', value: 'ADJUST' },
];

const balanceTypeMap: Record<BalanceChangeType, { text: string; color: string }> = {
  RECHARGE: { text: '充值', color: 'success' },
  CONSUME: { text: '消费', color: 'warning' },
  REFUND: { text: '退款', color: 'processing' },
  ADJUST: { text: '调整', color: 'default' },
};

export default function MemberBalanceLogPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 获取会员列表用于选择
  const { data: memberOptions = [] } = useQuery({
    queryKey: ['memberOptionsForBalanceLog'],
    queryFn: async () => {
      const res = await memberApi.list({ pageSize: 1000 });
      return res.data.map((m) => ({
        label: `${m.nickname || m.username} (余额: ¥${m.balance || 0})`,
        value: m.id,
      }));
    },
  });

  // 调整余额
  const adjustMutation = useMutation({
    mutationFn: memberBalanceLogApi.adjust,
    onSuccess: () => {
      message.success('余额调整成功');
      setModalOpen(false);
      actionRef.current?.reload();
    },
  });

  const columns: ProColumns<MemberBalanceLog>[] = [
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
              当前余额: ¥{record.member?.balance || 0}
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
        RECHARGE: { text: '充值', status: 'Success' },
        CONSUME: { text: '消费', status: 'Warning' },
        REFUND: { text: '退款', status: 'Processing' },
        ADJUST: { text: '调整', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={balanceTypeMap[record.type]?.color}>
          {balanceTypeMap[record.type]?.text}
        </Tag>
      ),
    },
    {
      title: '变动金额',
      dataIndex: 'amount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        const isPositive = Number(record.amount) >= 0;
        return (
          <span style={{ color: isPositive ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
            {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {isPositive ? '+' : ''}
            ¥{Number(record.amount).toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '变动前余额',
      dataIndex: 'beforeAmount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => `¥${Number(record.beforeAmount).toFixed(2)}`,
    },
    {
      title: '变动后余额',
      dataIndex: 'afterAmount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <span style={{ fontWeight: 500 }}>
          ¥{Number(record.afterAmount).toFixed(2)}
        </span>
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
        headerTitle="会员余额流水"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1200 }}
        api="/mall/member-balance-log"
        toolBarRender={() => [
          <PermissionButton
            key="adjust"
            permission={MEMBER.BALANCE_LOG.ADJUST}
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            调整余额
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ModalForm<CreateMemberBalanceLogDto>
        title="调整会员余额"
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
          options={balanceTypeOptions}
          rules={[{ required: true, message: '请选择变动类型' }]}
        />
        <ProFormDigit
          name="amount"
          label="变动金额"
          placeholder="正数增加，负数减少"
          rules={[{ required: true, message: '请输入变动金额' }]}
          fieldProps={{
            precision: 2,
            prefix: '¥',
            style: { width: '100%' },
          }}
          extra="正数为增加余额，负数为减少余额"
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
