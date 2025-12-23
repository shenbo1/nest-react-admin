import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Avatar } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  CrownOutlined
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
  ProFormDatePicker,
  ProFormGroup,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { memberApi, Member, MemberForm } from '@/services/mall/member';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';

export default function MemberPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Member | null>(null);

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: MemberForm) => {
      if (editingRecord) {
        return memberApi.update(editingRecord.id, data);
      }
      return memberApi.create(data);
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
    mutationFn: memberApi.delete,
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

  const handleEdit = (record: Member) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const getGenderText = (gender: number) => {
    switch (gender) {
      case 1: return '男';
      case 2: return '女';
      default: return '未知';
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 5) return 'red';
    if (level >= 3) return 'gold';
    if (level >= 2) return 'blue';
    return 'default';
  };

  const columns: ProColumns<Member>[] = [
    {
      title: '会员信息',
      dataIndex: 'username',
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              {record.nickname || record.username}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone || '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      render: (text) => text || '-',
      search: false,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 80,
      align: 'center',
      render: (gender: any) => getGenderText(gender),
      search: false,
    },
    {
      title: '会员等级',
      dataIndex: 'level',
      width: 100,
      align: 'center',
      render: (level: any) => (
        <Tag color={getLevelColor(level)} icon={<CrownOutlined />}>
          LV.{level || 1}
        </Tag>
      ),
      search: false,
    },
    {
      title: '积分',
      dataIndex: 'points',
      width: 100,
      align: 'center',
      search: false,
      render: (points) => points || 0,
    },
    {
      title: '余额',
      dataIndex: 'balance',
      width: 120,
      align: 'center',
      search: false,
      render: (balance: any) => `¥${(Number(balance) || 0).toFixed(2)}`,
    },
    {
      title: '累计消费',
      dataIndex: 'totalAmount',
      width: 120,
      align: 'center',
      search: false,
      render: (amount: any) => `¥${(Number(amount) || 0).toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        1: { text: '启用', status: 'Success' },
        0: { text: '禁用', status: 'Error' },
      },
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
            permission={MALL.MEMBER.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={MALL.MEMBER.REMOVE}
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
        headerTitle="会员管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1400 }}
        api="/mall/member"
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MALL.MEMBER.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增会员
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ModalForm<MemberForm>
        title={editingRecord ? '编辑会员' : '新增会员'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={editingRecord || {
          level: 1,
          points: 0,
          status: 1,
          gender: 0
        }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
          width: 800,
        }}
      >
        <ProFormGroup title="基本资料">
          <ProFormText
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
            colProps={{ span: 12 }}
          />
          <ProFormText
            name="nickname"
            label="昵称"
            placeholder="请输入昵称"
            colProps={{ span: 12 }}
          />
          <ProFormText
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            colProps={{ span: 12 }}
          />
          <ProFormText
            name="email"
            label="邮箱"
            placeholder="请输入邮箱"
            colProps={{ span: 12 }}
          />
          <ProFormSelect
            name="gender"
            label="性别"
            options={[
              { label: '未知', value: 0 },
              { label: '男', value: 1 },
              { label: '女', value: 2 },
            ]}
            colProps={{ span: 12 }}
          />
          <ProFormDatePicker
            name="birthday"
            label="生日"
            placeholder="请选择生日"
            colProps={{ span: 12 }}
          />
        </ProFormGroup>

        <ProFormGroup title="会员信息">
          <ProFormDigit
            name="level"
            label="会员等级"
            placeholder="请输入会员等级"
            min={1}
            max={10}
            fieldProps={{ precision: 0 }}
            colProps={{ span: 12 }}
          />
          <ProFormDigit
            name="points"
            label="积分"
            placeholder="请输入积分"
            min={0}
            fieldProps={{ precision: 0 }}
            colProps={{ span: 12 }}
          />
          <ProFormDigit
            name="balance"
            label="余额"
            placeholder="请输入余额"
            min={0}
            fieldProps={{ precision: 2 }}
            colProps={{ span: 12 }}
          />
          <ProFormSelect
            name="status"
            label="状态"
            options={[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]}
            colProps={{ span: 12 }}
          />
        </ProFormGroup>

        <ProFormGroup title="其他信息">
          <ProFormTextArea
            name="remark"
            label="备注"
            placeholder="请输入备注信息"
            fieldProps={{
              autoSize: { minRows: 3, maxRows: 6 },
            }}
          />
        </ProFormGroup>
      </ModalForm>
    </>
  );
}
