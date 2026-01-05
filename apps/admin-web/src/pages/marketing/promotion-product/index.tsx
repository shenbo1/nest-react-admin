import { useRef, useState } from 'react';
import { Space, Popconfirm, Tag, message, Switch, Card, Statistic, Row, Col, Progress } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
} from '@ant-design/pro-components';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import ProTable, { ProTableRef } from '@/components/ProTable';
import type { ProColumns } from '@ant-design/pro-components';
import PermissionButton from '@/components/PermissionButton';
import { MARKETING } from '@/constants/permissions';
import {
  promotionProductApi,
  PromotionProduct,
  CreatePromotionProductForm,
  UpdatePromotionProductForm,
  PromotionStats,
} from '@/services/marketing/promotion-product';
import { promotionApi, Promotion } from '@/services/marketing/promotion';

const PromotionProductList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<PromotionProduct | null>(null);
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // 获取促销活动列表
  const { data: promotions } = useQuery({
    queryKey: ['promotions', 'options'],
    queryFn: async () => {
      const result = await promotionApi.list({ pageSize: 100 });
      return result.data;
    },
  });

  // 获取统计数据
  const { data: stats } = useQuery<PromotionStats>({
    queryKey: ['promotion-product-stats', selectedPromotionId],
    queryFn: () => promotionProductApi.getStats(selectedPromotionId!),
    enabled: !!selectedPromotionId,
  });

  // 保存
  const saveMutation = useMutation({
    mutationFn: (values: CreatePromotionProductForm | UpdatePromotionProductForm) => {
      if (editingId) {
        return promotionProductApi.update(editingId, values as UpdatePromotionProductForm);
      }
      return promotionProductApi.create(values as CreatePromotionProductForm);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['promotion-products'] });
      if (selectedPromotionId) {
        queryClient.invalidateQueries({ queryKey: ['promotion-product-stats', selectedPromotionId] });
      }
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: promotionProductApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      tableRef.current?.reload();
      if (selectedPromotionId) {
        queryClient.invalidateQueries({ queryKey: ['promotion-product-stats', selectedPromotionId] });
      }
    },
  });

  // 切换状态
  const toggleMutation = useMutation({
    mutationFn: promotionProductApi.toggleStatus,
    onSuccess: () => {
      message.success('状态切换成功');
      tableRef.current?.reload();
    },
  });

  // 新增
  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setModalOpen(true);
  };

  // 编辑
  const handleEdit = (record: PromotionProduct) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  // 促销活动选项
  const promotionOptions = promotions?.map((p: Promotion) => ({
    label: `${p.name} (${p.code})`,
    value: p.id,
  })) || [];

  // 表格列
  const columns: ProColumns<PromotionProduct>[] = [
    {
      title: '促销活动',
      dataIndex: 'promotionId',
      width: 180,
      valueType: 'select',
      fieldProps: {
        options: promotionOptions,
        onChange: (value: number) => setSelectedPromotionId(value),
      },
      render: (_: any, record: PromotionProduct) => (
        <span>
          {record.promotion?.name}
          {record.promotion?.type && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {record.promotion.type === 'FLASH_SALE' ? '秒杀' :
                record.promotion.type === 'TIME_DISCOUNT' ? '折扣' : '拼团'}
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: '商品ID',
      dataIndex: 'productId',
      width: 100,
    },
    {
      title: 'SKU ID',
      dataIndex: 'skuId',
      width: 100,
      hideInSearch: true,
      render: (_: any, record: PromotionProduct) => record.skuId || '-',
    },
    {
      title: '原价',
      dataIndex: 'originalPrice',
      width: 100,
      hideInSearch: true,
      render: (_: any, record: PromotionProduct) => `¥${Number(record.originalPrice).toFixed(2)}`,
    },
    {
      title: '活动价',
      dataIndex: 'activityPrice',
      width: 100,
      hideInSearch: true,
      render: (_: any, record: PromotionProduct) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ¥{Number(record.activityPrice).toFixed(2)}
        </span>
      ),
    },
    {
      title: '折扣',
      dataIndex: 'discountRate',
      width: 80,
      hideInSearch: true,
      render: (_: any, record: PromotionProduct) => (
        <Tag color="orange">{record.discountRate}折</Tag>
      ),
    },
    {
      title: '活动库存',
      dataIndex: 'activityStock',
      width: 100,
      hideInSearch: true,
    },
    {
      title: '已售',
      dataIndex: 'soldCount',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '剩余库存',
      dataIndex: 'remainingStock',
      width: 100,
      hideInSearch: true,
      render: (_: any, record: PromotionProduct) => (
        <span style={{ color: (record.remainingStock || 0) < 10 ? '#ff4d4f' : 'inherit' }}>
          {record.remainingStock}
        </span>
      ),
    },
    {
      title: '限购数量',
      dataIndex: 'limitCount',
      width: 100,
      hideInSearch: true,
      render: (_: any, record: PromotionProduct) => record.limitCount || '不限',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        ENABLED: { text: '启用', status: 'Success' },
        DISABLED: { text: '禁用', status: 'Error' },
      },
      render: (_: any, record: PromotionProduct) => (
        <Switch
          checked={record.status === 'ENABLED'}
          onChange={() => toggleMutation.mutate(record.id)}
          loading={toggleMutation.isPending}
        />
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_: any, record: PromotionProduct) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_: any, record: PromotionProduct) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            type="link"
            size="small"
            permission={MARKETING.PROMOTION_PRODUCT.EDIT}
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.promotion?.status === 'ENDED'}
            fallbackMode="disabled"
          >
            编辑
          </PermissionButton>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <PermissionButton
              type="link"
              size="small"
              danger
              permission={MARKETING.PROMOTION_PRODUCT.REMOVE}
              icon={<DeleteOutlined />}
              disabled={record.promotion?.status === 'RUNNING' && record.soldCount > 0}
              fallbackMode="disabled"
            >
              删除
            </PermissionButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 获取数据
  const fetchData = async (params: any) => {
    const { current, pageSize, ...rest } = params;
    const result = await promotionProductApi.list({
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

  // 表单初始值
  const getInitialValues = () => {
    if (editingRecord) {
      return {
        ...editingRecord,
        originalPrice: Number(editingRecord.originalPrice),
        activityPrice: Number(editingRecord.activityPrice),
      };
    }
    return {
      status: 'ENABLED',
      sort: 0,
      limitCount: 0,
      promotionId: selectedPromotionId,
    };
  };

  return (
    <>
      {/* 统计卡片 */}
      {stats && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic title="商品总数" value={stats.totalProducts} />
            </Col>
            <Col span={4}>
              <Statistic title="启用商品" value={stats.enabledProducts} />
            </Col>
            <Col span={4}>
              <Statistic title="活动库存" value={stats.totalStock} />
            </Col>
            <Col span={4}>
              <Statistic title="已售数量" value={stats.totalSold} />
            </Col>
            <Col span={4}>
              <Statistic title="剩余库存" value={stats.remainingStock} />
            </Col>
            <Col span={4}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 8 }}>销售进度</div>
                <Progress
                  type="circle"
                  percent={stats.soldRate}
                  size={60}
                  format={(percent) => `${percent}%`}
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
        scroll={{ x: 1600 }}
        request={fetchData}
        search={{ labelWidth: 'auto' }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MARKETING.PROMOTION_PRODUCT.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加商品
          </PermissionButton>,
        ]}
      />

      <ModalForm<CreatePromotionProductForm>
        title={editingId ? '编辑促销商品' : '添加促销商品'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        width={600}
        initialValues={getInitialValues()}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormSelect
          name="promotionId"
          label="促销活动"
          placeholder="请选择促销活动"
          options={promotionOptions}
          rules={[{ required: true, message: '请选择促销活动' }]}
          disabled={!!editingId}
        />
        <ProFormDigit
          name="productId"
          label="商品ID"
          placeholder="请输入商品ID"
          rules={[{ required: true, message: '请输入商品ID' }]}
          disabled={!!editingId}
          fieldProps={{ precision: 0 }}
        />
        <ProFormDigit
          name="skuId"
          label="SKU ID"
          placeholder="请输入SKU ID（可选）"
          disabled={!!editingId}
          fieldProps={{ precision: 0 }}
        />
        <ProFormDigit
          name="originalPrice"
          label="原价"
          placeholder="请输入原价"
          rules={[{ required: true, message: '请输入原价' }]}
          min={0.01}
          fieldProps={{ precision: 2, prefix: '¥' }}
        />
        <ProFormDigit
          name="activityPrice"
          label="活动价"
          placeholder="请输入活动价"
          rules={[{ required: true, message: '请输入活动价' }]}
          min={0.01}
          fieldProps={{ precision: 2, prefix: '¥' }}
        />
        <ProFormDigit
          name="activityStock"
          label="活动库存"
          placeholder="请输入活动库存"
          rules={[{ required: true, message: '请输入活动库存' }]}
          min={1}
          fieldProps={{ precision: 0 }}
        />
        <ProFormDigit
          name="limitCount"
          label="限购数量"
          placeholder="0表示不限购"
          min={0}
          fieldProps={{ precision: 0 }}
        />
        <ProFormDigit
          name="sort"
          label="排序"
          placeholder="数值越小越靠前"
          min={0}
          max={999}
          fieldProps={{ precision: 0 }}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '启用', value: 'ENABLED' },
            { label: '禁用', value: 'DISABLED' },
          ]}
        />
      </ModalForm>
    </>
  );
};

export default PromotionProductList;
