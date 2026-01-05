import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Switch, Descriptions, Drawer, Card, Typography, Divider } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GiftOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormDateTimeRangePicker,
  ProFormRadio,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { couponTemplateApi, CouponTemplate, CouponTemplateForm } from '@/services/marketing/coupon-template';
import { PermissionButton } from '@/components/PermissionButton';
import { MARKETING } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';

export default function CouponTemplatePage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<CouponTemplate | null>(null);
  const [exampleOpen, setExampleOpen] = useState(false);
  const queryClient = useQueryClient();

  // 示例数据
  const exampleData = [
    {
      title: '满减券示例',
      color: '#1890ff',
      data: {
        name: '新春满减券',
        type: 'FULL_REDUCTION',
        typeText: '满减券',
        value: 20,
        valueText: '20元',
        minAmount: 100,
        minAmountText: '满100元可用',
        maxDiscount: null,
        totalCount: 1000,
        perLimitCount: 1,
        validType: 'DAYS',
        validDays: 30,
        stackable: false,
        description: '新春期间专享满减优惠，满100减20',
      },
    },
    {
      title: '折扣券示例',
      color: '#52c41a',
      data: {
        name: '会员专享8折券',
        type: 'DISCOUNT',
        typeText: '折扣券',
        value: 8,
        valueText: '8折',
        minAmount: 50,
        minAmountText: '满50元可用',
        maxDiscount: 100,
        maxDiscountText: '最高优惠100元',
        totalCount: 500,
        perLimitCount: 2,
        validType: 'FIXED',
        validStartTime: '2026-01-01',
        validEndTime: '2026-03-31',
        stackable: false,
        description: '会员专享折扣，购物满50元享8折优惠',
      },
    },
    {
      title: '无门槛券示例',
      color: '#faad14',
      data: {
        name: '新人专享券',
        type: 'NO_THRESHOLD',
        typeText: '无门槛券',
        value: 10,
        valueText: '10元',
        minAmount: null,
        minAmountText: '无门槛',
        maxDiscount: null,
        totalCount: null,
        totalCountText: '不限量',
        perLimitCount: 1,
        validType: 'DAYS',
        validDays: 7,
        stackable: true,
        description: '新用户注册即送10元无门槛优惠券',
      },
    },
  ];

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: CouponTemplateForm) => {
      if (editingId) {
        return couponTemplateApi.update(editingId, data);
      }
      return couponTemplateApi.create(data);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['couponTemplateList'] });
      actionRef.current?.reload();
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: couponTemplateApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: couponTemplateApi.toggleStatus,
    onSuccess: () => {
      message.success('状态更新成功');
      actionRef.current?.reload();
    },
  });

  // 发放优惠券
  const grantMutation = useMutation({
    mutationFn: ({ id, memberIds }: { id: number; memberIds: number[] }) =>
      couponTemplateApi.grant(id, { memberIds }),
    onSuccess: (res) => {
      message.success(res.message || '优惠券发放成功');
      queryClient.invalidateQueries({ queryKey: ['couponTemplateList'] });
      actionRef.current?.reload();
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个优惠券模板吗？已发放的优惠券不受影响。',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleToggleStatus = (record: any) => {
    Modal.confirm({
      title: '确认切换状态',
      content: `确定要${record.status === 'ENABLED' ? '禁用' : '启用'}「${record.name}」吗？`,
      onOk: () => toggleStatusMutation.mutate(record.id),
    });
  };

  const handleGrant = (record: any) => {
    const inputValue = { memberIds: '' };
    Modal.confirm({
      title: '发放优惠券',
      content: (
        <div>
          <p>请输入要发放的用户ID，多个用逗号分隔：</p>
          <input
            style={{ width: '100%', padding: '8px', marginTop: '8px' }}
            placeholder="例如: 1,2,3"
            onChange={(e) => { inputValue.memberIds = e.target.value; }}
          />
        </div>
      ),
      onOk: () => {
        const memberIds = inputValue.memberIds
          .split(',')
          .map((id: string) => Number(id.trim()))
          .filter((id: number) => !isNaN(id));
        if (memberIds.length === 0) {
          message.error('请输入有效的用户ID');
          return Promise.reject();
        }
        grantMutation.mutate({ id: record.id, memberIds });
        return Promise.resolve();
      },
    });
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const handleView = (record: CouponTemplate) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  const couponTypeEnums = {
    FULL_REDUCTION: { text: '满减券', status: 'Processing' },
    DISCOUNT: { text: '折扣券', status: 'Success' },
    NO_THRESHOLD: { text: '无门槛券', status: 'Warning' },
  };

  const statusEnums = {
    ENABLED: { text: '启用', status: 'Success' },
    DISABLED: { text: '禁用', status: 'Error' },
  };

  const columns: ProColumns<any>[] = [
    {
      title: '模板名称',
      dataIndex: 'name',
      width: 200,
      render: (_, record) => (
        <div>
          <GiftOutlined style={{ color: '#faad14', marginRight: 8 }} />
          {record.name}
        </div>
      ),
    },
    {
      title: '优惠码',
      dataIndex: 'code',
      width: 150,
      render: (text) => <code>{text}</code>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      valueEnum: couponTypeEnums,
    },
    {
      title: '优惠内容',
      width: 150,
      render: (_, record) => {
        if (record.type === 'FULL_REDUCTION') {
          return (
            <span>
              满{record.minAmount || 0}减{record.value}
              {record.maxDiscount && ` (最高减${record.maxDiscount})`}
            </span>
          );
        }
        if (record.type === 'DISCOUNT') {
          return <span>{record.value}折</span>;
        }
        return <span>无门槛减{record.value}</span>;
      },
    },
    {
      title: '总发行量',
      dataIndex: 'totalCount',
      width: 100,
      render: (_, record) => {
        const distributed = record.distributedCount || 0;
        const total = record.totalCount;
        if (total) {
          return (
            <Tag color="blue">
              {distributed}/{total}
            </Tag>
          );
        }
        return <Tag color="green">不限量</Tag>;
      },
    },
    {
      title: '领取时间',
      width: 200,
      render: (_, record) => {
        if (record.receiveStartTime && record.receiveEndTime) {
          return (
            <span style={{ fontSize: 12 }}>
              {record.receiveStartTime.slice(0, 10)} ~
              {record.receiveEndTime.slice(0, 10)}
            </span>
          );
        }
        return <Tag>长期有效</Tag>;
      },
    },
    {
      title: '有效期',
      dataIndex: 'validType',
      width: 150,
      render: (_, record) => {
        if (record.validType === 'DAYS') {
          return <Tag color="orange">领取后{record.validDays}天</Tag>;
        }
        if (record.validStartTime && record.validEndTime) {
          return (
            <span style={{ fontSize: 12 }}>
              {record.validStartTime.slice(0, 10)} ~
              {record.validEndTime.slice(0, 10)}
            </span>
          );
        }
        return <Tag>永久有效</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: statusEnums,
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.status === 'ENABLED'}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onClick={() => handleToggleStatus(record)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            permission={MARKETING.COUPON_TEMPLATE.QUERY}
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </PermissionButton>
          <PermissionButton
            permission={MARKETING.COUPON_TEMPLATE.GRANT}
            type="link"
            size="small"
            onClick={() => handleGrant(record)}
          >
            发放
          </PermissionButton>
          <PermissionButton
            permission={MARKETING.COUPON_TEMPLATE.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={MARKETING.COUPON_TEMPLATE.REMOVE}
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </PermissionButton>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable
        headerTitle="优惠券模板管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1400 }}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          const result = await couponTemplateApi.list({
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
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MARKETING.COUPON_TEMPLATE.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增模板
          </PermissionButton>,
        ]}
      />

      <ModalForm<CouponTemplateForm>
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>{editingId ? '编辑优惠券模板' : '新增优惠券模板'}</span>
            {!editingId && (
              <a
                style={{ fontSize: 14, fontWeight: 'normal' }}
                onClick={(e) => {
                  e.preventDefault();
                  setExampleOpen(true);
                }}
              >
                <QuestionCircleOutlined /> 查看填写示例
              </a>
            )}
          </div>
        }
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditingId(null);
          }
        }}
        width={600}
        initialValues={{
          stackable: false,
          status: 'ENABLED',
          validType: 'DAYS',
          validDays: 30,
        }}
        onFinish={async (values) => {
          // 处理日期范围
          if (values.receiveStartTime && values.receiveEndTime) {
            values.receiveStartTime = values.receiveStartTime[0];
            values.receiveEndTime = values.receiveEndTime[0];
          } else {
            values.receiveStartTime = undefined;
            values.receiveEndTime = undefined;
          }

          // 处理有效期
          if (values.validType === 'FIXED') {
            values.validDays = undefined;
          } else {
            values.validStartTime = undefined;
            values.validEndTime = undefined;
          }

          await saveMutation.mutateAsync(values as CouponTemplateForm);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
        }}
      >
        <ProFormText
          name="name"
          label="模板名称"
          placeholder="请输入模板名称"
          rules={[{ required: true, message: '请输入模板名称' }]}
        />

        <ProFormSelect
          name="type"
          label="优惠类型"
          rules={[{ required: true, message: '请选择优惠类型' }]}
          valueEnum={{
            FULL_REDUCTION: '满减券',
            DISCOUNT: '折扣券',
            NO_THRESHOLD: '无门槛券',
          }}
        />

        <ProFormDigit
          name="value"
          label="优惠金额/折扣"
          rules={[{ required: true, message: '请输入优惠值' }]}
          min={0}
          fieldProps={{ precision: 2 }}
          addonAfter={
            // eslint-disable-next-line react/jsx-no-useless-fragment
            <>
              {true /* placeholder */ &&
                (true /* placeholder */ &&
                /* eslint-disable-next-line react/jsx-no-useless-fragment */
                (() => {
                  // 动态获取 form values 来决定显示什么
                  return '';
                })())}
            </>
          }
        />

        <ProFormDigit
          name="minAmount"
          label="使用门槛"
          placeholder="请输入使用门槛金额"
          min={0}
          fieldProps={{ precision: 2, placeholder: '0 表示无门槛' }}
        />

        <ProFormDigit
          name="maxDiscount"
          label="最大优惠金额"
          placeholder="请输入最大优惠金额"
          min={0}
          fieldProps={{ precision: 2, placeholder: '不限制' }}
        />

        <ProFormDigit
          name="totalCount"
          label="发行总量"
          placeholder="请输入发行总量，不填表示不限量"
          min={0}
          fieldProps={{ precision: 0 }}
        />

        <ProFormDigit
          name="perLimitCount"
          label="每人限领"
          placeholder="请输入每人限领数量，不填表示不限量"
          min={0}
          fieldProps={{ precision: 0 }}
        />

        <ProFormDateTimeRangePicker
          name={['receiveStartTime', 'receiveEndTime']}
          label="领取时间"
          placeholder={['开始时间', '结束时间']}
        />

        <ProFormRadio.Group
          name="validType"
          label="有效期类型"
          options={[
            { label: '相对时间（领取后N天有效）', value: 'DAYS' },
            { label: '绝对时间（固定起止日期）', value: 'FIXED' },
          ]}
        />

        <ProFormDigit
          name="validDays"
          label="有效天数"
          placeholder="请输入有效天数"
          min={1}
          fieldProps={{ precision: 0 }}
        />

        <ProFormSwitch
          name="stackable"
          label="是否可叠加"
          checkedChildren="可叠加"
          unCheckedChildren="不可叠加"
        />

        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入优惠券描述"
        />
      </ModalForm>

      {/* 查看详情抽屉 */}
      <Drawer
        title="优惠券模板详情"
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailRecord(null);
        }}
        width={600}
      >
        {detailRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="模板名称" span={2}>
              <GiftOutlined style={{ color: '#faad14', marginRight: 8 }} />
              {detailRecord.name}
            </Descriptions.Item>
            <Descriptions.Item label="优惠码" span={2}>
              <code style={{ color: '#1890ff' }}>{detailRecord.code}</code>
            </Descriptions.Item>
            <Descriptions.Item label="优惠类型">
              <Tag color={detailRecord.type === 'FULL_REDUCTION' ? 'blue' : detailRecord.type === 'DISCOUNT' ? 'green' : 'orange'}>
                {detailRecord.type === 'FULL_REDUCTION' ? '满减券' : detailRecord.type === 'DISCOUNT' ? '折扣券' : '无门槛券'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="优惠内容">
              {detailRecord.type === 'FULL_REDUCTION' && (
                <span>满{detailRecord.minAmount || 0}减{detailRecord.value}{detailRecord.maxDiscount && ` (最高减${detailRecord.maxDiscount})`}</span>
              )}
              {detailRecord.type === 'DISCOUNT' && <span>{detailRecord.value}折</span>}
              {detailRecord.type === 'NO_THRESHOLD' && <span>无门槛减{detailRecord.value}</span>}
            </Descriptions.Item>
            <Descriptions.Item label="使用门槛">
              {detailRecord.minAmount ? `满${detailRecord.minAmount}元可用` : '无门槛'}
            </Descriptions.Item>
            <Descriptions.Item label="最大优惠">
              {detailRecord.maxDiscount ? `${detailRecord.maxDiscount}元` : '不限'}
            </Descriptions.Item>
            <Descriptions.Item label="发行总量">
              {detailRecord.totalCount && detailRecord.totalCount > 0 ? (
                <span>
                  {detailRecord.distributedCount || 0} / {detailRecord.totalCount}
                  <span style={{ color: '#999', marginLeft: 8 }}>
                    (剩余 {detailRecord.remainingCount ?? (detailRecord.totalCount - (detailRecord.distributedCount || 0))})
                  </span>
                </span>
              ) : (
                <Tag color="green">不限量</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="每人限领">
              {detailRecord.perLimitCount ? `${detailRecord.perLimitCount}张` : '不限'}
            </Descriptions.Item>
            <Descriptions.Item label="领取时间" span={2}>
              {detailRecord.receiveStartTime && detailRecord.receiveEndTime ? (
                <span>
                  {detailRecord.receiveStartTime.slice(0, 16).replace('T', ' ')} ~ {detailRecord.receiveEndTime.slice(0, 16).replace('T', ' ')}
                </span>
              ) : (
                <Tag>长期有效</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="有效期类型">
              <Tag color={detailRecord.validType === 'DAYS' ? 'orange' : 'blue'}>
                {detailRecord.validType === 'DAYS' ? '相对时间' : '绝对时间'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="有效期">
              {detailRecord.validType === 'DAYS' ? (
                <span>领取后 {detailRecord.validDays} 天内有效</span>
              ) : detailRecord.validStartTime && detailRecord.validEndTime ? (
                <span>
                  {detailRecord.validStartTime.slice(0, 10)} ~ {detailRecord.validEndTime.slice(0, 10)}
                </span>
              ) : (
                <Tag>永久有效</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="是否可叠加">
              <Tag color={detailRecord.stackable ? 'green' : 'default'}>
                {detailRecord.stackable ? '可叠加' : '不可叠加'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={detailRecord.status === 'ENABLED' ? 'success' : 'error'}>
                {detailRecord.status === 'ENABLED' ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="适用范围" span={2}>
              {detailRecord.scopeType === 'ALL' && <Tag>全部商品</Tag>}
              {detailRecord.scopeType === 'CATEGORY' && <Tag color="blue">指定分类</Tag>}
              {detailRecord.scopeType === 'PRODUCT' && <Tag color="purple">指定商品</Tag>}
              {detailRecord.scopeType === 'TAG' && <Tag color="cyan">指定标签</Tag>}
              {!detailRecord.scopeType && <Tag>全部商品</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {detailRecord.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {detailRecord.createdAt?.slice(0, 19).replace('T', ' ')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* 填写示例弹窗 */}
      <Modal
        title={
          <div>
            <QuestionCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            优惠券模板填写示例
          </div>
        }
        open={exampleOpen}
        onCancel={() => setExampleOpen(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            以下是三种常见优惠券类型的填写示例，您可以参考这些示例来创建您的优惠券模板：
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {exampleData.map((example, index) => (
              <Card
                key={index}
                size="small"
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GiftOutlined style={{ color: example.color }} />
                    <span style={{ color: example.color }}>{example.title}</span>
                  </div>
                }
                style={{ borderColor: example.color }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 16px' }}>
                  <div>
                    <Text type="secondary">模板名称：</Text>
                    <Text strong>{example.data.name}</Text>
                  </div>
                  <div>
                    <Text type="secondary">优惠类型：</Text>
                    <Tag color={example.color}>{example.data.typeText}</Tag>
                  </div>
                  <div>
                    <Text type="secondary">优惠值：</Text>
                    <Text strong>{example.data.valueText}</Text>
                  </div>
                  <div>
                    <Text type="secondary">使用门槛：</Text>
                    <Text>{example.data.minAmountText}</Text>
                  </div>
                  <div>
                    <Text type="secondary">最大优惠：</Text>
                    <Text>{example.data.maxDiscount ? `${example.data.maxDiscount}元` : '不限'}</Text>
                  </div>
                  <div>
                    <Text type="secondary">发行总量：</Text>
                    <Text>{example.data.totalCount ?? '不限量'}</Text>
                  </div>
                  <div>
                    <Text type="secondary">每人限领：</Text>
                    <Text>{example.data.perLimitCount}张</Text>
                  </div>
                  <div>
                    <Text type="secondary">有效期类型：</Text>
                    <Tag color={example.data.validType === 'DAYS' ? 'orange' : 'blue'}>
                      {example.data.validType === 'DAYS' ? '相对时间' : '绝对时间'}
                    </Tag>
                  </div>
                  <div>
                    <Text type="secondary">有效期：</Text>
                    <Text>
                      {example.data.validType === 'DAYS'
                        ? `领取后${example.data.validDays}天`
                        : `${example.data.validStartTime} ~ ${example.data.validEndTime}`}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary">是否可叠加：</Text>
                    <Tag color={example.data.stackable ? 'green' : 'default'}>
                      {example.data.stackable ? '可叠加' : '不可叠加'}
                    </Tag>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <Text type="secondary">描述：</Text>
                    <Text>{example.data.description}</Text>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Divider />

          <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 4 }}>
            <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
              <QuestionCircleOutlined style={{ marginRight: 8 }} />
              填写说明
            </Title>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><Text type="secondary">满减券：设置使用门槛金额和优惠金额，如满100减20</Text></li>
              <li><Text type="secondary">折扣券：设置折扣值（如8表示8折），建议设置最大优惠金额</Text></li>
              <li><Text type="secondary">无门槛券：直接设置优惠金额，无需设置使用门槛</Text></li>
              <li><Text type="secondary">相对时间：用户领取后N天内有效，适合长期活动</Text></li>
              <li><Text type="secondary">绝对时间：固定起止日期，适合限时活动</Text></li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
}
