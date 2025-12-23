import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Card,
  Select,
  Row,
  Col,
  Tag,
  Descriptions
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import {
  getProductSkus,
  createProductSku,
  bulkCreateProductSkus,
  updateProductSku,
  deleteProductSku,
  getProductSpecGroups,
  ProductSku as Sku,
  ProductSpecGroup as SpecGroup,
} from '@/services/mall/product-sku';

const { Option } = Select;

const ProductSkuList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Sku[]>([]);
  const [products] = useState<{id: number, name: string, code: string}[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Sku | null>(null);
  const [currentRecord, setCurrentRecord] = useState<Sku | null>(null);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [generatedSkus, setGeneratedSkus] = useState<Sku[]>([]);

  // 表格列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'SKU编码',
      dataIndex: 'skuCode',
      key: 'skuCode',
    },
    {
      title: '规格组合',
      dataIndex: 'specCombination',
      key: 'specCombination',
      render: (specs: Record<string, string>) => (
        <Space size="small">
          {Object.entries(specs).map(([key, value]) => (
            <Tag key={key} color="blue">
              {key}: {value}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          ¥{price.toFixed(2)}
        </span>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <span style={{ color: stock > 0 ? '#52c41a' : '#ff4d4f' }}>
          {stock}
        </span>
      ),
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
    },
    {
      title: '重量(kg)',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight?: number) => weight?.toFixed(2) || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: Sku) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            详情
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 加载数据
  const loadData = async (params?: any) => {
    setLoading(true);
    try {
      const res = await getProductSkus(params || {});
      setData(res.data);

      // 获取规格组
      const groupsRes = await getProductSpecGroups({ productId: 0 });
      setSpecGroups(groupsRes.data);

      // 获取商品列表（需要根据你的实际情况实现）
      // 这里假设有一个getProducts函数
      // const productsRes = await getProducts({ productId: 0 });
      // setProducts(productsRes.data);
    } catch (error) {
      message.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = (values: any) => {
    loadData(values);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    loadData();
  };

  // 添加
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      price: 0,
      stock: 0,
      sales: 0,
      specCombination: getInitialSpecCombination(),
    });
    setModalVisible(true);
  };

  // 批量添加
  const handleBulkAdd = () => {
    const initialSpecs = getInitialSpecCombination();
    bulkForm.setFieldsValue({
      baseSkuCode: '',
      price: 0,
      stock: 0,
      specCombination: initialSpecs,
    });
    generateSkuCombinations(initialSpecs);
    setBulkModalVisible(true);
  };

  // 编辑
  const handleEdit = (record: Sku) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  // 查看详情
  const handleView = (record: Sku) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  // 删除
  const handleDelete = async (id: number) => {
    try {
      await deleteProductSku(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // 获取初始规格组合
  const getInitialSpecCombination = () => {
    const combination: Record<string, string> = {};
    specGroups.forEach(group => {
      if (group.specValues.length > 0) {
        combination[group.name] = group.specValues[0].name;
      }
    });
    return combination;
  };

  // 生成SKU组合
  const generateSkuCombinations = (specs: Record<string, string>) => {
    const groups = specGroups.filter(group => specs[group.name]);

    if (groups.length === 0) {
      setGeneratedSkus([]);
      return;
    }

    // 获取每个规格组可选的规格值
    const valueOptions: string[][] = [];
    groups.forEach(group => {
      const groupName = group.name;
      const selectedValue = specs[groupName];
      const values = group.specValues
        .filter(value => value.name === selectedValue)
        .map(value => value.name);
      valueOptions.push(values);
    });

    // 生成所有组合
    const combinations: Record<string, string>[] = [];

    function generate(index: number, current: Record<string, string>) {
      if (index === groups.length) {
        combinations.push({...current});
        return;
      }

      const group = groups[index];
      const groupName = group.name;
      const selectedValue = specs[groupName];
      const values = group.specValues
        .filter(value => value.name === selectedValue)
        .map(value => value.name);

      for (const value of values) {
        current[groupName] = value;
        generate(index + 1, current);
      }
    }

    generate(0, {});

    // 生成SKU对象
    const skus = combinations.map((combo, index) => ({
      id: 0,
      productId: 1, // 需要根据实际情况设置
      skuCode: `SKU${index + 1}`,
      specCombination: combo,
      price: 0,
      stock: 0,
      sales: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setGeneratedSkus(skus);
  };

  // 提交表单（单个）
  const handleSubmit = async (values: any) => {
    try {
      if (editingRecord) {
        await updateProductSku(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await createProductSku(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  // 批量提交
  const handleBulkSubmit = async () => {
    try {
      if (generatedSkus.length === 0) {
        message.warning('没有可创建的SKU');
        return;
      }

      const values = bulkForm.getFieldsValue();
      const skusToCreate = generatedSkus.map((sku, index) => ({
        ...sku,
        skuCode: values.baseSkuCode ? `${values.baseSkuCode}-${index + 1}` : sku.skuCode,
        price: values.price,
        stock: values.stock,
      }));

      await bulkCreateProductSkus(skusToCreate);
      message.success(`成功创建 ${skusToCreate.length} 个SKU`);
      setBulkModalVisible(false);
      bulkForm.resetFields();
      setGeneratedSkus([]);
      loadData();
    } catch (error) {
      message.error('批量创建失败');
      console.error(error);
    }
  };

  // 规格组改变时的处理
  const handleSpecGroupChange = () => {
    const formValues = form.getFieldsValue();
    if (formValues.specCombination) {
      // 重新生成规格组合
      generateSkuCombinations(formValues.specCombination);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="product-sku-list">
      <Card
        title="商品SKU管理"
        extra={
          <Space>
            <Button
              icon={<PlusOutlined />}
              onClick={handleBulkAdd}
            >
              批量添加
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增SKU
            </Button>
          </Space>
        }
      >
        {/* 搜索表单 */}
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={16} style={{ width: '100%' }}>
            <Col span={6}>
              <Form.Item name="productId" label="商品">
                <Select placeholder="请选择商品" allowClear style={{ width: '100%' }}>
                  {products.map(product => (
                    <Option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="skuCode" label="SKU编码">
                <Input placeholder="请输入SKU编码" />
              </Form.Item>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  htmlType="submit"
                >
                  搜索
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          bordered
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑SKU' : '新增SKU'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnHidden
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="skuCode"
                label="SKU编码"
                rules={[{ required: true, message: '请输入SKU编码' }]}
              >
                <Input placeholder="请输入SKU编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="价格"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="请输入价格"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stock"
                label="库存"
                rules={[{ required: true, message: '请输入库存' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="请输入库存"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="weight"
                label="重量(kg)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="请输入重量"
                />
              </Form.Item>
            </Col>
          </Row>

          {specGroups.map(group => (
            <Form.Item
              key={group.id}
              name={['specCombination', group.name]}
              label={group.name}
              rules={[{ required: true, message: `请选择${group.name}` }]}
            >
              <Select
                placeholder={`请选择${group.name}`}
                onChange={handleSpecGroupChange}
              >
                {group.specValues.map(value => (
                  <Option key={value.id} value={value.name}>
                    {value.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ))}
        </Form>
      </Modal>

      {/* 批量添加弹窗 */}
      <Modal
        title="批量添加SKU"
        open={bulkModalVisible}
        onCancel={() => setBulkModalVisible(false)}
        onOk={handleBulkSubmit}
        destroyOnHidden
        width={900}
      >
        <Form
          form={bulkForm}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="baseSkuCode"
                label="基础SKU编码"
              >
                <Input placeholder="如：PRODUCT-001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="价格"
                rules={[{ required: true, message: '请输入价格' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="请输入价格"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stock"
                label="库存"
                rules={[{ required: true, message: '请输入库存' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="请输入库存"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 规格组合选择 */}
          {specGroups.map(group => (
            <Form.Item
              key={group.id}
              name={['specCombination', group.name]}
              label={group.name}
            >
              <Select
                placeholder={`请选择${group.name}`}
                onChange={(value) => {
                  const formValues = bulkForm.getFieldsValue();
                  const currentSpecs = formValues.specCombination || {};
                  currentSpecs[group.name] = value;
                  generateSkuCombinations(currentSpecs);
                }}
              >
                <Option value="">请选择</Option>
                {group.specValues.map(value => (
                  <Option key={value.id} value={value.name}>
                    {value.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ))}

          {/* 预览生成的SKU */}
          {generatedSkus.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h4>将生成的SKU（{generatedSkus.length} 个）</h4>
              <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #f0f0f0', padding: 12 }}>
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
                    还有 {generatedSkus.length - 10} 个SKU...
                  </div>
                )}
              </div>
            </div>
          )}
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="SKU详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        {currentRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="SKU ID">{currentRecord.id}</Descriptions.Item>
            <Descriptions.Item label="SKU编码">{currentRecord.skuCode}</Descriptions.Item>
            <Descriptions.Item label="商品ID">{currentRecord.productId}</Descriptions.Item>
            <Descriptions.Item label="价格">¥{currentRecord.price.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="库存">{currentRecord.stock}</Descriptions.Item>
            <Descriptions.Item label="销量">{currentRecord.sales}</Descriptions.Item>
            {currentRecord.weight && (
              <Descriptions.Item label="重量">{currentRecord.weight.toFixed(2)} kg</Descriptions.Item>
            )}
            <Descriptions.Item label="规格组合" span={2}>
              <Space size="small">
                {Object.entries(currentRecord.specCombination).map(([key, value]) => (
                  <Tag key={key} color="blue">
                    {key}: {value}
                  </Tag>
                ))}
              </Space>
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
    </div>
  );
};

export default ProductSkuList;
