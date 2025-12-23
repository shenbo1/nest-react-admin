import { useState, useRef } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ProColumns, ModalForm, ProFormText, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { message, Popconfirm } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PermissionButton from '@/components/PermissionButton';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { SYSTEM } from '@/constants/permissions';
import dayjs from 'dayjs';
import request from '@/utils/request';

interface Notice {
  id: number;
  title: string;
  noticeType: string;
  noticeContent?: string;
  status: string;
  createdAt: string;
}

const NoticeList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<Notice | null>(null);
  const queryClient = useQueryClient();

  // 创建/更新公告
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingId) {
        const result = await request.put(`/system/notice/${editingId}`, values);
        return result;
      }
      const result = await request.post('/system/notice', values);
      return result;
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });

  // 删除公告
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await request.delete(`/system/notice/${id}`);
      return result;
    },
    onSuccess: () => {
      message.success('删除成功');
      tableRef.current?.reload();
    },
  });

  const handleEdit = (record: Notice) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setModalOpen(true);
  };

  const columns: ProColumns<Notice>[] = [
    {
      title: '公告标题',
      dataIndex: 'title',
      width: 200,
    },
    {
      title: '公告类型',
      dataIndex: 'noticeType',
      width: 100,
      valueType: 'select',
      valueEnum: {
        '1': { text: '通知', status: 'Processing' },
        '2': { text: '公告', status: 'Warning' },
      },
    },
    {
      title: '公告状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        ENABLED: { text: '正常', status: 'Success' },
        DISABLED: { text: '停用', status: 'Error' },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        <PermissionButton
          key="edit"
          type="link"
          size="small"
          permission={SYSTEM.NOTICE.EDIT}
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </PermissionButton>,
        <Popconfirm key="delete" title="确定删除吗？" onConfirm={() => deleteMutation.mutate(record.id)}>
          <PermissionButton
            type="link"
            size="small"
            danger
            permission={SYSTEM.NOTICE.REMOVE}
            icon={<DeleteOutlined />}
          >
            删除
          </PermissionButton>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable
        ref={tableRef}
        api="/system/notice"
        columns={columns}
        rowKey="id"
        scroll={{ x: 800 }}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={SYSTEM.NOTICE.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增公告
          </PermissionButton>,
        ]}
      />

      {/* 新增/编辑公告弹窗 */}
      <ModalForm<Notice>
        title={editingId ? '编辑公告' : '新增公告'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        width={600}
        initialValues={
          editingRecord
            ? {
                title: editingRecord.title,
                noticeType: editingRecord.noticeType,
                noticeContent: editingRecord.noticeContent,
                status: editingRecord.status,
              }
            : { status: 'ENABLED', noticeType: '1' }
        }
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormText
          name="title"
          label="公告标题"
          rules={[{ required: true, message: '请输入公告标题' }]}
          placeholder="请输入公告标题"
        />
        <ProFormSelect
          name="noticeType"
          label="公告类型"
          rules={[{ required: true, message: '请选择公告类型' }]}
          options={[
            { label: '通知', value: '1' },
            { label: '公告', value: '2' },
          ]}
        />
        <ProFormTextArea
          name="noticeContent"
          label="公告内容"
          placeholder="请输入公告内容"
        />
        <ProFormSelect
          name="status"
          label="公告状态"
          options={[
            { label: '正常', value: 'ENABLED' },
            { label: '停用', value: 'DISABLED' },
          ]}
        />
      </ModalForm>
    </>
  );
};

export default NoticeList;
