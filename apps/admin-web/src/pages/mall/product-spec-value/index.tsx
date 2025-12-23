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
  getProductSpecValues,
  createProductSpecValue,
  bulkCreateProductSpecValues,
  updateProductSpecValue,
  deleteProductSpecValue,
  getProductSpecGroups,
  ProductSpecValue as SpecValue,
  ProductSpecGroup as SpecGroup,
} from '@/services/mall/product-sku';

const { Option } = Select;

const ProductSpecValueList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SpecValue[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SpecValue | null>(null);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  // 表格列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '规格组',
      dataIndex: 'specGroupId',
      key: 'specGroupId',
      render: (specGroupId: number) => {
        const group = specGroups.find(g => g.id === specGroupId);
        return group ? group.name : specGroupId;
      },
    },
    {
      title: '规格值名称',
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
      render: (_: any, record: SpecValue) => (
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
      const res = await getProductSpecValues(params || {});
      setData(res.data);

      // 加载规格组
      const groupsRes = await getProductSpecGroups({ productId: 0 });
      setSpecGroups(groupsRes.data);
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
    form.setFieldsValue({ sort: 0 });
    setModalVisible(true);
  };

  // 批量添加
  const handleBulkAdd = () => {
    setBulkModalVisible(true);
  };

  // 编辑
  const handleEdit = (record: SpecValue) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  // 删除
  const handleDelete = async (id: number) => {
    try {
      await deleteProductSpecValue(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // 提交表单（单个）
  const handleSubmit = async (values: any) => {
    try {
      if (editingRecord) {
        await updateProductSpecValue(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await createProductSpecValue(values);
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
  const handleBulkSubmit = async (values: any) => {
    try {
      const data = values.specValues
        .split('\n')
        .filter((item: string) => item.trim())
        .map((item: string, index: number) => ({
          specGroupId: values.specGroupId,
          name: item.trim(),
          sort: index,
        }));

      await bulkCreateProductSpecValues(data);
      message.success(`成功创建 ${data.length} 个规格值`);
      setBulkModalVisible(false);
      bulkForm.resetFields();
      loadData();
    } catch (error) {
      message.error('批量创建失败');
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="product-spec-value-list">
      <Card
        title="商品规格值管理"
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
              新增规格值
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
              <Form.Item name="specGroupId" label="规格组">
                <Select placeholder="请选择规格组" allowClear style={{ width: '100%' }}>
                  {specGroups.map(group => (
                    <Option key={group.id} value={group.id}>
                      {group.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="name" label="规格值名称">
                <Input placeholder="请输入规格值名称" />
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
        title={editingRecord ? '编辑规格值' : '新增规格值'}
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
            name="specGroupId"
            label="规格组"
            rules={[{ required: true, message: '请选择规格组' }]}
          >
            <Select placeholder="请选择规格组">
              {specGroups.map(group => (
                <Option key={group.id} value={group.id}>
                  {group.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="规格值名称"
            rules={[
              { required: true, message: '请输入规格值名称' },
              { max: 50, message: '名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="如：红色、蓝色" maxLength={50} />
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

      {/* 批量添加弹窗 */}
      <Modal
        title="批量添加规格值"
        open={bulkModalVisible}
        onCancel={() => setBulkModalVisible(false)}
        onOk={() => bulkForm.submit()}
        destroyOnHidden
        width={600}
      >
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkSubmit}
        >
          <Form.Item
            name="specGroupId"
            label="规格组"
            rules={[{ required: true, message: '请选择规格组' }]}
          >
            <Select placeholder="请选择规格组">
              {specGroups.map(group => (
                <Option key={group.id} value={group.id}>
                  {group.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="specValues"
            label="规格值列表"
            rules={[{ required: true, message: '请输入规格值' }]}
            extra="每行一个规格值，会自动按顺序排序"
          >
            <Input.TextArea
              rows={6}
              placeholder="例如：
红色
蓝色
绿色
黑色"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductSpecValueList;
