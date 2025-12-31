import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Switch } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormGroup,
  ProFormTreeSelect,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  categoryApi,
  CategoryForm,
  CategoryTree,
} from '@/services/mall/category';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { StatusEnums } from '@/stores/enums/common.enums';
import { DictRadio } from '@/components/DictSelect';
import { generateKeyFromName } from '@/utils/name-key';
import { useForm } from 'antd/es/form/Form';

export default function CategoryPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CategoryTree | null>(null);
  const [displayLevel, setDisplayLevel] = useState<number>(1);
  const [parentCategory, setParentCategory] = useState<CategoryTree | null>(
    null,
  );
  const [form] = useForm();
  const queryClient = useQueryClient();

  // 获取分类列表（用于选择父分类）
  const { data: categoryList } = useQuery({
    queryKey: ['categoryListForSelect'],
    queryFn: () => categoryApi.listForSelect(),
  });

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
      // 重置表单和状态
      form.resetFields();
      setDisplayLevel(1);
      setEditingRecord(null);
      setParentCategory(null);
      setModalOpen(false);
      // 刷新分类列表
      queryClient.invalidateQueries({ queryKey: ['categoryListForSelect'] });
      actionRef.current?.reload();
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: categoryApi.toggleStatus,
    onSuccess: () => {
      message.success('状态更新成功');
      queryClient.invalidateQueries({ queryKey: ['categoryListForSelect'] });
      actionRef.current?.reload();
    },
  });

  const handleToggleStatus = (record: CategoryTree) => {
    Modal.confirm({
      title: '确认切换状态',
      content: `确定要${record.status === 'ENABLED' ? '禁用' : '启用'}「${record.name}」吗？`,
      onOk: () => toggleStatusMutation.mutate(record.id),
    });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleEdit = (record: CategoryTree) => {
    setEditingRecord(record);
    setDisplayLevel(record.level || 1);
    setModalOpen(true);
  };

  const handleAdd = (parent?: CategoryTree) => {
    setEditingRecord(null);
    setParentCategory(parent || null);
    // 先重置表单为默认值
    form.resetFields();
    form.setFieldsValue({
      sort: 0,
      status: 'ENABLED',
      level: 1,
    });
    if (parent) {
      setDisplayLevel(Math.min((parent.level || 1) + 1, 5));
      form.setFieldValue('parentId', parent.id);
    } else {
      setDisplayLevel(1);
    }
    setModalOpen(true);
  };

  // 添加子分类
  const handleAddChild = (record: CategoryTree) => {
    handleAdd(record);
  };

  const columns: ProColumns<CategoryTree>[] = [
    {
      title: '分类名称',
      dataIndex: 'name',
      width: 350,
      render: (_, record: any) => {
        const indent = record.level ? '　'.repeat((record.level - 1) * 2) : '';
        return (
          <div>
            <span style={{ marginRight: 8 }}>
              {(record.level || 0) > 1 ? (
                <BranchesOutlined style={{ color: '#1890ff' }} />
              ) : (
                <FolderOutlined style={{ color: '#faad14' }} />
              )}
            </span>
            {indent}
            <span style={{ fontWeight: 500 }}>{record.name}</span>
            <Tag color="purple" style={{ marginLeft: 8 }}>
              {record.level || 1}级
            </Tag>
          </div>
        );
      },
    },
    {
      title: '分类编码',
      dataIndex: 'code',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      search: false,
      align: 'center',
    },
    {
      title: '子分类',
      dataIndex: 'childrenCount',
      width: 100,
      search: false,
      align: 'center',
      render: (_: any, record: CategoryTree) =>
        (record.childrenCount ?? 0) > 0 ? (
          <Tag color="blue">{record.childrenCount} 个子分类</Tag>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        ENABLED: { text: '启用', status: 'Success' },
        DISABLED: { text: '禁用', status: 'Error' },
      },
      render: (_, record: CategoryTree) => (
        <Switch
          key={record.id}
          size="small"
          checked={record.status === 'ENABLED'}
          checkedChildren="正常"
          unCheckedChildren="停用"
          onClick={() => handleToggleStatus(record)}
        />
      ),
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
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <PermissionButton
            permission={MALL.CATEGORY.ADD}
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleAddChild(record)}
            disabled={(record.level || 1) >= 5}
          >
            添加子分类
          </PermissionButton>
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
        scroll={{ x: 1300 }}
        api="/mall/category"
        defaultExpandAllRows={true}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MALL.CATEGORY.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAdd()}
          >
            新增分类
          </PermissionButton>,
        ]}
        pagination={false}
      />

      <ModalForm<CategoryForm>
        title={
          editingRecord
            ? '编辑商品分类'
            : parentCategory
              ? `添加子分类（上级：${parentCategory.name}）`
              : '新增商品分类'
        }
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            // 关闭弹窗时重置表单和状态
            form.resetFields();
            setEditingRecord(null);
            setParentCategory(null);
            setDisplayLevel(1);
          }
        }}
        form={form}
        initialValues={
          editingRecord
            ? {
                ...editingRecord,
                parentId: editingRecord.parentId || undefined,
              }
            : {
                sort: 0,
                status: 'ENABLED',
                level: 1,
              }
        }
        onFinish={async (values) => {
          // 使用displayLevel作为层级
          values.level = displayLevel;

          // 确保parentId正确处理
          if (values.parentId === null) {
            values.parentId = undefined;
          }

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
          <ProFormTreeSelect
            name="parentId"
            label="上级分类"
            placeholder="请选择上级分类"
            allowClear
            colProps={{ span: 12 }}
            fieldProps={{
              style: { width: '100%', minWidth: '140px' },
              popupMatchSelectWidth: 200,
              treeDefaultExpandAll: true,
              treeData: (categoryList?.list || []) as any[],
              fieldNames: { label: 'name', value: 'id', children: 'children' },
            }}
          />
          <DictRadio
            name="status"
            label="状态"
            enum={StatusEnums}
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
