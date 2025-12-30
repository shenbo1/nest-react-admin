import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTreeSelect,
  ProFormColorPicker,
  ProFormDigit,
  ProFormSelect,
} from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { message, Popconfirm, Space, Modal, Switch } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import {
  queryCategoryList,
  queryCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  type Category,
} from '@/services/workflow/category';
import PermissionButton from '@/components/PermissionButton';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { WORKFLOW } from '@/constants/permissions';
import { useForm } from 'antd/es/form/Form';
import { generateKeyFromName } from '@/utils/name-key';

// 转换分类树为 TreeSelect 格式
const transformCategoryTree = (nodes: Category[]): any[] => {
  return nodes.map((node) => ({
    value: node.id,
    title: node.name,
    children: node.children ? transformCategoryTree(node.children) : undefined,
  }));
};

const CategoryList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<Category> | null>(
    null,
  );
  const queryClient = useQueryClient();
  const [form] = useForm();

  // 获取分类树（用于表格）
  const { data: categoryData } = useQuery({
    queryKey: ['workflow-category-tree'],
    queryFn: () => queryCategoryList(),
  });

  // 获取分类树（用于下拉选择）
  const { data: categoryTree } = useQuery({
    queryKey: ['workflow-category-tree-for-select'],
    queryFn: queryCategoryTree,
  });

  // 创建/更新分类
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const data = {
        ...values,
        color: values.color
          ? values.color.toHexString().replace('#', '')
          : undefined,
      };
      if (editingRecord?.id) {
        return updateCategory(editingRecord.id, data);
      }
      return createCategory(data);
    },
    onSuccess: () => {
      message.success(editingRecord ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingRecord(null);
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['workflow-category-tree'] });
      queryClient.invalidateQueries({
        queryKey: ['workflow-category-tree-for-select'],
      });
    },
  });

  // 删除分类
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      message.success('删除成功');
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['workflow-category-tree'] });
      queryClient.invalidateQueries({
        queryKey: ['workflow-category-tree-for-select'],
      });
    },
  });

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: 'ENABLED' | 'DISABLED';
    }) => updateCategoryStatus(id, status),
    onSuccess: () => {
      message.success('状态更新成功');
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['workflow-category-tree'] });
    },
  });

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'ENABLED',
      sort: 0,
      parentId: undefined,
      color: undefined,
    });
    setModalOpen(true);
  };

  const handleAddChild = (record: Category) => {
    const newRecord = {
      parentId: record.id,
      code: '',
      name: '',
      status: 'ENABLED',
      sort: 0,
    } as Partial<Category>;
    setEditingRecord(newRecord);
    form.resetFields();
    form.setFieldsValue({
      ...newRecord,
      color: undefined,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: Category) => {
    setEditingRecord({ ...record });
    form.resetFields();
    form.setFieldsValue({
      ...record,
      color: record.color ? `#${record.color}` : undefined,
      parentId: record.parentId || undefined,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleToggleStatus = (record: Category) => {
    Modal.confirm({
      title: '确认切换状态',
      content: `确定要${record.status === 'ENABLED' ? '停用' : '启用'}分类「${record.name}」吗？`,
      onOk: () =>
        toggleStatusMutation.mutate({
          id: record.id,
          status: record.status === 'ENABLED' ? 'DISABLED' : 'ENABLED',
        }),
    });
  };

  const columns: ProColumns<Category>[] = [
    {
      title: '分类编码',
      dataIndex: 'code',
      width: 150,
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '颜色',
      dataIndex: 'color',
      width: 80,
      render: (_, record) =>
        record.color && (
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: `#${record.color}`,
              borderRadius: 4,
            }}
          />
        ),
    },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 80,
      render: (_, record) => record.icon || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        ENABLED: { text: '启用', status: 'Success' },
        DISABLED: { text: '停用', status: 'Error' },
      },
      hideInSearch: true,
      render: (_, record) => (
        <Switch
          checked={record.status === 'ENABLED'}
          checkedChildren="启用"
          unCheckedChildren="停用"
          onClick={() => handleToggleStatus(record)}
          loading={toggleStatusMutation.isPending}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            permission={WORKFLOW.CATEGORY.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            fallbackMode="disabled"
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={WORKFLOW.CATEGORY.ADD}
            type="link"
            size="small"
            icon={<PlusCircleOutlined />}
            onClick={() => handleAddChild(record)}
            fallbackMode="disabled"
          >
            添加子分类
          </PermissionButton>
          <Popconfirm
            title="确定删除此分类吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <PermissionButton
              permission={WORKFLOW.CATEGORY.REMOVE}
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              fallbackMode="disabled"
            >
              删除
            </PermissionButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="流程分类">
      <ProTable
        ref={tableRef}
        columns={columns}
        rowKey="id"
        dataSource={(categoryData as any)?.list || []}
        search={false}
        pagination={false}
        expandable={{ defaultExpandAllRows: true }}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={WORKFLOW.CATEGORY.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新建分类
          </PermissionButton>,
        ]}
      />

      <ModalForm
        title={editingRecord ? '编辑分类' : '新建分类'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        form={form}
        width={600}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="分类名称"
          rules={[{ required: true, message: '请输入分类名称' }]}
          placeholder="请输入分类名称"
          fieldProps={{
            onChange: (e) => {
              // 自动生成编码
              const value = e.target.value;
              if (value && !editingRecord) {
                form.setFieldValue('code', generateKeyFromName(value));
              }
            },
          }}
        />
        <ProFormText
          name="code"
          label="分类编码"
          rules={[{ required: true, message: '请输入分类编码' }]}
          placeholder="请输入分类编码"
        />

        <ProFormTreeSelect
          name="parentId"
          label="上级分类"
          placeholder="请选择上级分类（不选则为顶级分类）"
          fieldProps={{
            treeData: transformCategoryTree(categoryTree?.list || []),
            allowClear: true,
            treeDefaultExpandAll: true,
          }}
        />
        <ProFormColorPicker name="color" label="颜色" />
        <ProFormText name="icon" label="图标" placeholder="请输入图标类名" />
        <ProFormDigit name="sort" label="排序号" min={0} />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '启用', value: 'ENABLED' },
            { label: '停用', value: 'DISABLED' },
          ]}
        />
        <ProFormText
          name="remark"
          label="备注"
          placeholder="请输入备注"
          fieldProps={{ maxLength: 500 }}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default CategoryList;
