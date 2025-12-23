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
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  getProductSpecGroups,
  createProductSpecGroup,
  updateProductSpecGroup,
  deleteProductSpecGroup,
  ProductSpecGroup as SpecGroup,
  ProductSpecValue as SpecValue,
} from '@/services/mall/product-sku';

const { Option } = Select;

const ProductSpecGroupList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SpecGroup[]>([]);
  const [products] = useState<{id: number, name: string, code: string}[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SpecGroup | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);

  // 表格列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '商品',
      dataIndex: 'productId',
      key: 'productId',
      render: (productId: number) => {
        const product = products.find(p => p.id === productId);
        return product ? `${product.name} (${product.code})` : productId;
      },
    },
    {
      title: '规格组名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: SpecGroup) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除吗？"
            description="删除后无法恢复，该规格组下的所有规格值也会被删除"
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
      const res = await getProductSpecGroups(params || {});
      setData(res.data);

      // 获取商品列表（需要根据你的实际情况实现）
      // 这里假设有一个getProducts函数
      // const productsRes = await getProducts({});
      // setProducts(productsRes.data);
    } catch (error) {
      message.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 加载规格值 - 已注释掉未使用的函数
  // const loadSpecValues = async (specGroupId: number) => {
  //   try {
  //     const res = await getProductSpecValues({ specGroupId });
  //     return res.data;
  //   } catch (error) {
  //     message.error('加载规格值失败');
  //     console.error(error);
  //     return [];
  //   }
  // };

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
    form.setFieldsValue({ sort: 0 });
    setModalVisible(true);
  };

  // 编辑
  const handleEdit = (record: SpecGroup) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  // 删除
  const handleDelete = async (id: number) => {
    try {
      await deleteProductSpecGroup(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      if (editingRecord) {
        await updateProductSpecGroup(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await createProductSpecGroup(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  // 行展开配置
  const expandable = {
    expandedRowRender: (record: SpecGroup) => {
      return (
        <div>
          <h4>规格值列表</h4>
          <ul>
            {record.specValues.map((value: SpecValue) => (
              <li key={value.id}>
                {value.name} (排序: {value.sort})
              </li>
            ))}
          </ul>
        </div>
      );
    },
    onExpand: (expanded: boolean, record: SpecGroup) => {
      if (expanded) {
        setExpandedRowKeys([...expandedRowKeys, record.id]);
      } else {
        setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.id));
      }
    },
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="product-spec-group-list">
      <Card
        title="商品规格组管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增规格组
          </Button>
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
              <Form.Item name="name" label="规格组名称">
                <Input placeholder="请输入规格组名称" />
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
          expandable={expandable}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑规格组' : '新增规格组'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="productId"
            label="商品"
            rules={[{ required: true, message: '请选择商品' }]}
          >
            <Select placeholder="请选择商品">
              {products.map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name} ({product.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="规格组名称"
            rules={[
              { required: true, message: '请输入规格组名称' },
              { max: 50, message: '名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="如：颜色、尺寸" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="sort"
            label="排序"
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductSpecGroupList;
