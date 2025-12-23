import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Input, InputNumber, Radio, Space, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  getProductSpecGroups,
  createProductSpecGroup,
  updateProductSpecGroup,
  deleteProductSpecGroup,
  getProductSkus,
  createProductSku,
  updateProductSku,
  deleteProductSku,
} from '@/services/mall/product';

interface SpecValue {
  id: number;
  name: string;
  sort: number;
}

interface SpecGroup {
  id: number;
  name: string;
  sort: number;
  specValues: SpecValue[];
}

interface Sku {
  id: number;
  skuCode: string;
  specCombination: Record<string, string>;
  price: number;
  stock: number;
  weight?: number;
  sales: number;
  productId: number;
}

const ProductSKUManage: React.FC<{ productId: number }> = ({ productId }) => {
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);

  const [specGroupModalVisible, setSpecGroupModalVisible] = useState(false);
  const [skuModalVisible, setSkuModalVisible] = useState(false);

  const [form] = Form.useForm();
  const [skuForm] = Form.useForm();

  const [editingSpecGroup, setEditingSpecGroup] = useState<SpecGroup | null>(null);
  const [editingSku, setEditingSku] = useState<Sku | null>(null);

  // 规格组表格列配置
  const specGroupColumns = [
    {
      title: '规格组名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SpecGroup) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditSpecGroup(record)}>编辑</Button>
          <Button type="link" danger onClick={() => handleDeleteSpecGroup(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  // SKU表格列配置
  const skuColumns = [
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
        <>
          {Object.entries(specs).map(([key, value]) => (
            <Tag key={key}>{key}: {value}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => price.toFixed(2),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Sku) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditSku(record)}>编辑</Button>
          <Button type="link" danger onClick={() => handleDeleteSku(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  // 加载数据
  const fetchData = async () => {
    try {
      const [groupsRes, skusRes] = await Promise.all([
        getProductSpecGroups({ productId }),
        getProductSkus({ productId }),
      ]);

      setSpecGroups(groupsRes.data);
      setSkus(skusRes.data);
    } catch (error) {
      message.error('数据加载失败');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  // 规格组管理
  const handleAddSpecGroup = () => {
    setEditingSpecGroup(null);
    form.resetFields();
    setSpecGroupModalVisible(true);
  };

  const handleEditSpecGroup = (record: SpecGroup) => {
    setEditingSpecGroup(record);
    form.setFieldsValue(record);
    setSpecGroupModalVisible(true);
  };

  const handleDeleteSpecGroup = async (id: number) => {
    try {
      await deleteProductSpecGroup(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  const handleSpecGroupSubmit = async (values: any) => {
    try {
      const data = { ...values, productId };

      if (editingSpecGroup) {
        await updateProductSpecGroup(editingSpecGroup.id, data);
        message.success('规格组更新成功');
      } else {
        await createProductSpecGroup(data);
        message.success('规格组创建成功');
      }

      setSpecGroupModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  // SKU管理
  const handleAddSku = () => {
    setEditingSku(null);
    skuForm.resetFields();

    // 初始化规格组合对象
    const initialSpecs: Record<string, string> = {};
    specGroups.forEach(group => {
      if (group.specValues.length > 0) {
        initialSpecs[group.name] = group.specValues[0].name;
      }
    });

    skuForm.setFieldsValue({
      specCombination: initialSpecs,
      price: 0,
      stock: 0,
    });

    setSkuModalVisible(true);
  };

  const handleEditSku = (record: Sku) => {
    setEditingSku(record);
    skuForm.setFieldsValue(record);
    setSkuModalVisible(true);
  };

  const handleDeleteSku = async (id: number) => {
    try {
      await deleteProductSku(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  const handleSkuSubmit = async (values: any) => {
    try {
      const data = { ...values, productId };

      if (editingSku) {
        await updateProductSku(editingSku.id, data);
        message.success('SKU更新成功');
      } else {
        await createProductSku(data);
        message.success('SKU创建成功');
      }

      setSkuModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  return (
    <div className="sku-manage">
      <h3 style={{ marginBottom: 24 }}>商品规格与SKU管理</h3>

      {/* 规格组管理 */}
      <div style={{ marginBottom: 32 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSpecGroup} style={{ marginBottom: 16 }}>
          新增规格组
        </Button>
        <Table
          columns={specGroupColumns}
          dataSource={specGroups}
          rowKey="id"
          pagination={false}
          bordered
        />
      </div>

      {/* SKU管理 */}
      <div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSku} style={{ marginBottom: 16 }}>
          新增SKU
        </Button>
        <Table
          columns={skuColumns}
          dataSource={skus}
          rowKey="id"
          pagination={false}
          bordered
        />
      </div>

      {/* 规格组弹窗 */}
      <Modal
        title={editingSpecGroup ? '编辑规格组' : '新增规格组'}
        open={specGroupModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setSpecGroupModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSpecGroupSubmit}
        >
          <Form.Item
            name="name"
            label="规格组名称"
            rules={[{ required: true, message: '请输入规格组名称' }]}
          >
            <Input placeholder="如：颜色、尺寸" />
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

      {/* SKU弹窗 */}
      <Modal
        title={editingSku ? '编辑SKU' : '新增SKU'}
        open={skuModalVisible}
        width={800}
        onOk={() => skuForm.submit()}
        onCancel={() => setSkuModalVisible(false)}
      >
        <Form
          form={skuForm}
          layout="vertical"
          onFinish={handleSkuSubmit}
        >
          <Form.Item
            name="skuCode"
            label="SKU编码"
            rules={[{ required: true, message: '请输入SKU编码' }]}
          >
            <Input placeholder="请输入SKU编码" />
          </Form.Item>

          {/* 规格组合选择 */}
          {specGroups.map(group => (
            <Form.Item
              key={group.id}
              label={group.name}
              name={['specCombination', group.name]}
              rules={[{ required: true, message: `请选择${group.name}` }]}
            >
              <Radio.Group>
                {group.specValues.map(value => (
                  <Radio key={value.id} value={value.name}>
                    {value.name}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          ))}

          <Form.Item
            name="price"
            label="价格"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="stock"
            label="库存"
            rules={[{ required: true, message: '请输入库存' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="weight"
            label="重量(kg)"
          >
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductSKUManage;
