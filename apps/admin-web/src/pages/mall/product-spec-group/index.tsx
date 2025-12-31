import { useRef, useState } from 'react';
import { message, Space, Popconfirm, Tag, Modal, Input, Table, Tooltip } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormSelect,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import {
  getProductSpecGroups,
  createProductSpecGroup,
  updateProductSpecGroup,
  deleteProductSpecGroup,
  createProductSpecValue,
  bulkCreateProductSpecValues,
  updateProductSpecValue,
  deleteProductSpecValue,
  ProductSpecGroup as SpecGroup,
  ProductSpecValue as SpecValue,
} from '@/services/mall/product-sku';
import { productApi } from '@/services/mall/product';

export default function ProductSpecManagePage() {
  const actionRef = useRef<ProTableRef>(null);
  const queryClient = useQueryClient();

  // 规格组弹窗状态
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SpecGroup | null>(null);

  // 规格值管理弹窗状态
  const [valueManageModalOpen, setValueManageModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<SpecGroup | null>(null);

  // 规格值编辑弹窗状态
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<SpecValue | null>(null);

  // 批量添加规格值弹窗状态
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkValues, setBulkValues] = useState('');

  // 获取商品列表
  const { data: productList } = useQuery({
    queryKey: ['productListForSelect'],
    queryFn: () => productApi.list({ page: 1, pageSize: 1000 }),
  });

  // 规格组操作
  const saveGroupMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingGroup) {
        return updateProductSpecGroup(editingGroup.id, data);
      }
      return createProductSpecGroup(data);
    },
    onSuccess: () => {
      message.success(editingGroup ? '更新成功' : '创建成功');
      setGroupModalOpen(false);
      setEditingGroup(null);
      actionRef.current?.reload();
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: deleteProductSpecGroup,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  // 规格值操作
  const saveValueMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingValue) {
        return updateProductSpecValue(editingValue.id, data);
      }
      return createProductSpecValue(data);
    },
    onSuccess: () => {
      message.success(editingValue ? '更新成功' : '创建成功');
      setValueModalOpen(false);
      setEditingValue(null);
      // 刷新主表格以获取最新的规格值
      actionRef.current?.reload();
      // 更新当前规格组的规格值
      if (currentGroup) {
        queryClient.invalidateQueries({ queryKey: ['specGroupListForSelect'] });
      }
    },
  });

  const deleteValueMutation = useMutation({
    mutationFn: deleteProductSpecValue,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  const bulkSaveValueMutation = useMutation({
    mutationFn: bulkCreateProductSpecValues,
    onSuccess: () => {
      message.success('批量创建成功');
      setBulkModalOpen(false);
      setBulkValues('');
      actionRef.current?.reload();
    },
  });

  // 规格组操作处理
  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupModalOpen(true);
  };

  const handleEditGroup = (record: SpecGroup) => {
    setEditingGroup(record);
    setGroupModalOpen(true);
  };

  // 规格值管理操作处理
  const handleManageValues = (record: SpecGroup) => {
    setCurrentGroup(record);
    setValueManageModalOpen(true);
  };

  const handleAddValue = () => {
    setEditingValue(null);
    setValueModalOpen(true);
  };

  const handleEditValue = (record: SpecValue) => {
    setEditingValue(record);
    setValueModalOpen(true);
  };

  const handleBulkAddValue = () => {
    setBulkValues('');
    setBulkModalOpen(true);
  };

  const handleBulkSubmit = () => {
    if (!currentGroup) {
      message.warning('规格组信息丢失');
      return;
    }
    const values = bulkValues
      .split('\n')
      .filter((item: string) => item.trim())
      .map((item: string, index: number) => ({
        specGroupId: currentGroup.id,
        name: item.trim(),
        sort: index,
      }));
    if (values.length === 0) {
      message.warning('请输入规格值');
      return;
    }
    bulkSaveValueMutation.mutate(values);
  };

  // 规格值表格列
  const valueColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '规格值名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '操作',
      width: 150,
      render: (_: any, record: SpecValue) => (
        <Space>
          <PermissionButton
            permission={MALL.PRODUCT_SPEC_VALUE.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditValue(record)}
          >
            编辑
          </PermissionButton>
          <Popconfirm
            title="确认删除吗？"
            description="删除后无法恢复"
            onConfirm={() => {
              deleteValueMutation.mutate(record.id);
              // 更新当前组的规格值列表
              if (currentGroup) {
                setCurrentGroup({
                  ...currentGroup,
                  specValues: currentGroup.specValues.filter(v => v.id !== record.id),
                });
              }
            }}
            okText="删除"
            cancelText="取消"
          >
            <PermissionButton
              permission={MALL.PRODUCT_SPEC_VALUE.REMOVE}
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </PermissionButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 主表格列
  const columns: ProColumns<SpecGroup>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '商品',
      dataIndex: 'productId',
      width: 200,
      render: (productId: any) => {
        const product = productList?.data?.find((p: any) => p.id === productId);
        return product ? `${product.name} (${product.code || '-'})` : productId;
      },
      renderFormItem: () => (
        <ProFormSelect
          name="productId"
          placeholder="请选择商品"
          options={(productList?.data || []).map((p: any) => ({
            label: `${p.name} (${p.code || '-'})`,
            value: p.id,
          }))}
          fieldProps={{ allowClear: true }}
        />
      ),
    },
    {
      title: '规格组名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '规格值',
      dataIndex: 'specValues',
      width: 300,
      search: false,
      render: (_, record) => {
        const values = record.specValues || [];
        if (values.length === 0) {
          return <span style={{ color: '#999' }}>暂无规格值</span>;
        }
        const displayCount = 5;
        const displayValues = values.slice(0, displayCount);
        const moreCount = values.length - displayCount;
        return (
          <Space wrap size={4}>
            {displayValues.map((v: SpecValue) => (
              <Tag key={v.id} color="blue">
                {v.name}
              </Tag>
            ))}
            {moreCount > 0 && (
              <Tooltip title={values.slice(displayCount).map((v: SpecValue) => v.name).join('、')}>
                <Tag>+{moreCount}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      search: false,
      align: 'center',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <PermissionButton
            permission={MALL.PRODUCT_SPEC_VALUE.LIST}
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleManageValues(record)}
          >
            规格值
          </PermissionButton>
          <PermissionButton
            permission={MALL.PRODUCT_SPEC_GROUP.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditGroup(record)}
          >
            编辑
          </PermissionButton>
          <Popconfirm
            title="确认删除吗？"
            description="删除后无法恢复，该规格组下的所有规格值也会被删除"
            onConfirm={() => deleteGroupMutation.mutate(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <PermissionButton
              permission={MALL.PRODUCT_SPEC_GROUP.REMOVE}
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </PermissionButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<SpecGroup>
        headerTitle="商品规格管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1200 }}
        request={async (params) => {
          const { current, pageSize, productId, name } = params;
          const res = await getProductSpecGroups({ productId: productId || 0 });
          let list = res || [];
          // 过滤名称
          if (name) {
            list = list.filter((item: SpecGroup) => item.name.includes(name));
          }
          // 前端分页
          const start = ((current || 1) - 1) * (pageSize || 10);
          const end = start + (pageSize || 10);
          return {
            data: list.slice(start, end),
            total: list.length,
            success: true,
          };
        }}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MALL.PRODUCT_SPEC_GROUP.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddGroup}
          >
            新增规格组
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      {/* 规格组新增/编辑弹窗 */}
      <ModalForm
        title={editingGroup ? '编辑规格组' : '新增规格组'}
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        initialValues={editingGroup || { sort: 0 }}
        onFinish={async (values) => {
          await saveGroupMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
          width: 500,
        }}
      >
        <ProFormSelect
          name="productId"
          label="商品"
          placeholder="请选择商品"
          rules={[{ required: true, message: '请选择商品' }]}
          options={(productList?.data || []).map((p: any) => ({
            label: `${p.name} (${p.code || '-'})`,
            value: p.id,
          }))}
        />
        <ProFormText
          name="name"
          label="规格组名称"
          placeholder="如：颜色、尺寸"
          rules={[
            { required: true, message: '请输入规格组名称' },
            { max: 50, message: '名称不能超过50个字符' },
          ]}
        />
        <ProFormDigit
          name="sort"
          label="排序"
          placeholder="请输入排序号"
          min={0}
          fieldProps={{ precision: 0 }}
        />
      </ModalForm>

      {/* 规格值管理弹窗 */}
      <Modal
        title={
          <Space>
            <span>规格值管理</span>
            {currentGroup && (
              <Tag color="blue">{currentGroup.name}</Tag>
            )}
          </Space>
        }
        open={valueManageModalOpen}
        onCancel={() => {
          setValueManageModalOpen(false);
          setCurrentGroup(null);
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <PermissionButton
              permission={MALL.PRODUCT_SPEC_VALUE.ADD}
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddValue}
            >
              新增规格值
            </PermissionButton>
            <PermissionButton
              permission={MALL.PRODUCT_SPEC_VALUE.ADD}
              icon={<PlusOutlined />}
              onClick={handleBulkAddValue}
            >
              批量添加
            </PermissionButton>
          </Space>
        </div>
        <Table
          dataSource={currentGroup?.specValues || []}
          columns={valueColumns}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: '暂无规格值，请点击上方按钮添加' }}
        />
      </Modal>

      {/* 规格值新增/编辑弹窗 */}
      <ModalForm
        title={editingValue ? '编辑规格值' : '新增规格值'}
        open={valueModalOpen}
        onOpenChange={setValueModalOpen}
        initialValues={editingValue || { sort: (currentGroup?.specValues?.length || 0) }}
        onFinish={async (values) => {
          await saveValueMutation.mutateAsync({
            ...values,
            specGroupId: currentGroup?.id,
          });
          // 更新当前组的规格值列表
          if (currentGroup) {
            const newValue = { ...values, id: Date.now(), specGroupId: currentGroup.id };
            if (editingValue) {
              setCurrentGroup({
                ...currentGroup,
                specValues: currentGroup.specValues.map(v =>
                  v.id === editingValue.id ? { ...v, ...values } : v
                ),
              });
            } else {
              setCurrentGroup({
                ...currentGroup,
                specValues: [...currentGroup.specValues, newValue as SpecValue],
              });
            }
          }
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
          label="规格值名称"
          placeholder="如：红色、蓝色"
          rules={[
            { required: true, message: '请输入规格值名称' },
            { max: 50, message: '名称不能超过50个字符' },
          ]}
        />
        <ProFormDigit
          name="sort"
          label="排序"
          placeholder="请输入排序号"
          min={0}
          fieldProps={{ precision: 0 }}
        />
      </ModalForm>

      {/* 批量添加规格值弹窗 */}
      <Modal
        title="批量添加规格值"
        open={bulkModalOpen}
        onCancel={() => setBulkModalOpen(false)}
        onOk={handleBulkSubmit}
        confirmLoading={bulkSaveValueMutation.isPending}
        width={500}
      >
        <div style={{ marginBottom: 8, color: '#666' }}>
          每行输入一个规格值，会自动按顺序排序
        </div>
        <Input.TextArea
          rows={8}
          value={bulkValues}
          onChange={(e) => setBulkValues(e.target.value)}
          placeholder={`例如：\n红色\n蓝色\n绿色\n黑色`}
        />
      </Modal>
    </>
  );
}
