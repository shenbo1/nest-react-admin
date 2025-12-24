import { useRef, useState } from 'react';
import { message, Modal, Space, Switch } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
} from '@ant-design/pro-components';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { articleApi, Article, ArticleForm } from '@/services/article';
import { PermissionButton } from '@/components/PermissionButton';
import { ARTICLE } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';

export default function ArticlePage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Article | null>(null);
  const queryClient = useQueryClient();

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: ArticleForm) => {
      if (editingRecord) {
        return articleApi.update(editingRecord.id, data);
      }
      return articleApi.create(data);
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
    mutationFn: articleApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '删除失败');
    },
  });

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: articleApi.toggleStatus,
    onSuccess: () => {
      message.success('状态更新成功');
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '状态更新失败');
    },
  });

  const handleToggleStatus = (record: Article) => {
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

  const handleEdit = (record: Article) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  // const handleAdd = () => {
  //   setEditingRecord(null);
  //   setModalOpen(true);
  // };

  const columns: ProColumns<Article>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '编码',
      dataIndex: 'code',
      width: 120,
      search: false,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        ENABLED: { text: '启用', status: 'Success' },
        DISABLED: { text: '禁用', status: 'Error' },
      },
      render: (_, record: Article) => (
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
      title: '备注',
      dataIndex: 'remark',
      width: 200,
      ellipsis: true,
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
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <PermissionButton
            permission={ARTICLE.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={ARTICLE.REMOVE}
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
        headerTitle="article管理列表"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1000 }}
        api="/article"
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={ARTICLE.ADD}
            type="primary"
            icon={null}
            onClick={() => {
              setEditingRecord(null);
              setModalOpen(true);
            }}
          >
            新增
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ModalForm<ArticleForm>
        title={editingRecord ? '编辑article管理' : '新增article管理'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={editingRecord || { sort: 0, status: 'ENABLED' }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
        }}
      >
        <ProFormText
          name="name"
          label="名称"
          placeholder="请输入名称"
          rules={[{ required: true, message: '请输入名称' }]}
        />
        <ProFormText
          name="code"
          label="编码"
          placeholder="请输入编码"
        />
        <ProFormDigit
          name="sort"
          label="排序"
          placeholder="请输入排序号"
          min={0}
          fieldProps={{ precision: 0 }}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '启用', value: 'ENABLED' },
            { label: '禁用', value: 'DISABLED' },
          ]}
        />
        <ProFormTextArea
          name="content"
          label="内容"
          placeholder="请输入内容"
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注"
        />
      </ModalForm>
    </>
  );
}
