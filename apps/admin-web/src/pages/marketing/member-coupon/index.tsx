import { useRef, useState } from 'react';
import { message, Modal, Space, Tag } from 'antd';
import {
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormDigit,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { memberCouponApi, MemberCoupon } from '@/services/marketing/member-coupon';
import { PermissionButton } from '@/components/PermissionButton';
import { MARKETING } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';

export default function MemberCouponPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MemberCoupon | null>(null);

  // 禁用优惠券
  const disableMutation = useMutation({
    mutationFn: memberCouponApi.disable,
    onSuccess: () => {
      message.success('优惠券已禁用');
      actionRef.current?.reload();
    },
  });

  // 核销优惠券
  const useCouponMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { orderId?: number; orderNo?: string; discountAmount?: number };
    }) => memberCouponApi.use(id, data),
    onSuccess: () => {
      message.success('优惠券核销成功');
      setModalOpen(false);
      setEditingRecord(null);
      actionRef.current?.reload();
    },
  });

  const handleDisable = (record: MemberCoupon) => {
    Modal.confirm({
      title: '确认禁用',
      content: '确定要禁用这张优惠券吗？禁用后用户将无法使用。',
      onOk: () => disableMutation.mutate(record.id),
    });
  };

  const handleUse = (record: MemberCoupon) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const statusEnums = {
    UNUSED: { text: '未使用', status: 'Processing' },
    USED: { text: '已使用', status: 'Success' },
    EXPIRED: { text: '已过期', status: 'Default' },
    FROZEN: { text: '已冻结', status: 'Error' },
  };

  const sourceEnums = {
    USER_CLAIM: { text: '用户领取', status: 'Processing' },
    SYSTEM_GRANT: { text: '系统发放', status: 'Success' },
    REGISTER: { text: '注册赠送', status: 'Success' },
    FIRST_ORDER: { text: '首单赠送', status: 'Success' },
    ACTIVITY: { text: '活动赠送', status: 'Success' },
  };

  const columns: ProColumns<MemberCoupon>[] = [
    {
      title: '优惠券码',
      dataIndex: 'couponCode',
      width: 160,
      render: (text) => <code style={{ color: '#faad14' }}>{text}</code>,
    },
    {
      title: '优惠券名称',
      dataIndex: ['template', 'name'],
      width: 180,
      render: (_, record) => record.template?.name || '-',
    },
    {
      title: '优惠内容',
      width: 150,
      render: (_, record) => {
        if (!record.template) return '-';
        const { type, value, minAmount } = record.template;
        if (type === 'FULL_REDUCTION') {
          return <span>满{minAmount || 0}减{value}</span>;
        }
        if (type === 'DISCOUNT') {
          return <span>{value}折</span>;
        }
        return <span>减{value}</span>;
      },
    },
    {
      title: '用户信息',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.member?.nickname || '未知'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.member?.phone || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 120,
      valueEnum: sourceEnums,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: statusEnums,
      render: (_, record) => {
        const config = statusEnums[record.status as keyof typeof statusEnums];
        if (!config) return <Tag>{record.status}</Tag>;
        return <Tag color={config.status === 'Success' ? 'green' : config.status === 'Error' ? 'red' : config.status === 'Processing' ? 'blue' : 'default'}>{config.text}</Tag>;
      },
    },
    {
      title: '领取时间',
      dataIndex: 'receiveTime',
      width: 180,
      valueType: 'dateTime',
    },
    {
      title: '有效期至',
      dataIndex: 'validEndTime',
      width: 180,
      render: (text) => (text ? new Date(text as string).toLocaleString() : '永久'),
    },
    {
      title: '使用时间',
      dataIndex: 'useTime',
      width: 180,
      render: (text) => (text ? new Date(text as string).toLocaleString() : '-'),
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      render: (text) => text || '-',
    },
    {
      title: '优惠金额',
      dataIndex: 'discountAmount',
      width: 100,
      render: (text) => (text ? `¥${Number(text).toFixed(2)}` : '-'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          {record.status === 'UNUSED' && (
            <>
              <PermissionButton
                permission={MARKETING.MEMBER_COUPON.USE}
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleUse(record)}
              >
                核销
              </PermissionButton>
              <PermissionButton
                permission={MARKETING.MEMBER_COUPON.DISABLE}
                type="link"
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => handleDisable(record)}
              >
                禁用
              </PermissionButton>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable
        headerTitle="用户优惠券管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1600 }}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          const result = await memberCouponApi.list({
            page: current,
            pageSize,
            ...rest,
          });
          return {
            data: result.data,
            total: result.total,
            success: true,
          };
        }}
        toolBarRender={() => []}
      />

      <ModalForm
        title="核销优惠券"
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditingRecord(null);
          }
        }}
        width={400}
        onFinish={async (values) => {
          if (!editingRecord) return true;
          await useCouponMutation.mutateAsync({
            id: editingRecord.id,
            data: {
              discountAmount: values.discountAmount,
            },
          });
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <p>优惠券：{editingRecord?.template?.name}</p>
          <p>优惠券码：<code>{editingRecord?.couponCode}</code></p>
        </div>

        <ProFormDigit
          name="discountAmount"
          label="实际优惠金额"
          placeholder="请输入实际优惠金额"
          min={0}
          fieldProps={{ precision: 2 }}
        />
      </ModalForm>
    </>
  );
}
