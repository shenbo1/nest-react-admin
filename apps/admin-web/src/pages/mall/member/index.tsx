import { useRef, useState } from 'react';
import { message, Modal, Space, Avatar, Switch, Tag } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormDatePicker,
  ProFormGroup,
  ProFormSelect,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { memberApi, Member, MemberForm } from '@/services/mall/member';
import { memberLevelApi } from '@/services/mall/member-level';
import { PermissionButton } from '@/components/PermissionButton';
import { MEMBER } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { DictRadio } from '@/components/DictSelect';
import { ImageUpload } from '@/components/ImageUpload';
import { StatusEnums, GenderEnums } from '@/stores/enums/common.enums';

export default function MemberPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Member | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  // 获取会员等级选项
  const { data: levelOptions = [] } = useQuery({
    queryKey: ['memberLevelOptions'],
    queryFn: () => memberLevelApi.options(),
  });

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
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: memberApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  // 批量删除
  const batchDeleteMutation = useMutation({
    mutationFn: memberApi.batchDelete,
    onSuccess: () => {
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    },
  });

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: memberApi.toggleStatus,
    onSuccess: () => {
      message.success('状态切换成功');
      actionRef.current?.reload();
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

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的会员');
      return;
    }
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？删除后无法恢复。`,
      okType: 'danger',
      onOk: () => batchDeleteMutation.mutate(selectedRowKeys),
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

  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate(id);
  };

  const getGenderText = (gender: string) => {
    switch (gender) {
      case GenderEnums.男:
        return '男';
      case GenderEnums.女:
        return '女';
      default:
        return '未知';
    }
  };

  const getLevelInfo = (memberLevelId?: number) => {
    if (!memberLevelId) return null;
    return levelOptions.find((item) => item.id === memberLevelId);
  };

  const getLevelColor = (level?: number) => {
    if (!level) return 'default';
    if (level >= 5) return 'red';
    if (level >= 4) return 'gold';
    if (level >= 3) return 'orange';
    if (level >= 2) return 'blue';
    return 'default';
  };

  const columns: ProColumns<Member>[] = [
    {
      title: '会员信息',
      dataIndex: 'username',
      width: 250,
      fieldProps: {
        placeholder: '请输入用户名',
      },
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
      title: '手机号',
      dataIndex: 'phone',
      hideInTable: true,
      fieldProps: {
        placeholder: '请输入手机号',
      },
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
      dataIndex: 'memberLevelId',
      width: 120,
      align: 'center',
      search: false,
      render: (_, record) => {
        const levelInfo = getLevelInfo(record.memberLevelId);
        if (!levelInfo) return <Tag>未设置</Tag>;
        return (
          <Tag color={getLevelColor(levelInfo.level)} icon={<CrownOutlined />}>
            {levelInfo.name}
          </Tag>
        );
      },
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
      valueType: 'select',
      valueEnum: {
        ENABLED: { text: '启用', status: 'Success' },
        DISABLED: { text: '禁用', status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 'ENABLED'}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          loading={toggleStatusMutation.isPending}
          onChange={() => handleToggleStatus(record.id)}
        />
      ),
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
            permission={MEMBER.MEMBER.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={MEMBER.MEMBER.REMOVE}
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
        scroll={{ x: 1500 }}
        api="/mall/member"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as number[]),
        }}
        toolBarRender={() => [
          selectedRowKeys.length > 0 && (
            <PermissionButton
              key="batchDelete"
              permission={MEMBER.MEMBER.REMOVE}
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
              loading={batchDeleteMutation.isPending}
            >
              批量删除 ({selectedRowKeys.length})
            </PermissionButton>
          ),
          <PermissionButton
            key="add"
            permission={MEMBER.MEMBER.ADD}
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
        initialValues={
          editingRecord || {
            points: 0,
            status: StatusEnums.启用,
            gender: GenderEnums.未知,
          }
        }
        onFinish={async (values) => {
          // 转换日期格式为 ISO 8601
          if (values.birthday) {
            values.birthday = new Date(values.birthday).toISOString();
          }
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
          <div style={{ marginBottom: 24, gridColumn: 'span 24' }}>
            <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14 }}>头像</div>
            <ImageUpload name="avatar" />
          </div>
          <ProFormText
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            colProps={{ span: 12 }}
            rules={[
              {
                pattern: /^1[3-9]\d{9}$/,
                message: '请输入正确的手机号格式',
              },
            ]}
          />
          <ProFormText
            name="email"
            label="邮箱"
            placeholder="请输入邮箱"
            colProps={{ span: 12 }}
            rules={[
              {
                type: 'email',
                message: '请输入正确的邮箱格式',
              },
            ]}
          />
          <DictRadio
            name="gender"
            label="性别"
            enum={GenderEnums}
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
          <ProFormSelect
            name="memberLevelId"
            label="会员等级"
            placeholder="请选择会员等级"
            colProps={{ span: 12 }}
            options={levelOptions.map((item) => ({
              label: item.name,
              value: item.id,
            }))}
            fieldProps={{
              allowClear: true,
            }}
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
          <DictRadio
            name="status"
            label="状态"
            enum={StatusEnums}
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
