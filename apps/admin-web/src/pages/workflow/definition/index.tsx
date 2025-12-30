import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormCascader,
  ProForm,
} from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { message, Popconfirm, Space, Tag, Modal, Typography } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  PartitionOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import {
  queryFlowDefinitionList,
  deleteFlowDefinition,
  publishFlowDefinition,
  disableFlowDefinition,
  createFlowDefinition,
  createNewVersion,
  type FlowDefinition,
} from '@/services/workflow/definition';
import { queryCategoryTree, getCategoryCascaderOptions, type CategoryTreeNode } from '@/services/workflow/category';
import PermissionButton from '@/components/PermissionButton';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { WORKFLOW } from '@/constants/permissions';
import { generateKeyFromName } from '@/utils/name-key';

const FlowDefinitionList: React.FC = () => {
  const navigate = useNavigate();
  const tableRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = ProForm.useForm();

  // 获取分类树
  const { data: categoryTree } = useQuery({
    queryKey: ['workflow-category-tree'],
    queryFn: queryCategoryTree,
  });

  // 创建流程定义
  const createMutation = useMutation({
    mutationFn: createFlowDefinition,
    onSuccess: (res) => {
      message.success('创建成功');
      setModalOpen(false);
      tableRef.current?.reload();
      // 跳转到设计页面
      navigate(`/workflow/definition/design/${res.id}`);
    },
  });

  // 发布流程
  const publishMutation = useMutation({
    mutationFn: publishFlowDefinition,
    onSuccess: () => {
      message.success('发布成功');
      tableRef.current?.reload();
    },
  });

  // 停用流程
  const disableMutation = useMutation({
    mutationFn: disableFlowDefinition,
    onSuccess: () => {
      message.success('停用成功');
      tableRef.current?.reload();
    },
  });

  // 删除流程
  const deleteMutation = useMutation({
    mutationFn: deleteFlowDefinition,
    onSuccess: () => {
      message.success('删除成功');
      tableRef.current?.reload();
    },
  });

  // 创建新版本
  const createNewVersionMutation = useMutation({
    mutationFn: createNewVersion,
    onSuccess: (res) => {
      message.success(`新版本 V${res.version} 创建成功`);
      tableRef.current?.reload();
      // 跳转到设计页面
      navigate(`/workflow/definition/design/${res.id}`);
    },
  });

  const cascaderOptions = getCategoryCascaderOptions(categoryTree?.list || []);

  // 根据分类ID获取完整分类路径
  const getCategoryPath = (categoryId: number | undefined): { names: string[]; color?: string } => {
    if (!categoryId || !categoryTree?.list) return { names: [] };

    const findPath = (nodes: CategoryTreeNode[], targetId: number, path: string[] = []): { names: string[]; color?: string } | null => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return { names: [...path, node.name], color: node.color };
        }
        if (node.children && node.children.length > 0) {
          const result = findPath(node.children, targetId, [...path, node.name]);
          if (result) return result;
        }
      }
      return null;
    };

    return findPath(categoryTree.list, categoryId) || { names: [] };
  };

  const handlePublish = (record: FlowDefinition) => {
    Modal.confirm({
      title: '确认发布流程',
      content: `确定要发布流程「${record.name}」吗？`,
      onOk: () => publishMutation.mutate(record.id),
    });
  };

  const handleDisable = (record: FlowDefinition) => {
    Modal.confirm({
      title: '确认停用流程',
      content: `确定要停用流程「${record.name}」吗？`,
      onOk: () => disableMutation.mutate(record.id),
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleCreate = () => {
    setModalOpen(true);
  };

  const handleCreateNewVersion = (record: FlowDefinition) => {
    Modal.confirm({
      title: '创建新版本',
      content: `确定要基于流程「${record.name}」（V${record.version}）创建新版本吗？`,
      onOk: () => createNewVersionMutation.mutate(record.id),
    });
  };

  const columns: ProColumns<FlowDefinition>[] = [
    {
      title: '流程编码',
      dataIndex: 'code',
      width: 150,
      render: (_, record) => (
        <Typography.Link onClick={() => navigate(`/workflow/definition/design/${record.id}`)}>
          {record.code}
        </Typography.Link>
      ),
    },
    {
      title: '流程名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      width: 180,
      render: (_, record) => {
        if (!record.category) return '-';
        const { names, color } = getCategoryPath(record.category.id);
        if (names.length === 0) {
          return <Tag color={record.category.color}>{record.category.name}</Tag>;
        }
        return <Tag color={color}>{names.join(' / ')}</Tag>;
      },
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 80,
      render: (_, record) => `V${record.version}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        DRAFT: { text: '草稿', status: 'Default' },
        PUBLISHED: { text: '已发布', status: 'Success' },
        DISABLED: { text: '已停用', status: 'Error' },
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          {record.status !== 'PUBLISHED' && (
            <PermissionButton
              permission={WORKFLOW.DEFINITION.DESIGN}
              type="link"
              size="small"
              icon={<PartitionOutlined />}
              onClick={() => navigate(`/workflow/definition/design/${record.id}`)}
              fallbackMode="disabled"
            >
              设计
            </PermissionButton>
          )}
          {record.status === 'DRAFT' ? (
            <PermissionButton
              permission={WORKFLOW.DEFINITION.PUBLISH}
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handlePublish(record)}
              fallbackMode="disabled"
            >
              发布
            </PermissionButton>
          ) : record.status === 'PUBLISHED' ? (
            <PermissionButton
              permission={WORKFLOW.DEFINITION.EDIT}
              type="link"
              size="small"
              danger
              icon={<PauseCircleOutlined />}
              onClick={() => handleDisable(record)}
              fallbackMode="disabled"
            >
              停用
            </PermissionButton>
          ) : null}
          {(record.status === 'PUBLISHED' || record.status === 'DISABLED') && (
            <PermissionButton
              permission={WORKFLOW.DEFINITION.ADD}
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCreateNewVersion(record)}
              fallbackMode="disabled"
            >
              新版本
            </PermissionButton>
          )}
          {record.status === 'DISABLED' && (
            <Popconfirm title="确定删除此流程吗？" onConfirm={() => handleDelete(record.id)}>
              <PermissionButton
                permission={WORKFLOW.DEFINITION.REMOVE}
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                fallbackMode="disabled"
              >
                删除
              </PermissionButton>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="流程定义">
      <ProTable
        ref={tableRef}
        columns={columns}
        request={async (params) => {
          const res = await queryFlowDefinitionList({
            page: params.current,
            pageSize: params.pageSize,
            code: params.code || undefined,
            name: params.name || undefined,
            categoryId: params.categoryId ? Number(params.categoryId) : undefined,
            status: params.status || undefined,
          });
          return {
            data: res.list,
            total: res.total,
            success: true,
          };
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          span: 6,
        }}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={WORKFLOW.DEFINITION.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建流程
          </PermissionButton>,
        ]}
      />

      <ModalForm
        title="新建流程"
        open={modalOpen}
        onOpenChange={setModalOpen}
        form={form}
        width={600}
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          // categoryId 是级联选择器返回的数组，取最后一个值
          const data = {
            ...values,
            categoryId: Array.isArray(values.categoryId)
              ? values.categoryId[values.categoryId.length - 1]
              : values.categoryId,
          };
          await createMutation.mutateAsync(data);
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="流程名称"
          rules={[{ required: true, message: '请输入流程名称' }]}
          placeholder="请输入流程名称"
          fieldProps={{
            onChange: (e) => {
              const value = e.target.value;
              if (value) {
                form.setFieldValue('code', generateKeyFromName(value));
              }
            },
          }}
        />
        <ProFormText
          name="code"
          label="流程编码"
          rules={[{ required: true, message: '请输入流程编码' }]}
          placeholder="请输入流程编码"
        />
        <ProFormCascader
          name="categoryId"
          label="分类"
          placeholder="请选择分类"
          fieldProps={{
            options: cascaderOptions,
            changeOnSelect: true,
          }}
        />
        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入流程描述"
          fieldProps={{ maxLength: 500 }}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default FlowDefinitionList;
