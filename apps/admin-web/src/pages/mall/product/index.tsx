import { useRef, useState, useEffect } from 'react';
import { message, Modal, Space, Tag, Table, Button, Input, Popconfirm, Empty, Tabs, Card, Switch, Upload, Form } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  TagOutlined,
  CopyOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormSelect,
  ProFormGroup,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  productApi,
  Product,
  ProductForm,
  ProductStatus,
  ProductSpecGroup,
  ProductSku,
  getProductSpecGroups,
  createProductSpecGroup,
  updateProductSpecGroup,
  deleteProductSpecGroup,
  createProductSpecValue,
  deleteProductSpecValue,
  bulkCreateProductSkus,
} from '@/services/mall/product';
import { categoryApi, Category } from '@/services/mall/category';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { uploadImage } from '@/services/upload';

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
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [editingRecord, setEditingRecord] = useState<Product | null>(null);
  const [skuList, setSkuList] = useState<ProductSku[]>([]);
  const [specGroups, setSpecGroups] = useState<ProductSpecGroup[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 获取分类列表
  const { data: categoryList } = useQuery({
    queryKey: ['categoryList'],
    queryFn: () => categoryApi.list(),
  });

  // 加载商品详情（包含关联数据）
  const loadProductDetail = async (id: number) => {
    const res = await productApi.get(id);
    return res;
  };

  // 处理编辑
  const handleEdit = async (record: Product) => {
    setEditingRecord(record);
    setActiveTab('basic');

    // 加载商品详情获取关联数据
    const detail = await loadProductDetail(record.id);
    setSkuList(detail.skus || []);
    setSpecGroups(detail.specGroups || []);

    setModalOpen(true);
  };

  // 处理新增
  const handleAdd = () => {
    setEditingRecord(null);
    setSkuList([]);
    setSpecGroups([]);
    setActiveTab('basic');
    setModalOpen(true);
  };

  // 处理复制
  const duplicateMutation = useMutation({
    mutationFn: productApi.duplicate,
    onSuccess: () => {
      message.success('商品复制成功');
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '复制失败');
    },
  });

  const handleDuplicate = (record: Product) => {
    Modal.confirm({
      title: '确认复制',
      content: `确定要复制「${record.name}」吗？复制后将成为一个新的草稿商品。`,
      onOk: () => duplicateMutation.mutate(record.id),
    });
  };

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      if (editingRecord) {
        return productApi.update(editingRecord.id, data);
      }
      return productApi.create(data);
    },
    onSuccess: (res) => {
      message.success(editingRecord ? '更新成功' : '创建成功');

      // 如果是新建商品，切换到规格管理 Tab 并加载数据
      if (!editingRecord && res.id) {
        setEditingRecord(res);
        setActiveTab('spec');
        setSkuList([]);
        setSpecGroups([]);
        loadProductDetail(res.id).then(detail => {
          setSkuList(detail.skus || []);
          setSpecGroups(detail.specGroups || []);
        });
        // 刷新表格
        actionRef.current?.reload();
        return;
      }

      setModalOpen(false);
      setEditingRecord(null);
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '操作失败');
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '删除失败');
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
    onError: (error: any) => {
      message.error(error?.message || '状态修改失败');
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
    onError: (error: any) => {
      message.error(error?.message || '批量操作失败');
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => productApi.delete(id)));
    },
    onSuccess: () => {
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '批量删除失败');
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
      render: (_, record) => (
        record.mainImage ? (
          <img
            src={record.mainImage}
            alt="商品图"
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div style={{ width: 60, height: 60, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#999', fontSize: 12 }}>暂无图</span>
          </div>
        )
      ),
      search: false,
    },
    {
      title: '商品信息',
      dataIndex: 'name',
      width: 250,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>编码: {record.code || '-'}</div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      width: 120,
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-',
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
            <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
              ¥{formatPrice(price)}
            </div>
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
        return (
          <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
            {stock}
          </Tag>
        );
      },
      search: false,
    },
    {
      title: 'SKU',
      dataIndex: 'skus',
      width: 80,
      align: 'center',
      search: false,
      render: (_, record) => (
        <Tag color="purple">{record.skus?.length || 0}</Tag>
      ),
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
      width: 380,
      fixed: 'right',
      render: (_, record) => {
        console.log('操作列渲染, record:', record);
        return (
        <Space>
          <PermissionButton
            permission={MALL.PRODUCT.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={MALL.PRODUCT_SPEC_GROUP.LIST}
            type="link"
            size="small"
            icon={<AppstoreOutlined />}
            onClick={() => {
              setEditingRecord(record);
              setModalOpen(true);
              setActiveTab('spec');
            }}
          >
            商品规格
          </PermissionButton>
          <PermissionButton
            permission={MALL.PRODUCT_SKU.LIST}
            type="link"
            size="small"
            icon={<TagOutlined />}
            onClick={() => {
              setEditingRecord(record);
              setModalOpen(true);
              setActiveTab('sku');
            }}
          >
            SKU管理
          </PermissionButton>
          <PermissionButton
            permission={MALL.PRODUCT.ADD}
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleDuplicate(record)}
          >
            复制
          </PermissionButton>
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
        </Space>
        );
      },
    },
  ];

  // Tab 切换时加载数据
  useEffect(() => {
    if (modalOpen && editingRecord && (activeTab === 'spec' || activeTab === 'sku')) {
      loadProductDetail(editingRecord.id).then(detail => {
        setSkuList(detail.skus || []);
        setSpecGroups(detail.specGroups || []);
      });
    }
  }, [modalOpen, activeTab, editingRecord?.id]);

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

      <ModalForm<ProductForm>
        title={editingRecord ? '编辑商品' : '新增商品'}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditingRecord(null);
            setSkuList([]);
            setSpecGroups([]);
          }
        }}
        initialValues={editingRecord || {
          sort: 0,
          status: 'ON_SHELF' as ProductStatus,
          defaultStock: 0,
          sales: 0,
          mainImages: [],
        }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
          width: 1000,
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: (
                <>
                  <ProFormGroup title="基本信息">
                    <ProFormText
                      name="name"
                      label="商品名称"
                      placeholder="请输入商品名称"
                      rules={[{ required: true, message: '请输入商品名称' }]}
                      colProps={{ span: 12 }}
                    />
                    <ProFormText
                      name="code"
                      label="商品编码"
                      placeholder="请输入商品编码"
                      colProps={{ span: 12 }}
                    />
                    <ProFormSelect
                      name="categoryId"
                      label="商品分类"
                      placeholder="请选择商品分类"
                      options={(categoryList?.list || []).map((cat: Category) => ({
                        label: cat.name,
                        value: cat.id,
                      }))}
                      colProps={{ span: 12 }}
                    />
                    <ProFormDigit
                      name="sort"
                      label="排序"
                      placeholder="请输入排序号"
                      min={0}
                      fieldProps={{ precision: 0 }}
                      colProps={{ span: 12 }}
                    />
                  </ProFormGroup>

                  <ProFormGroup title="价格库存">
                    <ProFormDigit
                      name="originalPrice"
                      label="原价"
                      placeholder="请输入原价"
                      min={0}
                      fieldProps={{
                        precision: 2,
                        prefix: '¥'
                      }}
                      colProps={{ span: 12 }}
                    />
                    <ProFormDigit
                      name="defaultPrice"
                      label="现价"
                      placeholder="请输入现价"
                      min={0}
                      fieldProps={{
                        precision: 2,
                        prefix: '¥'
                      }}
                      colProps={{ span: 12 }}
                    />
                    <ProFormDigit
                      name="defaultStock"
                      label="库存"
                      placeholder="请输入库存数量"
                      min={0}
                      fieldProps={{ precision: 0 }}
                      colProps={{ span: 12 }}
                    />
                    <ProFormDigit
                      name="sales"
                      label="销量"
                      placeholder="请输入销量"
                      min={0}
                      fieldProps={{ precision: 0 }}
                      colProps={{ span: 12 }}
                    />
                  </ProFormGroup>

                  <ProFormGroup title="商品详情">
                    <ProFormSelect
                      name="status"
                      label="销售状态"
                      options={[
                        { label: '上架', value: 'ON_SHELF' },
                        { label: '下架', value: 'OFF_SHELF' },
                        { label: '草稿', value: 'DRAFT' },
                      ]}
                      colProps={{ span: 12 }}
                    />
                    <ProFormText
                      name="unit"
                      label="单位"
                      placeholder="如：件、个、箱"
                      colProps={{ span: 12 }}
                    />
                    <Form.Item
                      name="content"
                      label="商品详情"
                      style={{ width: '100%' }}
                    >
                      <Input.TextArea
                        placeholder="请输入商品详情描述"
                        autoSize={{ minRows: 4, maxRows: 10 }}
                      />
                    </Form.Item>
                  </ProFormGroup>

                  <ProFormGroup title="商品图片">
                    <div style={{ display: 'flex', gap: 40 }}>
                      {/* 主图上传 */}
                      <div>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>商品主图</div>
                        <Form.Item name="mainImage" noStyle>
                          <SingleImageUpload />
                        </Form.Item>
                        <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                          建议尺寸：800x800像素
                        </div>
                      </div>
                      {/* 附图/轮播图上传 */}
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>商品附图/轮播图</div>
                        <Form.Item name="images" noStyle>
                          <MultiImageUpload />
                        </Form.Item>
                        <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                          最多可上传 9 张图片
                        </div>
                      </div>
                    </div>
                  </ProFormGroup>
                </>
              ),
            },
            {
              key: 'spec',
              label: (
                <span>
                  <AppstoreOutlined />
                  规格管理
                </span>
              ),
              children: (
                <SpecGroupTab
                  productId={editingRecord?.id}
                  specGroups={specGroups}
                  onSpecGroupsChange={setSpecGroups}
                  onRefreshProductDetail={() => {
                    if (editingRecord?.id) {
                      loadProductDetail(editingRecord.id).then(detail => {
                        setSkuList(detail.skus || []);
                        setSpecGroups(detail.specGroups || []);
                      });
                    }
                  }}
                />
              ),
            },
            {
              key: 'sku',
              label: (
                <span>
                  <TagOutlined />
                  SKU管理
                </span>
              ),
              children: (
                <SkuManageTab
                  productId={editingRecord?.id}
                  skuList={skuList}
                  specGroups={specGroups}
                  onSkuChange={setSkuList}
                />
              ),
            },
          ]}
        />
      </ModalForm>
    </>
  );
}

// 单图上传组件
function SingleImageUpload() {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldValue }) => {
        const mainImage = getFieldValue('mainImage');

        const handleUpload = async (file: File) => {
          setLoading(true);
          try {
            const res = await uploadImage(file);
            // 设置主图
            const input = document.querySelector('[name="mainImage"]') as HTMLInputElement;
            if (input) {
              input.value = res.url;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          } catch (error) {
            message.error('上传失败');
          } finally {
            setLoading(false);
          }
        };

        const handleRemove = () => {
          const input = document.querySelector('[name="mainImage"]') as HTMLInputElement;
          if (input) {
            input.value = '';
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        };

        const handlePreview = () => {
          if (mainImage) {
            setPreviewImage(mainImage);
            setPreviewOpen(true);
          }
        };

        return (
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <Upload
              listType="picture-card"
              showUploadList={false}
              accept="image/*"
              maxCount={1}
              customRequest={async ({ file, onSuccess, onError }) => {
                try {
                  await handleUpload(file as File);
                  onSuccess?.({ url: '' });
                } catch (error) {
                  onError?.(error as Error);
                }
              }}
            >
              {mainImage ? (
                <img
                  src={mainImage}
                  alt="主图"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : loading ? (
                <span>上传中...</span>
              ) : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
            {mainImage && (
              <>
                <PermissionButton
                  type="primary"
                  danger
                  size="small"
                  shape="circle"
                  permission={MALL.PRODUCT.EDIT}
                  icon={<span style={{ fontSize: 12 }}>×</span>}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    padding: 0,
                  }}
                  onClick={handleRemove}
                >
                  <span style={{ fontSize: 12 }}>×</span>
                </PermissionButton>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: 11,
                    padding: '2px 0',
                    cursor: 'pointer',
                  }}
                  onClick={handlePreview}
                >
                  预览
                </div>
              </>
            )}
            <Modal
              open={previewOpen}
              title="主图预览"
              footer={null}
              onCancel={() => setPreviewOpen(false)}
              width={600}
            >
              <img
                alt="主图"
                style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }}
                src={previewImage}
              />
            </Modal>
          </div>
        );
      }}
    </Form.Item>
  );
}

// 多图上传组件（附图/轮播图）
function MultiImageUpload() {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldValue }) => {
        const images: string[] = getFieldValue('images') || [];

        const handleUpload = async (file: File) => {
          setLoading(true);
          try {
            const res = await uploadImage(file);
            const newImages = [...(images || []), res.url].slice(0, 9); // 最多9张
            const input = document.querySelector('[name="images"]') as HTMLInputElement;
            if (input) {
              input.value = JSON.stringify(newImages);
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          } catch (error) {
            message.error('上传失败');
          } finally {
            setLoading(false);
          }
        };

        const handleRemove = (index: number) => {
          const newImages = images.filter((_, i) => i !== index);
          const input = document.querySelector('[name="images"]') as HTMLInputElement;
          if (input) {
            input.value = JSON.stringify(newImages);
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        };

        const handlePreview = (url: string) => {
          setPreviewImage(url);
          setPreviewOpen(true);
        };

        return (
          <div style={{ width: '100%' }}>
            <Upload
              listType="picture-card"
              showUploadList={false}
              accept="image/*"
              disabled={images.length >= 9}
              customRequest={async ({ file, onSuccess, onError }) => {
                try {
                  await handleUpload(file as File);
                  onSuccess?.({ url: '' });
                } catch (error) {
                  onError?.(error as Error);
                }
              }}
            >
              {loading ? (
                <span>上传中...</span>
              ) : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>

            {images.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {images.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      width: 80,
                      height: 80,
                      border: '1px solid #d9d9d9',
                      borderRadius: 6,
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                    onClick={() => handlePreview(url)}
                  >
                    <img
                      src={url}
                      alt={`附图${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.5)',
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: 10,
                        padding: '1px 0',
                      }}
                    >
                      {index + 1}
                    </div>
                    <PermissionButton
                      type="primary"
                      danger
                      size="small"
                      shape="circle"
                      permission={MALL.PRODUCT.EDIT}
                      icon={<span style={{ fontSize: 12 }}>×</span>}
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        width: 16,
                        height: 16,
                        padding: 0,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(index);
                      }}
                    >
                      <span style={{ fontSize: 12 }}>×</span>
                    </PermissionButton>
                  </div>
                ))}
              </div>
            )}

            <Modal
              open={previewOpen}
              title="附图预览"
              footer={null}
              onCancel={() => setPreviewOpen(false)}
              width={600}
            >
              <img
                alt="附图"
                style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }}
                src={previewImage}
              />
            </Modal>
          </div>
        );
      }}
    </Form.Item>
  );
}

// 规格组管理 Tab
function SpecGroupTab({
  productId,
  specGroups,
  onSpecGroupsChange,
  onRefreshProductDetail,
}: {
  productId?: number;
  specGroups: ProductSpecGroup[];
  onSpecGroupsChange: (groups: ProductSpecGroup[]) => void;
  onRefreshProductDetail?: () => void;
}) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newValueNames, setNewValueNames] = useState<Record<number, string>>({});

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      message.warning('请输入规格组名称');
      return;
    }
    if (!productId) {
      message.warning('请先保存商品基本信息');
      return;
    }
    try {
      await createProductSpecGroup({
        productId,
        name: newGroupName.trim(),
        sort: specGroups.length,
      });
      message.success('添加成功');
      setNewGroupName('');
      // 刷新列表
      console.log('刷新规格组列表，productId:', productId);
      const res = await getProductSpecGroups({ productId });
      console.log('规格组列表响应:', res);
      if (res.data) {
        onSpecGroupsChange(res.data);
      }
      // 刷新商品详情以确保数据同步
      if (onRefreshProductDetail) {
        onRefreshProductDetail();
      }
    } catch (error) {
      console.error('添加规格组失败:', error);
      message.error('添加失败');
    }
  };

  const handleUpdateGroup = async (id: number, name: string, sort: number) => {
    try {
      await updateProductSpecGroup(id, { name, sort });
      message.success('更新成功');
      setEditingRow(null);
      // 刷新列表
      if (productId) {
        const res = await getProductSpecGroups({ productId });
        if (res.data) {
          onSpecGroupsChange(res.data);
        }
        // 刷新商品详情以确保数据同步
        if (onRefreshProductDetail) {
          onRefreshProductDetail();
        }
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      await deleteProductSpecGroup(id);
      message.success('删除成功');
      // 刷新列表
      if (productId) {
        const res = await getProductSpecGroups({ productId });
        if (res.data) {
          onSpecGroupsChange(res.data);
        }
        // 刷新商品详情以确保数据同步
        if (onRefreshProductDetail) {
          onRefreshProductDetail();
        }
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleAddValue = async (specGroupId: number) => {
    const name = newValueNames[specGroupId]?.trim();
    if (!name) {
      message.warning('请输入规格值');
      return;
    }
    try {
      await createProductSpecValue({
        specGroupId,
        name,
        sort: 0,
      });
      message.success('添加成功');
      setNewValueNames(prev => ({ ...prev, [specGroupId]: '' }));
      // 刷新列表
      if (productId) {
        const res = await getProductSpecGroups({ productId });
        if (res.data) {
          onSpecGroupsChange(res.data);
        }
        // 刷新商品详情以确保数据同步
        if (onRefreshProductDetail) {
          onRefreshProductDetail();
        }
      }
      if (productId) {
        const res = await getProductSpecGroups({ productId });
        if (res.data) {
          onSpecGroupsChange(res.data);
        }
      }
      // 刷新商品详情以确保数据同步
      if (onRefreshProductDetail) {
        onRefreshProductDetail();
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleDeleteValue = async (id: number) => {
    try {
      await deleteProductSpecValue(id);
      message.success('删除成功');
      // 刷新列表
      if (productId) {
        const res = await getProductSpecGroups({ productId });
        if (res.data) {
          onSpecGroupsChange(res.data);
        }
        // 刷新商品详情以确保数据同步
        if (onRefreshProductDetail) {
          onRefreshProductDetail();
        }
      }
      if (productId) {
        const res = await getProductSpecGroups({ productId });
        if (res.data) {
          onSpecGroupsChange(res.data);
        }
      }
      // 刷新商品详情以确保数据同步
      if (onRefreshProductDetail) {
        onRefreshProductDetail();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Input
          placeholder="新规格组名称"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onPressEnter={handleAddGroup}
          style={{ width: 200 }}
        />
        <PermissionButton
          type="primary"
          permission={MALL.PRODUCT_SPEC_GROUP.ADD}
          icon={<PlusOutlined />}
          onClick={handleAddGroup}
        >
          添加规格组
        </PermissionButton>
        {!productId && (
          <span style={{ color: '#999', marginLeft: 8 }}>（请先保存商品基本信息）</span>
        )}
      </div>

      {specGroups.length === 0 ? (
        <Empty description="暂无规格组" />
      ) : (
        specGroups.map((group) => (
          <Card
            key={group.id}
            size="small"
            style={{ marginBottom: 16 }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {editingRow === group.id ? (
                  <>
                    <Input
                      defaultValue={group.name}
                      style={{ width: 150 }}
                      id={`group-name-${group.id}`}
                    />
                    <PermissionButton
                      type="link"
                      size="small"
                      permission={MALL.PRODUCT_SPEC_GROUP.EDIT}
                      onClick={() => {
                        const input = document.getElementById(`group-name-${group.id}`) as HTMLInputElement;
                        handleUpdateGroup(group.id, input?.value || group.name, group.sort);
                      }}
                    >
                      保存
                    </PermissionButton>
                    <Button type="link" size="small" onClick={() => setEditingRow(null)}>
                      取消
                    </Button>
                  </>
                ) : (
                  <>
                    <span>{group.name}</span>
                    <a onClick={() => setEditingRow(group.id)}>编辑</a>
                    <Popconfirm
                      title="确认删除"
                      description="删除规格组将同时删除其下所有规格值"
                      onConfirm={() => handleDeleteGroup(group.id)}
                    >
                      <a style={{ color: '#ff4d4f' }}>删除</a>
                    </Popconfirm>
                  </>
                )}
              </div>
            }
          >
            {/* 规格值列表 */}
            <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(group.specValues || []).map((value) => (
                <Tag
                  key={value.id}
                  closable
                  onClose={() => handleDeleteValue(value.id)}
                >
                  {value.name}
                </Tag>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                placeholder="添加规格值"
                value={newValueNames[group.id] || ''}
                onChange={(e) => setNewValueNames(prev => ({ ...prev, [group.id]: e.target.value }))}
                onPressEnter={() => handleAddValue(group.id)}
                style={{ width: 150 }}
              />
              <PermissionButton
                size="small"
                permission={MALL.PRODUCT_SPEC_VALUE.ADD}
                icon={<PlusOutlined />}
                onClick={() => handleAddValue(group.id)}
              >
                添加
              </PermissionButton>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// SKU 管理 Tab
function SkuManageTab({
  productId,
  skuList,
  specGroups,
  onSkuChange,
}: {
  productId?: number;
  skuList: ProductSku[];
  specGroups: ProductSpecGroup[];
  onSkuChange: (skus: ProductSku[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [generatedSkus, setGeneratedSkus] = useState<any[]>([]);
  const [baseSkuCode, setBaseSkuCode] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [baseStock, setBaseStock] = useState(0);

  // 根据选中的规格生成 SKU 组合
  useEffect(() => {
    const groups = specGroups.filter(g => selectedSpecs[g.name]);
    if (groups.length === 0) {
      setGeneratedSkus([]);
      return;
    }

    // 获取每个规格组选中的规格值
    const valueOptions: string[][] = [];
    groups.forEach(group => {
      const selectedValue = selectedSpecs[group.name];
      const values = group.specValues
        ?.filter(v => v.name === selectedValue)
        .map(v => v.name) || [];
      valueOptions.push(values.length > 0 ? values : group.specValues?.map(v => v.name) || []);
    });

    // 生成所有组合
    const combinations: Record<string, string>[] = [];

    function generate(index: number, current: Record<string, string>) {
      if (index === groups.length) {
        combinations.push({ ...current });
        return;
      }

      const group = groups[index];
      const groupName = group.name;
      const values = valueOptions[index] || [];

      for (const value of values) {
        current[groupName] = value;
        generate(index + 1, current);
      }
    }

    generate(0, {});

    // 生成 SKU 对象
    const skus = combinations.map((combo, index) => ({
      productId: productId || 0,
      skuCode: baseSkuCode ? `${baseSkuCode}-${index + 1}` : `SKU-${Date.now()}-${index + 1}`,
      specCombination: combo,
      price: basePrice,
      stock: baseStock,
      sales: 0,
    }));

    setGeneratedSkus(skus);
  }, [selectedSpecs, specGroups, baseSkuCode, basePrice, baseStock]);

  const handleGenerateSkus = async () => {
    if (!productId) {
      message.warning('请先保存商品基本信息');
      return;
    }
    if (generatedSkus.length === 0) {
      message.warning('请先选择规格');
      return;
    }

    setLoading(true);
    try {
      await bulkCreateProductSkus(generatedSkus);
      message.success(`成功生成 ${generatedSkus.length} 个 SKU`);

      // 刷新 SKU 列表
      const res = await fetch(`/api/mall/product-sku?productId=${productId}`).then(r => r.json());
      if (res.data) {
        onSkuChange(res.data);
      }

      // 清空选择
      setSelectedSpecs({});
      setGeneratedSkus([]);
      setBaseSkuCode('');
      setBasePrice(0);
      setBaseStock(0);
    } catch (error) {
      message.error('生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 简单数字输入组件
  const SimpleInputNumber = ({ value, onChange, min = 0, precision, style, placeholder }: any) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value) || 0;
      onChange(val);
    };
    return (
      <input
        type="number"
        min={min}
        step={precision ? `0.${'0'.repeat(precision - 1)}1` : '1'}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ padding: '4px 8px', width: style?.width || 100, ...style }}
      />
    );
  };

  return (
    <div>
      {/* 规格选择 */}
      <div style={{ marginBottom: 16 }}>
        <h4>选择规格生成 SKU</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {specGroups.length === 0 ? (
            <span style={{ color: '#999' }}>暂无规格，请先在"规格管理"Tab中添加规格组和规格值</span>
          ) : (
            specGroups.map((group) => (
              <div key={group.id} style={{ minWidth: 150 }}>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>{group.name}</div>
                <select
                  value={selectedSpecs[group.name] || ''}
                  onChange={(e) => setSelectedSpecs(prev => ({ ...prev, [group.name]: e.target.value }))}
                  style={{ width: '100%', padding: '4px 8px' }}
                >
                  <option value="">请选择</option>
                  {(group.specValues || []).map((value) => (
                    <option key={value.id} value={value.name}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 批量设置 */}
      {Object.keys(selectedSpecs).length > 0 && (
        <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <h4>批量设置</h4>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <span style={{ marginRight: 8 }}>基础 SKU 编码：</span>
              <Input
                placeholder="如：PRODUCT-001"
                value={baseSkuCode}
                onChange={(e) => setBaseSkuCode(e.target.value)}
                style={{ width: 150 }}
              />
            </div>
            <div>
              <span style={{ marginRight: 8 }}>价格：</span>
              <SimpleInputNumber
                min={0}
                precision={2}
                value={basePrice}
                onChange={(v: number) => setBasePrice(v)}
                style={{ width: 100 }}
              />
            </div>
            <div>
              <span style={{ marginRight: 8 }}>库存：</span>
              <SimpleInputNumber
                min={0}
                value={baseStock}
                onChange={(v: number) => setBaseStock(v)}
                style={{ width: 100 }}
              />
            </div>
            <PermissionButton
              type="primary"
              permission={MALL.PRODUCT_SKU.ADD}
              onClick={handleGenerateSkus}
              loading={loading}
            >
              生成 {generatedSkus.length} 个 SKU
            </PermissionButton>
          </div>
        </div>
      )}

      {/* SKU 预览 */}
      {generatedSkus.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4>将生成的 SKU 预览</h4>
          <Table
            size="small"
            dataSource={generatedSkus.slice(0, 10)}
            rowKey={(_, index) => index ?? 0}
            columns={[
              { title: 'SKU 编码', dataIndex: 'skuCode', width: 150 },
              {
                title: '规格',
                dataIndex: 'specCombination',
                render: (specs: Record<string, string>) => (
                  <Space size={4}>
                    {Object.entries(specs).map(([k, v]) => (
                      <Tag key={k} color="blue">{k}: {v}</Tag>
                    ))}
                  </Space>
                ),
              },
              { title: '价格', dataIndex: 'price', render: (v: number) => `¥${v}` },
              { title: '库存', dataIndex: 'stock' },
            ]}
            pagination={false}
          />
          {generatedSkus.length > 10 && (
            <div style={{ textAlign: 'center', color: '#999', marginTop: 8 }}>
              还有 {generatedSkus.length - 10} 个 SKU...
            </div>
          )}
        </div>
      )}

      {/* 已有 SKU 列表 */}
      <h4>已有 SKU ({skuList.length})</h4>
      {skuList.length === 0 ? (
        <Empty description="暂无 SKU，请先配置规格并生成" />
      ) : (
        <Table
          size="small"
          dataSource={skuList}
          rowKey="id"
          columns={[
            { title: 'SKU 编码', dataIndex: 'skuCode', width: 150 },
            {
              title: '规格组合',
              dataIndex: 'specCombination',
              render: (_, record) => {
                const specs = record.specCombination;
                if (!specs || Object.keys(specs).length === 0) return '-';
                return (
                  <Space size={4}>
                    {Object.entries(specs).map(([key, value]) => (
                      <Tag key={key} color="blue">{key}: {value}</Tag>
                    ))}
                  </Space>
                );
              },
            },
            {
              title: '价格',
              dataIndex: 'price',
              width: 100,
              render: (_, record) => `¥${toNumber(record.price).toFixed(2)}`,
            },
            { title: '库存', dataIndex: 'stock', width: 80 },
          ]}
          pagination={{ pageSize: 5 }}
        />
      )}
    </div>
  );
}
