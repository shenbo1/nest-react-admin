import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Card, Statistic, Row, Col, Descriptions, Image } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  pointExchangeApi,
  PointExchangeRecord,
  ShipForm,
} from '@/services/marketing/point-exchange';
import { PermissionButton } from '@/components/PermissionButton';
import { MARKETING } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import dayjs from 'dayjs';

// 商品类型枚举
const productTypeEnums: Record<string, { text: string; color: string }> = {
  PHYSICAL: { text: '实物商品', color: 'blue' },
  VIRTUAL: { text: '虚拟商品', color: 'purple' },
  COUPON: { text: '优惠券', color: 'orange' },
};

// 状态枚举
const statusEnums: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待发货', color: 'warning' },
  SHIPPED: { text: '已发货', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  CANCELLED: { text: '已取消', color: 'default' },
};

export default function PointExchangePage() {
  const actionRef = useRef<ProTableRef>(null);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<PointExchangeRecord | null>(null);
  const queryClient = useQueryClient();

  // 获取统计数据
  const { data: stats } = useQuery({
    queryKey: ['pointExchangeStats'],
    queryFn: pointExchangeApi.getStats,
  });

  // 发货
  const shipMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShipForm }) =>
      pointExchangeApi.ship(id, data),
    onSuccess: () => {
      message.success('发货成功');
      setShipModalOpen(false);
      setCurrentRecord(null);
      queryClient.invalidateQueries({ queryKey: ['pointExchangeStats'] });
      actionRef.current?.reload();
    },
  });

  // 完成
  const completeMutation = useMutation({
    mutationFn: pointExchangeApi.complete,
    onSuccess: () => {
      message.success('已完成');
      queryClient.invalidateQueries({ queryKey: ['pointExchangeStats'] });
      actionRef.current?.reload();
    },
  });

  // 取消
  const cancelMutation = useMutation({
    mutationFn: pointExchangeApi.cancel,
    onSuccess: () => {
      message.success('已取消');
      queryClient.invalidateQueries({ queryKey: ['pointExchangeStats'] });
      actionRef.current?.reload();
    },
  });

  const handleShip = (record: PointExchangeRecord) => {
    setCurrentRecord(record);
    setShipModalOpen(true);
  };

  const handleComplete = (record: PointExchangeRecord) => {
    Modal.confirm({
      title: '确认完成',
      content: `确定要完成兑换单「${record.exchangeNo}」吗？`,
      onOk: () => completeMutation.mutate(record.id),
    });
  };

  const handleCancel = (record: PointExchangeRecord) => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消兑换单「${record.exchangeNo}」吗？取消后积分将退还给用户。`,
      okType: 'danger',
      onOk: () => cancelMutation.mutate(record.id),
    });
  };

  const handleViewDetail = (record: PointExchangeRecord) => {
    setCurrentRecord(record);
    setDetailModalOpen(true);
  };

  const columns: ProColumns<PointExchangeRecord>[] = [
    {
      title: '兑换单号',
      dataIndex: 'exchangeNo',
      width: 180,
      render: (text) => <code>{text}</code>,
    },
    {
      title: '商品信息',
      width: 200,
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          {record.pointProduct?.image && (
            <Image
              src={record.pointProduct.image}
              width={40}
              height={40}
              style={{ objectFit: 'cover', borderRadius: 4 }}
            />
          )}
          <div>
            <div>{record.productName}</div>
            <Tag color={productTypeEnums[record.productType]?.color} style={{ marginTop: 2 }}>
              {productTypeEnums[record.productType]?.text}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      hideInTable: true,
    },
    {
      title: '商品类型',
      dataIndex: 'productType',
      width: 100,
      hideInTable: true,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(productTypeEnums).map(([k, v]) => [k, { text: v.text }])
      ),
    },
    {
      title: '会员ID',
      dataIndex: 'memberId',
      width: 100,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '消耗积分',
      dataIndex: 'points',
      width: 100,
      hideInSearch: true,
      render: (_, record) => (
        <span>
          <Tag color="blue">{record.points}</Tag>
          {record.price && Number(record.price) > 0 && (
            <span style={{ marginLeft: 4 }}>+ ¥{Number(record.price).toFixed(2)}</span>
          )}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(statusEnums).map(([k, v]) => [k, { text: v.text }])
      ),
      render: (_, record) => (
        <Tag color={statusEnums[record.status]?.color}>
          {statusEnums[record.status]?.text}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      hideInSearch: true,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            permission={MARKETING.POINT_EXCHANGE.QUERY}
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </PermissionButton>
          {record.productType === 'PHYSICAL' && record.status === 'PENDING' && (
            <PermissionButton
              permission={MARKETING.POINT_EXCHANGE.SHIP}
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleShip(record)}
            >
              发货
            </PermissionButton>
          )}
          {(record.status === 'SHIPPED' || (record.productType !== 'PHYSICAL' && record.status === 'PENDING')) && (
            <PermissionButton
              permission={MARKETING.POINT_EXCHANGE.COMPLETE}
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record)}
            >
              完成
            </PermissionButton>
          )}
          {(record.status === 'PENDING' || record.status === 'SHIPPED') && (
            <PermissionButton
              permission={MARKETING.POINT_EXCHANGE.CANCEL}
              type="link"
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => handleCancel(record)}
            >
              取消
            </PermissionButton>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待发货"
              value={stats?.pending || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发货"
              value={stats?.shipped || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats?.completed || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已取消"
              value={stats?.cancelled || 0}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
      </Row>

      <ProTable
        headerTitle="积分兑换记录"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1300 }}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          const result = await pointExchangeApi.list({
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
      />

      {/* 发货弹窗 */}
      <ModalForm<ShipForm>
        title="发货"
        open={shipModalOpen}
        onOpenChange={(open) => {
          setShipModalOpen(open);
          if (!open) {
            setCurrentRecord(null);
          }
        }}
        width={500}
        onFinish={async (values) => {
          if (currentRecord) {
            await shipMutation.mutateAsync({ id: currentRecord.id, data: values });
          }
          return true;
        }}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
      >
        {currentRecord && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="兑换单号">{currentRecord.exchangeNo}</Descriptions.Item>
              <Descriptions.Item label="商品名称">{currentRecord.productName}</Descriptions.Item>
              <Descriptions.Item label="收货人">
                {currentRecord.addressInfo?.name} {currentRecord.addressInfo?.phone}
              </Descriptions.Item>
              <Descriptions.Item label="收货地址">
                {currentRecord.addressInfo?.province}
                {currentRecord.addressInfo?.city}
                {currentRecord.addressInfo?.district}
                {currentRecord.addressInfo?.address}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <ProFormText
          name="expressCompany"
          label="快递公司"
          placeholder="请输入快递公司名称"
          rules={[{ required: true, message: '请输入快递公司' }]}
        />

        <ProFormText
          name="expressNo"
          label="快递单号"
          placeholder="请输入快递单号"
          rules={[{ required: true, message: '请输入快递单号' }]}
        />

        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注（可选）"
        />
      </ModalForm>

      {/* 详情弹窗 */}
      <Modal
        title="兑换详情"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setCurrentRecord(null);
        }}
        footer={null}
        width={600}
      >
        {currentRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="兑换单号" span={2}>
              <code>{currentRecord.exchangeNo}</code>
            </Descriptions.Item>
            <Descriptions.Item label="商品名称">{currentRecord.productName}</Descriptions.Item>
            <Descriptions.Item label="商品类型">
              <Tag color={productTypeEnums[currentRecord.productType]?.color}>
                {productTypeEnums[currentRecord.productType]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="会员ID">{currentRecord.memberId}</Descriptions.Item>
            <Descriptions.Item label="兑换数量">{currentRecord.quantity}</Descriptions.Item>
            <Descriptions.Item label="消耗积分">
              <Tag color="blue">{currentRecord.points}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="支付金额">
              {currentRecord.price ? `¥${Number(currentRecord.price).toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusEnums[currentRecord.status]?.color}>
                {statusEnums[currentRecord.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(currentRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>

            {currentRecord.productType === 'PHYSICAL' && currentRecord.addressInfo && (
              <>
                <Descriptions.Item label="收货人" span={2}>
                  {currentRecord.addressInfo.name} {currentRecord.addressInfo.phone}
                </Descriptions.Item>
                <Descriptions.Item label="收货地址" span={2}>
                  {currentRecord.addressInfo.province}
                  {currentRecord.addressInfo.city}
                  {currentRecord.addressInfo.district}
                  {currentRecord.addressInfo.address}
                </Descriptions.Item>
              </>
            )}

            {currentRecord.shippingInfo && (
              <>
                <Descriptions.Item label="快递公司">
                  {currentRecord.shippingInfo.expressCompany}
                </Descriptions.Item>
                <Descriptions.Item label="快递单号">
                  {currentRecord.shippingInfo.expressNo}
                </Descriptions.Item>
                <Descriptions.Item label="发货时间" span={2}>
                  {currentRecord.shippingInfo.shippedAt
                    ? dayjs(currentRecord.shippingInfo.shippedAt).format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </Descriptions.Item>
              </>
            )}

            {currentRecord.productType === 'VIRTUAL' && currentRecord.virtualContent && (
              <Descriptions.Item label="虚拟内容" span={2}>
                {currentRecord.virtualContent}
              </Descriptions.Item>
            )}

            {currentRecord.remark && (
              <Descriptions.Item label="备注" span={2}>
                {currentRecord.remark}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </>
  );
}
