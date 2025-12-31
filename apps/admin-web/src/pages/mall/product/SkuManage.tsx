import { useState, useEffect, useRef } from 'react';
import { message, Space, Tag, Popconfirm, Row, Col, Card, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormRadio,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
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

const { Title } = Typography;

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

interface Props {
  productId: number;
}

const ProductSKUManage: React.FC<Props> = ({ productId }) => {
  const specGroupTableRef = useRef<ProTableRef>(null);
  const skuTableRef = useRef<ProTableRef>(null);

  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [specGroupModalOpen, setSpecGroupModalOpen] = useState(false);
  const [skuModalOpen, setSkuModalOpen] = useState(false);
  const [editingSpecGroup, setEditingSpecGroup] = useState<SpecGroup | null>(null);
  const [editingSku, setEditingSku] = useState<Sku | null>(null);

  // 加载规格组数据
  const loadSpecGroups = async () => {
    try {
      const res = await getProductSpecGroups({ productId });
      setSpecGroups(res || []);
    } catch {
      // 忽略错误
    }
  };

  useEffect(() => {
    loadSpecGroups();
  }, [productId]);

  // 规格组 CRUD
  const specGroupSaveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingSpecGroup) {
        return updateProductSpecGroup(editingSpecGroup.id, data);
      }
      return createProductSpecGroup({ ...data, productId });
    },
    onSuccess: () => {
      message.success(editingSpecGroup ? '规格组更新成功' : '规格组创建成功');
      setSpecGroupModalOpen(false);
      setEditingSpecGroup(null);
      specGroupTableRef.current?.reload();
      loadSpecGroups();
    },
  });

  const specGroupDeleteMutation = useMutation({
    mutationFn: deleteProductSpecGroup,
    onSuccess: () => {
      message.success('删除成功');
      specGroupTableRef.current?.reload();
      loadSpecGroups();
    },
  });

  // SKU CRUD
  const skuSaveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingSku) {
        return updateProductSku(editingSku.id, data);
      }
      return createProductSku({ ...data, productId });
    },
    onSuccess: () => {
      message.success(editingSku ? 'SKU更新成功' : 'SKU创建成功');
      setSkuModalOpen(false);
      setEditingSku(null);
      skuTableRef.current?.reload();
    },
  });

  const skuDeleteMutation = useMutation({
    mutationFn: deleteProductSku,
    onSuccess: () => {
      message.success('删除成功');
      skuTableRef.current?.reload();
    },
  });

  // 规格组列配置
  const specGroupColumns: ProColumns<SpecGroup>[] = [
    {
      title: '规格组名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '规格值',
      dataIndex: 'specValues',
      render: (_, record) => {
        const values = record.specValues || [];
        if (values.length === 0) return '-';
        return (
          <Space wrap size="small">
            {values.map((v) => (
              <Tag key={v.id}>{v.name}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      align: 'center',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => (
        <Space>
          <PermissionButton
            type="link"
            size="small"
            permission={MALL.PRODUCT_SPEC_GROUP.EDIT}
            icon={<EditOutlined />}
            onClick={() => {
              setEditingSpecGroup(record);
              setSpecGroupModalOpen(true);
            }}
          >
            编辑
          </PermissionButton>
          <Popconfirm
            title="确认删除吗？"
            description="删除后将无法恢复"
            onConfirm={() => specGroupDeleteMutation.mutate(record.id)}
          >
            <PermissionButton
              type="link"
              size="small"
              danger
              permission={MALL.PRODUCT_SPEC_GROUP.REMOVE}
              icon={<DeleteOutlined />}
            >
              删除
            </PermissionButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // SKU 列配置
  const skuColumns: ProColumns<Sku>[] = [
    {
      title: 'SKU编码',
      dataIndex: 'skuCode',
      width: 150,
    },
    {
      title: '规格组合',
      dataIndex: 'specCombination',
      render: (specs: any) => {
        if (!specs || typeof specs !== 'object') return '-';
        return (
          <Space wrap size="small">
            {Object.entries(specs).map(([key, value]) => (
              <Tag key={key} color="blue">
                {key}: {String(value)}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
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
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => (
        <Space>
          <PermissionButton
            type="link"
            size="small"
            permission={MALL.PRODUCT_SKU.EDIT}
            icon={<EditOutlined />}
            onClick={() => {
              setEditingSku(record);
              setSkuModalOpen(true);
            }}
          >
            编辑
          </PermissionButton>
          <Popconfirm
            title="确认删除吗？"
            description="删除后将无法恢复"
            onConfirm={() => skuDeleteMutation.mutate(record.id)}
          >
            <PermissionButton
              type="link"
              size="small"
              danger
              permission={MALL.PRODUCT_SKU.REMOVE}
              icon={<DeleteOutlined />}
            >
              删除
            </PermissionButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 获取初始规格组合
  const getInitialSpecCombination = () => {
    const initialSpecs: Record<string, string> = {};
    specGroups.forEach((group) => {
      if (group.specValues && group.specValues.length > 0) {
        initialSpecs[group.name] = group.specValues[0].name;
      }
    });
    return initialSpecs;
  };

  return (
    <div className="sku-manage">
      <Row gutter={[16, 16]}>
        {/* 规格组管理 */}
        <Col span={24}>
          <Card size="small">
            <Title level={5} style={{ marginBottom: 16 }}>规格组管理</Title>
            <ProTable<SpecGroup>
              actionRef={specGroupTableRef}
              columns={specGroupColumns}
              rowKey="id"
              search={false}
              options={false}
              pagination={false}
              request={async () => {
                const res = await getProductSpecGroups({ productId });
                return {
                  data: res || [],
                  total: res?.length || 0,
                  success: true,
                };
              }}
              toolBarRender={() => [
                <PermissionButton
                  key="add"
                  type="primary"
                  permission={MALL.PRODUCT_SPEC_GROUP.ADD}
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingSpecGroup(null);
                    setSpecGroupModalOpen(true);
                  }}
                >
                  新增规格组
                </PermissionButton>,
              ]}
            />
          </Card>
        </Col>

        {/* SKU 管理 */}
        <Col span={24}>
          <Card size="small">
            <Title level={5} style={{ marginBottom: 16 }}>SKU 管理</Title>
            <ProTable<Sku>
              actionRef={skuTableRef}
              columns={skuColumns}
              rowKey="id"
              search={false}
              options={false}
              pagination={false}
              request={async () => {
                const res = await getProductSkus({ productId });
                return {
                  data: res?.data || [],
                  total: res?.total || 0,
                  success: true,
                };
              }}
              toolBarRender={() => [
                <PermissionButton
                  key="add"
                  type="primary"
                  permission={MALL.PRODUCT_SKU.ADD}
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingSku(null);
                    setSkuModalOpen(true);
                  }}
                >
                  新增SKU
                </PermissionButton>,
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 规格组弹窗 */}
      <ModalForm
        title={editingSpecGroup ? '编辑规格组' : '新增规格组'}
        open={specGroupModalOpen}
        onOpenChange={setSpecGroupModalOpen}
        initialValues={editingSpecGroup || { sort: 0 }}
        onFinish={async (values) => {
          await specGroupSaveMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
          width: 500,
        }}
      >
        <ProFormText
          name="name"
          label="规格组名称"
          placeholder="如：颜色、尺寸"
          rules={[{ required: true, message: '请输入规格组名称' }]}
        />
        <ProFormDigit
          name="sort"
          label="排序"
          placeholder="请输入排序号"
          min={0}
          fieldProps={{ precision: 0 }}
        />
      </ModalForm>

      {/* SKU 弹窗 */}
      <ModalForm
        title={editingSku ? '编辑SKU' : '新增SKU'}
        open={skuModalOpen}
        onOpenChange={setSkuModalOpen}
        initialValues={
          editingSku || {
            price: 0,
            stock: 0,
            specCombination: getInitialSpecCombination(),
          }
        }
        onFinish={async (values) => {
          await skuSaveMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
          width: 600,
        }}
      >
        <ProFormText
          name="skuCode"
          label="SKU编码"
          placeholder="请输入SKU编码"
          rules={[{ required: true, message: '请输入SKU编码' }]}
        />
        {/* 规格组合选择 */}
        {specGroups.map((group) => (
          <ProFormRadio.Group
            key={group.id}
            name={['specCombination', group.name]}
            label={group.name}
            rules={[{ required: true, message: `请选择${group.name}` }]}
            options={(group.specValues || []).map((v) => ({
              label: v.name,
              value: v.name,
            }))}
          />
        ))}
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
      </ModalForm>
    </div>
  );
};

export default ProductSKUManage;
