import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Space, Tag, Switch, Modal, Table, Tooltip, Typography } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { SpecGroupStep, SkuManageStep } from './edit';
import { ProColumns } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { productApi, Product, ProductSku, ProductSpecGroup } from '@/services/mall/product';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';

// 辅助函数：将 Prisma Decimal 转换为数字
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber();
  }
  return Number(value) || 0;
};

// 辅助函数：格式化金额
const formatPrice = (value: any): string => {
  return toNumber(value).toFixed(2);
};

export default function ProductPage() {
  const navigate = useNavigate();
  const actionRef = useRef<ProTableRef>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [skuModalOpen, setSkuModalOpen] = useState(false);
  const [currentSkus, setCurrentSkus] = useState<ProductSku[]>([]);
  const [currentProductName, setCurrentProductName] = useState('');
  // 规格管理弹窗状态
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [specProductId, setSpecProductId] = useState<number | null>(null);
  const [specProductName, setSpecProductName] = useState('');
  const [specGroups, setSpecGroups] = useState<ProductSpecGroup[]>([]);

  // SKU管理弹窗状态
  const [skuManageModalOpen, setSkuManageModalOpen] = useState(false);
  const [skuManageProductId, setSkuManageProductId] = useState<number | null>(null);
  const [skuManageProductName, setSkuManageProductName] = useState('');
  const [skuManageSpecGroups, setSkuManageSpecGroups] = useState<ProductSpecGroup[]>([]);
  const [skuManageSkuList, setSkuManageSkuList] = useState<ProductSku[]>([]);

  // 处理编辑 - 跳转到编辑页面
  const handleEdit = (record: Product) => {
    navigate(`/mall/product/edit/${record.id}`);
  };

  // 查看 SKU
  const handleViewSkus = (record: Product) => {
    setCurrentSkus(record.skus || []);
    setCurrentProductName(record.name);
    setSkuModalOpen(true);
  };

  // 管理规格（仅草稿商品）
  const handleManageSpec = async (record: Product) => {
    setSpecProductId(record.id);
    setSpecProductName(record.name);
    setSpecGroups(record.specGroups || []);
    setSpecModalOpen(true);
  };

  // 刷新规格数据
  const refreshSpecData = async () => {
    if (specProductId) {
      const detail = await productApi.get(specProductId);
      setSpecGroups(detail.specGroups || []);
    }
  };

  // 管理SKU（仅草稿商品）
  const handleManageSku = async (record: Product) => {
    setSkuManageProductId(record.id);
    setSkuManageProductName(record.name);
    setSkuManageSpecGroups(record.specGroups || []);
    setSkuManageSkuList(record.skus || []);
    setSkuManageModalOpen(true);
  };

  // 刷新SKU数据
  const refreshSkuData = async () => {
    if (skuManageProductId) {
      const detail = await productApi.get(skuManageProductId);
      setSkuManageSpecGroups(detail.specGroups || []);
      setSkuManageSkuList(detail.skus || []);
    }
  };

  // 解析规格组合
  const parseSpecCombination = (specs: Record<string, string> | string) => {
    let parsedSpecs = specs;
    if (typeof specs === 'string') {
      try {
        parsedSpecs = JSON.parse(specs);
      } catch {
        return <span style={{ color: '#999' }}>{specs}</span>;
      }
    }
    if (!parsedSpecs || typeof parsedSpecs !== 'object') return '-';
    return (
      <Space size="small" wrap>
        {Object.entries(parsedSpecs).map(([key, value]) => (
          <Tag key={key} color="blue">
            {key}: {String(value)}
          </Tag>
        ))}
      </Space>
    );
  };

  // 处理新增 - 跳转到新增页面
  const handleAdd = () => {
    navigate('/mall/product/add');
  };

  // 处理复制
  const duplicateMutation = useMutation({
    mutationFn: productApi.duplicate,
    onSuccess: () => {
      message.success('商品复制成功');
      actionRef.current?.reload();
    },
  });

  const handleDuplicate = (record: Product) => {
    Modal.confirm({
      title: '确认复制',
      content: `确定要复制「${record.name}」吗？复制后将成为一个新的草稿商品。`,
      onOk: () => duplicateMutation.mutate(record.id),
    });
  };

  // 删除
  const deleteMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: productApi.toggleStatus,
    onSuccess: () => {
      message.success('状态修改成功');
      actionRef.current?.reload();
    },
  });

  const handleStatusChange = (record: Product) => {
    Modal.confirm({
      title: '确认切换状态',
      content: `确定要${record.status === 'ON_SHELF' ? '下架' : '上架'}「${record.name}」吗？`,
      onOk: () => toggleStatusMutation.mutate(record.id),
    });
  };

  // 批量操作
  const batchToggleStatusMutation = useMutation({
    mutationFn: productApi.batchToggleStatus,
    onSuccess: () => {
      message.success('批量状态修改成功');
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => productApi.delete(id)));
    },
    onSuccess: () => {
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    },
  });

  const handleBatchShelf = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商品');
      return;
    }
    Modal.confirm({
      title: '确认批量上架',
      content: `确定要将选中的 ${selectedRowKeys.length} 个商品上架吗？`,
      onOk: () => batchToggleStatusMutation.mutate(selectedRowKeys as number[]),
    });
  };

  const handleBatchUnshelf = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商品');
      return;
    }
    Modal.confirm({
      title: '确认批量下架',
      content: `确定要将选中的 ${selectedRowKeys.length} 个商品下架吗？`,
      onOk: () => batchToggleStatusMutation.mutate(selectedRowKeys as number[]),
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商品');
      return;
    }
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个商品吗？删除后无法恢复。`,
      okType: 'danger',
      onOk: () => batchDeleteMutation.mutate(selectedRowKeys as number[]),
    });
  };

  const columns: ProColumns<Product>[] = [
    {
      title: '商品图片',
      dataIndex: 'mainImage',
      width: 100,
      render: (_, record) =>
        record.mainImage ? (
          <img
            src={record.mainImage}
            alt="商品图"
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              background: '#f5f5f5',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#999', fontSize: 12 }}>暂无图</span>
          </div>
        ),
      search: false,
    },
    {
      title: '商品信息',
      dataIndex: 'name',
      width: 250,
      render: (text, record) => (
        <div>
          <div
            style={{ fontWeight: 500, marginBottom: 4, color: '#1890ff', cursor: 'pointer' }}
            onClick={() => navigate(`/mall/product/detail/${record.id}`)}
          >
            {text}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>编码: {record.code || '-'}</div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      width: 120,
      render: (text) => (text ? <Tag color="blue">{text}</Tag> : '-'),
    },
    {
      title: '价格',
      dataIndex: 'defaultPrice',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const price = toNumber(record.defaultPrice);
        const originalPrice = toNumber(record.originalPrice);
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{formatPrice(price)}</div>
            {originalPrice > price && (
              <div style={{ color: '#999', textDecoration: 'line-through', fontSize: 12 }}>
                ¥{formatPrice(originalPrice)}
              </div>
            )}
          </div>
        );
      },
      search: false,
    },
    {
      title: '库存',
      dataIndex: 'defaultStock',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const stock = toNumber(record.defaultStock);
        return <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>{stock}</Tag>;
      },
      search: false,
    },
    {
      title: 'SKU',
      dataIndex: 'skus',
      width: 80,
      align: 'center',
      search: false,
      render: (_, record) => {
        const count = record.skus?.length || 0;
        return count > 0 ? (
          <Tooltip title="点击查看SKU详情">
            <Tag
              color="purple"
              style={{ cursor: 'pointer' }}
              onClick={() => handleViewSkus(record)}
            >
              {count}
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="default">0</Tag>
        );
      },
    },
    {
      title: '规格',
      dataIndex: 'specGroups',
      width: 150,
      search: false,
      render: (_, record) => {
        const groups = record.specGroups || [];
        if (groups.length === 0) {
          return <span style={{ color: '#999' }}>无规格</span>;
        }
        return (
          <Space wrap>
            {groups.map((group: any) => (
              <Tag key={group.id} color="cyan">
                {group.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '销量',
      dataIndex: 'sales',
      width: 80,
      align: 'center',
      search: false,
      render: (sales) => sales || 0,
    },
    {
      title: '销售状态',
      dataIndex: 'status',
      width: 120,
      valueEnum: {
        ON_SHELF: { text: '上架', status: 'Success' },
        OFF_SHELF: { text: '下架', status: 'Error' },
        DRAFT: { text: '草稿', status: 'Warning' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 'ON_SHELF'}
          checkedChildren="上架"
          unCheckedChildren={record.status === 'DRAFT' ? '草稿' : '下架'}
          onClick={() => handleStatusChange(record)}
          loading={toggleStatusMutation.isPending}
          disabled={record.status === 'DRAFT'}
        />
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      search: false,
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
      width: 320,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status !== 'ON_SHELF' && (
            <PermissionButton
              permission={MALL.PRODUCT.EDIT}
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </PermissionButton>
          )}
          {record.status === 'DRAFT' && (
            <>
              <PermissionButton
                permission={MALL.PRODUCT.EDIT}
                type="link"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => handleManageSpec(record)}
              >
                规格
              </PermissionButton>
              <PermissionButton
                permission={MALL.PRODUCT.EDIT}
                type="link"
                size="small"
                icon={<AppstoreOutlined />}
                onClick={() => handleManageSku(record)}
              >
                SKU
              </PermissionButton>
            </>
          )}
          <PermissionButton
            permission={MALL.PRODUCT.ADD}
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleDuplicate(record)}
          >
            复制
          </PermissionButton>
          {record.status !== 'ON_SHELF' && (
            <PermissionButton
              permission={MALL.PRODUCT.REMOVE}
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            >
              删除
            </PermissionButton>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <>
    <ProTable
      headerTitle="商品管理"
      actionRef={actionRef}
      columns={columns}
      rowKey="id"
      scroll={{ x: 1600 }}
      api="/mall/product"
      rowSelection={rowSelection}
      toolBarRender={() => [
        <PermissionButton
          key="batch-shelf"
          permission={MALL.PRODUCT.EDIT}
          onClick={handleBatchShelf}
        >
          批量上架
        </PermissionButton>,
        <PermissionButton
          key="batch-unshelf"
          permission={MALL.PRODUCT.EDIT}
          onClick={handleBatchUnshelf}
        >
          批量下架
        </PermissionButton>,
        <PermissionButton
          key="batch-delete"
          permission={MALL.PRODUCT.REMOVE}
          danger
          onClick={handleBatchDelete}
        >
          批量删除
        </PermissionButton>,
        <PermissionButton
          key="add"
          permission={MALL.PRODUCT.ADD}
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新增商品
        </PermissionButton>,
      ]}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
    />

    {/* SKU 详情弹窗 */}
    <Modal
      title={`${currentProductName} - SKU列表（共 ${currentSkus.length} 个）`}
      open={skuModalOpen}
      onCancel={() => setSkuModalOpen(false)}
      footer={null}
      width={900}
    >
      <Table
        dataSource={currentSkus}
        rowKey="id"
        pagination={currentSkus.length > 10 ? { pageSize: 10, showTotal: (total) => `共 ${total} 条` } : false}
        scroll={{ x: 800 }}
        size="small"
        columns={[
          {
            title: 'SKU编码',
            dataIndex: 'skuCode',
            width: 200,
            render: (skuCode: string) => (
              <Typography.Text
                copyable={{ tooltips: ['点击复制', '复制成功'] }}
                style={{ margin: 0 }}
              >
                {skuCode}
              </Typography.Text>
            ),
          },
          {
            title: '规格组合',
            dataIndex: 'specCombination',
            width: 220,
            render: (specs) => parseSpecCombination(specs),
          },
          {
            title: '价格',
            dataIndex: 'price',
            width: 100,
            align: 'right',
            render: (price) => (
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                ¥{formatPrice(price)}
              </span>
            ),
          },
          {
            title: '成本价',
            dataIndex: 'costPrice',
            width: 100,
            align: 'right',
            render: (costPrice) => costPrice ? `¥${formatPrice(costPrice)}` : '-',
          },
          {
            title: '库存',
            dataIndex: 'stock',
            width: 80,
            align: 'center',
            render: (stock) => (
              <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
                {stock}
              </Tag>
            ),
          },
          {
            title: '销量',
            dataIndex: 'sales',
            width: 70,
            align: 'center',
          },
          {
            title: '重量(kg)',
            dataIndex: 'weight',
            width: 90,
            align: 'right',
            render: (weight) => (weight ? formatPrice(weight) : '-'),
          },
        ]}
      />
    </Modal>

    {/* 规格管理弹窗（仅草稿商品） */}
    <Modal
      title={`${specProductName} - 规格管理`}
      open={specModalOpen}
      onCancel={() => {
        setSpecModalOpen(false);
        setSpecProductId(null);
        setSpecProductName('');
        setSpecGroups([]);
        // 关闭弹窗后刷新列表
        actionRef.current?.reload();
      }}
      footer={null}
      width={900}
      destroyOnClose
    >
      {specProductId && (
        <SpecGroupStep
          productId={specProductId}
          specGroups={specGroups}
          onSpecGroupsChange={setSpecGroups}
          onRefreshProductDetail={refreshSpecData}
          inModal
        />
      )}
    </Modal>

    {/* SKU管理弹窗（仅草稿商品） */}
    <Modal
      title={`${skuManageProductName} - SKU管理`}
      open={skuManageModalOpen}
      onCancel={() => {
        setSkuManageModalOpen(false);
        setSkuManageProductId(null);
        setSkuManageProductName('');
        setSkuManageSpecGroups([]);
        setSkuManageSkuList([]);
        // 关闭弹窗后刷新列表
        actionRef.current?.reload();
      }}
      footer={null}
      width={1100}
      destroyOnClose
    >
      {skuManageProductId && (
        <SkuManageStep
          productId={skuManageProductId}
          skuList={skuManageSkuList}
          specGroups={skuManageSpecGroups}
          onSkuChange={setSkuManageSkuList}
          onRefreshProductDetail={refreshSkuData}
          inModal
        />
      )}
    </Modal>
    </>
  );
}
