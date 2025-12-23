import { useRef, useState } from 'react';
import { message, Modal, Space, Tag } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  BranchesOutlined
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
  ProFormGroup,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { categoryApi, Category, CategoryForm } from '@/services/mall/category';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';

export default function CategoryPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Category | null>(null);

  // 获取分类列表（用于选择父分类） - 暂时注释掉
  // const { data: categoryList } = useQuery({
  //   queryKey: ['categoryList'],
  //   queryFn: () => categoryApi.list(),
  // });

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: CategoryForm) => {
      if (editingRecord) {
        return categoryApi.update(editingRecord.id, data);
      }
      return categoryApi.create(data);
    },
    onSuccess: () => {
      message.success(editingRecord ? '更新成功' : '创建成功');
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
    mutationFn: categoryApi.delete,
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

  const handleEdit = (record: Category) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const renderCategoryName = (record: Category) => {
    const indent = record.level ? '　'.repeat((record.level - 1) * 2) : '';
    return (
      <div>
        <span style={{ marginRight: 8 }}>
          {(record.level || 0) > 1 ? <BranchesOutlined style={{ color: '#1890ff' }} /> : <FolderOutlined style={{ color: '#faad14' }} />}
        </span>
        {indent}
        <span style={{ fontWeight: 500 }}>{record.name}</span>
        {(record.level || 0) > 1 && (
          <Tag color="purple" style={{ marginLeft: 8 }}>
            {record.level}级
          </Tag>
        )}
      </div>
    );
  };

  const columns: ProColumns<Category>[] = [
    {
      title: '分类名称',
      dataIndex: 'name',
      width: 300,
      render: (_, record) => renderCategoryName(record),
    },
    {
      title: '分类编码',
      dataIndex: 'code',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '层级',
      dataIndex: 'level',
      width: 80,
      search: false,
      align: 'center',
      render: (level) => level ? `第${level}级` : '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      search: false,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        ENABLED: { text: '启用', status: 'Success' },
        DISABLED: { text: '禁用', status: 'Error' },
      },
    },
    {
      title: '描述',
      dataIndex: 'content',
      width: 200,
      ellipsis: true,
      search: false,
      render: (text) => text || '-',
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
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <PermissionButton
            permission={MALL.CATEGORY.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={MALL.CATEGORY.REMOVE}
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </PermissionButton>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable
        headerTitle="商品分类管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1200 }}
        api="/mall/category"
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MALL.CATEGORY.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增分类
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ModalForm<CategoryForm>
        title={editingRecord ? '编辑商品分类' : '新增商品分类'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={editingRecord || {
          sort: 0,
          status: 'ENABLED',
          level: 1
        }}
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
        <ProFormGroup title="基本信息">
          <ProFormText
            name="name"
            label="分类名称"
            placeholder="请输入分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
            colProps={{ span: 24 }}
          />
          <ProFormText
            name="code"
            label="分类编码"
            placeholder="请输入分类编码"
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
          <ProFormSelect
            name="status"
            label="状态"
            options={[
              { label: '启用', value: 'ENABLED' },
              { label: '禁用', value: 'DISABLED' },
            ]}
            colProps={{ span: 12 }}
          />
          <ProFormDigit
            name="level"
            label="层级"
            placeholder="请输入层级"
            min={1}
            max={5}
            fieldProps={{ precision: 0 }}
            colProps={{ span: 12 }}
          />
        </ProFormGroup>

        <ProFormGroup title="分类详情">
          <ProFormTextArea
            name="content"
            label="分类描述"
            placeholder="请输入分类描述"
            fieldProps={{
              autoSize: { minRows: 3, maxRows: 6 },
            }}
          />
        </ProFormGroup>
      </ModalForm>
    </>
  );
}
