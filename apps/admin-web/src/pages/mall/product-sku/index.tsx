import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Space, Popconfirm, Tag, Modal, Descriptions, Row, Col, InputNumber, Input, Select } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormSelect,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import {
  getProductSkus,
  getProductSpecGroups,
  createProductSku,
  bulkCreateProductSkus,
  updateProductSku,
  deleteProductSku,
  ProductSku as Sku,
  ProductSpecGroup as SpecGroup,
} from '@/services/mall/product-sku';
import { productApi } from '@/services/mall/product';

export default function ProductSkuPage() {
  const navigate = useNavigate();
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Sku | null>(null);
  const [currentRecord, setCurrentRecord] = useState<Sku | null>(null);

  // 新增弹窗状态
  const [addProductId, setAddProductId] = useState<number | null>(null);
  const [addSpecGroups, setAddSpecGroups] = useState<SpecGroup[]>([]);

  // 批量添加状态
  const [bulkProductId, setBulkProductId] = useState<number | null>(null);
  const [bulkBaseSkuCode, setBulkBaseSkuCode] = useState('');
  const [bulkPrice, setBulkPrice] = useState(0);
  const [bulkStock, setBulkStock] = useState(0);
  const [bulkSelectedSpecs, setBulkSelectedSpecs] = useState<Record<string, string>>({});
  const [bulkSpecGroups, setBulkSpecGroups] = useState<SpecGroup[]>([]);

  // 获取商品列表
  const { data: productList } = useQuery({
    queryKey: ['productListForSelect'],
    queryFn: () => productApi.list({ page: 1, pageSize: 1000 }),
  });

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingRecord) {
        return updateProductSku(editingRecord.id, data);
      }
      return createProductSku(data);
    },
    onSuccess: () => {
      message.success(editingRecord ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingRecord(null);
      actionRef.current?.reload();
    },
  });

  // 批量创建
  const bulkSaveMutation = useMutation({
    mutationFn: bulkCreateProductSkus,
    onSuccess: () => {
      message.success('批量创建成功');
      setBulkModalOpen(false);
      resetBulkForm();
      actionRef.current?.reload();
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: deleteProductSku,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  const handleEdit = async (record: Sku) => {
    setEditingRecord(record);
    // 编辑时加载该商品的规格组
    if (record.productId) {
      const res = await getProductSpecGroups({ productId: record.productId });
      // 响应拦截器已解包，res 就是规格组数组
      setAddSpecGroups(Array.isArray(res) ? res : []);
      setAddProductId(record.productId);
    }
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setAddProductId(null);
    setAddSpecGroups([]);
    setModalOpen(true);
  };

  // 新增弹窗中选择商品时加载规格组
  const handleAddProductChange = async (productId: number) => {
    setAddProductId(productId);
    if (productId) {
      const res = await getProductSpecGroups({ productId });
      // 响应拦截器已解包，res 就是规格组数组
      setAddSpecGroups(Array.isArray(res) ? res : []);
    } else {
      setAddSpecGroups([]);
    }
  };

  const handleView = (record: Sku) => {
    setCurrentRecord(record);
    setDetailModalOpen(true);
  };

  const resetBulkForm = () => {
    setBulkProductId(null);
    setBulkBaseSkuCode('');
    setBulkPrice(0);
    setBulkStock(0);
    setBulkSelectedSpecs({});
    setBulkSpecGroups([]);
  };

  const handleBulkAdd = () => {
    resetBulkForm();
    setBulkModalOpen(true);
  };

  // 当选择商品时加载该商品的规格组
  const handleBulkProductChange = async (productId: number) => {
    setBulkProductId(productId);
    setBulkSelectedSpecs({});
    if (productId) {
      const res = await getProductSpecGroups({ productId });
      // 响应拦截器已解包，res 就是规格组数组
      setBulkSpecGroups(Array.isArray(res) ? res : []);
    } else {
      setBulkSpecGroups([]);
    }
  };

  // 生成 SKU 组合
  const generateSkuCombinations = () => {
    const groups = bulkSpecGroups.filter(g => bulkSelectedSpecs[g.name]);
    if (groups.length === 0) return [];

    const combinations: Record<string, string>[] = [];

    function generate(index: number, current: Record<string, string>) {
      if (index === groups.length) {
        combinations.push({ ...current });
        return;
      }

      const group = groups[index];
      const selectedValue = bulkSelectedSpecs[group.name];
      const values = group.specValues
        ?.filter(v => v.name === selectedValue)
        .map(v => v.name) || [];

      if (values.length === 0) {
        // 如果没有匹配的选中值，使用所有值
        const allValues = group.specValues?.map(v => v.name) || [];
        for (const value of allValues) {
          current[group.name] = value;
          generate(index + 1, current);
        }
      } else {
        for (const value of values) {
          current[group.name] = value;
          generate(index + 1, current);
        }
      }
    }

    generate(0, {});

    return combinations.map((combo, index) => ({
      productId: bulkProductId!,
      skuCode: bulkBaseSkuCode ? `${bulkBaseSkuCode}-${index + 1}` : `SKU-${Date.now()}-${index + 1}`,
      specCombination: combo,
      price: bulkPrice,
      stock: bulkStock,
      sales: 0,
    }));
  };

  const handleBulkSubmit = () => {
    if (!bulkProductId) {
      message.warning('请选择商品');
      return;
    }
    const skus = generateSkuCombinations();
    if (skus.length === 0) {
      message.warning('请选择规格');
      return;
    }
    bulkSaveMutation.mutate(skus);
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

  const columns: ProColumns<Sku>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '商品',
      dataIndex: 'productId',
      width: 180,
      render: (_, record) => (
        <a onClick={() => navigate(`/mall/product/detail/${record.productId}`)}>
          {record.product?.name || record.productId}
        </a>
      ),
      renderFormItem: () => (
        <ProFormSelect
          name="productId"
          placeholder="请选择商品"
          options={(productList?.data || []).map((p: any) => ({
            label: p.name,
            value: p.id,
          }))}
          fieldProps={{ allowClear: true }}
        />
      ),
    },
    {
      title: 'SKU编码',
      dataIndex: 'skuCode',
      width: 150,
      render: (_, record) => (
        <a onClick={() => handleView(record)} style={{ cursor: 'pointer' }}>
          {record.skuCode}
        </a>
      ),
    },
    {
      title: '规格组合',
      dataIndex: 'specCombination',
      width: 250,
      search: false,
      render: (_, record) => parseSpecCombination(record.specCombination),
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      search: false,
      render: (price: any) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          ¥{Number(price).toFixed(2)}
        </span>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      width: 80,
      search: false,
      render: (stock: any) => (
        <span style={{ color: stock > 0 ? '#52c41a' : '#ff4d4f' }}>
          {stock}
        </span>
      ),
    },
    {
      title: '销量',
      dataIndex: 'sales',
      width: 80,
      search: false,
    },
    {
      title: '重量(kg)',
      dataIndex: 'weight',
      width: 100,
      search: false,
      render: (weight: any) => weight ? Number(weight).toFixed(2) : '-',
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
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        // 只有商品未上架状态才能编辑和删除
        const canEdit = record.product?.status !== 'ON_SHELF';
        return (
          <Space>
            {canEdit && (
              <PermissionButton
                permission={MALL.PRODUCT_SKU.EDIT}
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </PermissionButton>
            )}
            {canEdit && (
              <Popconfirm
                title="确认删除吗？"
                description="删除后无法恢复"
                onConfirm={() => deleteMutation.mutate(record.id)}
                okText="删除"
                cancelText="取消"
              >
                <PermissionButton
                  permission={MALL.PRODUCT_SKU.REMOVE}
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除
                </PermissionButton>
              </Popconfirm>
            )}
            {!canEdit && <span style={{ color: '#999' }}>已上架</span>}
          </Space>
        );
      },
    },
  ];

  const generatedSkus = generateSkuCombinations();

  return (
    <>
      <ProTable<Sku>
        headerTitle="商品SKU管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1400 }}
        request={async (params) => {
          const { current, pageSize, productId } = params;
          // 使用后端分页
          const res = await getProductSkus({
            productId: productId || undefined,
            page: current,
            pageSize,
          });
          return {
            data: res.data || [],
            total: res.total || 0,
            success: true,
          };
        }}
        toolBarRender={() => [
          <PermissionButton
            key="bulk-add"
            permission={MALL.PRODUCT_SKU.ADD}
            icon={<PlusOutlined />}
            onClick={handleBulkAdd}
          >
            批量添加
          </PermissionButton>,
          <PermissionButton
            key="add"
            permission={MALL.PRODUCT_SKU.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增SKU
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      {/* 新增/编辑弹窗 */}
      <ModalForm
        title={editingRecord ? '编辑SKU' : '新增SKU'}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setAddProductId(null);
            setAddSpecGroups([]);
          }
        }}
        initialValues={editingRecord || { price: 0, stock: 0, sales: 0 }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
          width: 600,
        }}
      >
        <ProFormSelect
          name="productId"
          label="商品"
          placeholder="请选择商品"
          rules={[{ required: true, message: '请选择商品' }]}
          options={(productList?.data || []).map((p: any) => ({
            label: p.name,
            value: p.id,
          }))}
          disabled={!!editingRecord}
          fieldProps={{
            onChange: (value: number) => {
              if (!editingRecord) {
                handleAddProductChange(value);
              }
            },
          }}
        />
        <ProFormText
          name="skuCode"
          label="SKU编码"
          placeholder="请输入SKU编码"
          rules={[{ required: true, message: '请输入SKU编码' }]}
        />
        <Row gutter={16}>
          <Col span={12}>
            <ProFormDigit
              name="price"
              label="价格"
              placeholder="请输入价格"
              min={0}
              fieldProps={{ precision: 2 }}
              rules={[{ required: true, message: '请输入价格' }]}
            />
          </Col>
          <Col span={12}>
            <ProFormDigit
              name="stock"
              label="库存"
              placeholder="请输入库存"
              min={0}
              fieldProps={{ precision: 0 }}
              rules={[{ required: true, message: '请输入库存' }]}
            />
          </Col>
        </Row>
        <ProFormDigit
          name="weight"
          label="重量(kg)"
          placeholder="请输入重量"
          min={0}
          fieldProps={{ precision: 2 }}
        />
        {/* 规格组合选择 - 根据选中商品动态加载 */}
        {addSpecGroups.map((group: SpecGroup) => (
          <ProFormSelect
            key={group.id}
            name={['specCombination', group.name]}
            label={group.name}
            placeholder={`请选择${group.name}`}
            options={(group.specValues || []).map(v => ({
              label: v.name,
              value: v.name,
            }))}
          />
        ))}
        {!addProductId && !editingRecord && (
          <div style={{ color: '#999', textAlign: 'center', padding: '16px 0' }}>
            请先选择商品，再配置规格组合
          </div>
        )}
      </ModalForm>

      {/* 批量添加弹窗 */}
      <Modal
        title="批量添加SKU"
        open={bulkModalOpen}
        onCancel={() => setBulkModalOpen(false)}
        onOk={handleBulkSubmit}
        confirmLoading={bulkSaveMutation.isPending}
        width={900}
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>商品</div>
            <Select
              value={bulkProductId || undefined}
              onChange={handleBulkProductChange}
              placeholder="请选择商品"
              style={{ width: '100%' }}
              allowClear
            >
              {(productList?.data || []).map((p: any) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>基础SKU编码</div>
            <Input
              value={bulkBaseSkuCode}
              onChange={(e) => setBulkBaseSkuCode(e.target.value)}
              placeholder="如：PRODUCT-001"
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>价格</div>
            <InputNumber
              value={bulkPrice}
              onChange={(v) => setBulkPrice(v || 0)}
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入价格"
            />
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>库存</div>
            <InputNumber
              value={bulkStock}
              onChange={(v) => setBulkStock(v || 0)}
              min={0}
              precision={0}
              style={{ width: '100%' }}
              placeholder="请输入库存"
            />
          </Col>
        </Row>

        {/* 规格组合选择 */}
        {bulkSpecGroups.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择规格</div>
            <Row gutter={16}>
              {bulkSpecGroups.map((group) => (
                <Col span={8} key={group.id} style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 4 }}>{group.name}</div>
                  <Select
                    value={bulkSelectedSpecs[group.name] || undefined}
                    onChange={(value) => setBulkSelectedSpecs(prev => ({ ...prev, [group.name]: value }))}
                    placeholder={`请选择${group.name}`}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    {(group.specValues || []).map(v => (
                      <Select.Option key={v.id} value={v.name}>
                        {v.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* 预览生成的 SKU */}
        {generatedSkus.length > 0 && (
          <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              将生成的 SKU（{generatedSkus.length} 个）
            </div>
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              {generatedSkus.slice(0, 10).map((sku, index) => (
                <div key={index} style={{ marginBottom: 8 }}>
                  <strong>SKU {index + 1}:</strong> {sku.skuCode}
                  <br />
                  <span style={{ color: '#666' }}>
                    规格: {Object.entries(sku.specCombination).map(([k, v]) => `${k}:${v}`).join(', ')}
                  </span>
                </div>
              ))}
              {generatedSkus.length > 10 && (
                <div style={{ color: '#666', textAlign: 'center' }}>
                  还有 {generatedSkus.length - 10} 个 SKU...
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="SKU详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {currentRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="SKU ID">{currentRecord.id}</Descriptions.Item>
            <Descriptions.Item label="SKU编码">{currentRecord.skuCode}</Descriptions.Item>
            <Descriptions.Item label="商品">{currentRecord.product?.name || currentRecord.productId}</Descriptions.Item>
            <Descriptions.Item label="价格">¥{Number(currentRecord.price).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="库存">{currentRecord.stock}</Descriptions.Item>
            <Descriptions.Item label="销量">{currentRecord.sales}</Descriptions.Item>
            {currentRecord.weight && (
              <Descriptions.Item label="重量">{Number(currentRecord.weight).toFixed(2)} kg</Descriptions.Item>
            )}
            <Descriptions.Item label="规格组合" span={2}>
              {parseSpecCombination(currentRecord.specCombination)}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(currentRecord.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(currentRecord.updatedAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
}
