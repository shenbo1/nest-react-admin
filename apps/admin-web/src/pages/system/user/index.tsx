import { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { ProColumns, ModalForm, ProFormText, ProFormSelect, ProFormTreeSelect } from '@ant-design/pro-components';
import { message, Popconfirm, Space, Modal, Switch, Input } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi, roleApi, deptApi, User, CreateUserParams } from '@/services/system/system';
import PermissionButton from '@/components/PermissionButton';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { SYSTEM } from '@/constants/permissions';
import dayjs from 'dayjs';

const UserList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [assignRoleModalOpen, setAssignRoleModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  // 获取角色列表（下拉）
  const { data: roles } = useQuery({
    queryKey: ['roles-simple'],
    queryFn: roleApi.simple,
  });

  // 获取部门树
  const { data: deptTree } = useQuery({
    queryKey: ['dept-tree'],
    queryFn: deptApi.treeSelect,
  });

  // 创建/更新用户
  const saveMutation = useMutation({
    mutationFn: (values: CreateUserParams) => {
      if (editingId) {
        return userApi.update(editingId, values);
      }
      return userApi.create(values);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // 删除用户
  const deleteMutation = useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      tableRef.current?.reload();
    },
  });

  // 重置密码
  const resetPwdMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      userApi.resetPassword(id, password),
    onSuccess: () => {
      message.success('密码重置成功');
      setResetPwdModalOpen(false);
      setEditingRecord(null);
      setNewPassword('');
    },
  });

  // 修改状态
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      userApi.changeStatus(id, status),
    onSuccess: () => {
      message.success('状态修改成功');
      tableRef.current?.reload();
    },
  });

  // 分配角色
  const assignRoleMutation = useMutation({
    mutationFn: ({ id, roleIds }: { id: number; roleIds: number[] }) =>
      userApi.update(id, { roleIds }),
    onSuccess: () => {
      message.success('角色分配成功');
      setAssignRoleModalOpen(false);
      setEditingRecord(null);
      setSelectedRoleIds([]);
      tableRef.current?.reload();
    },
  });

  const handleEdit = (record: User) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleResetPwd = (record: User) => {
    setEditingRecord(record);
    setNewPassword('');
    setResetPwdModalOpen(true);
  };

  const handleAssignRole = (record: User) => {
    setEditingRecord(record);
    setSelectedRoleIds(record.roles?.map((r) => r.role.id) || []);
    setAssignRoleModalOpen(true);
  };

  const handleStatusChange = (record: User, checked: boolean) => {
    changeStatusMutation.mutate({
      id: record.id,
      status: checked ? 'ENABLED' : 'DISABLED',
    });
  };

  // 转换部门树为 TreeSelect 格式
  const transformDeptTree = (nodes: any[]): any[] => {
    return nodes.map((node) => ({
      value: node.id,
      title: node.name,
      children: node.children ? transformDeptTree(node.children) : undefined,
    }));
  };

  const columns: ProColumns<User>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      width: 120,
      hideInSearch: true,
    },
    {
      title: '部门',
      dataIndex: ['dept', 'name'],
      width: 120,
      hideInSearch: true,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 180,
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        ENABLED: { text: '正常', status: 'Success' },
        DISABLED: { text: '停用', status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 'ENABLED'}
          checkedChildren="正常"
          unCheckedChildren="停用"
          onChange={(checked) => handleStatusChange(record, checked)}
          loading={changeStatusMutation.isPending}
        />
      ),
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
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            type="link"
            size="small"
            permission={SYSTEM.USER.EDIT}
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            fallbackMode="disabled"
          >
            编辑
          </PermissionButton>
          <PermissionButton
            type="link"
            size="small"
            permission={SYSTEM.USER.EDIT}
            icon={<UserSwitchOutlined />}
            onClick={() => handleAssignRole(record)}
            fallbackMode="disabled"
          >
            分配角色
          </PermissionButton>
          <PermissionButton
            type="link"
            size="small"
            permission={SYSTEM.USER.RESET_PWD}
            icon={<KeyOutlined />}
            onClick={() => handleResetPwd(record)}
            fallbackMode="disabled"
          >
            重置密码
          </PermissionButton>
          <Popconfirm title="确定删除吗？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <PermissionButton
              type="link"
              size="small"
              danger
              permission={SYSTEM.USER.REMOVE}
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

  const fetchUsers = async (params: any) => {
    const { current, pageSize, ...rest } = params;
    const result = await userApi.list({
      page: current,
      pageSize,
      ...rest,
    });
    return {
      data: result.data,
      total: result.total,
      success: true,
    };
  };

  return (
    <>
      <ProTable
        ref={tableRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1400 }}
        request={fetchUsers}
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
            permission={SYSTEM.USER.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增用户
          </PermissionButton>,
        ]}
      />

      {/* 新增/编辑用户弹窗 */}
      <ModalForm<CreateUserParams>
        title={editingId ? '编辑用户' : '新增用户'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        width={600}
        initialValues={
          editingRecord
            ? {
                nickname: editingRecord.nickname,
                deptId: editingRecord.deptId,
                phone: editingRecord.phone,
                email: editingRecord.email,
                gender: editingRecord.gender,
                status: editingRecord.status,
                roleIds: editingRecord.roles?.map((r) => r.role.id),
              }
            : { status: 'ENABLED' }
        }
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
      >
        {!editingId && (
          <>
            <ProFormText
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
              placeholder="请输入用户名"
            />
            <ProFormText.Password
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
              placeholder="请输入密码"
            />
          </>
        )}
        <ProFormText name="nickname" label="昵称" placeholder="请输入昵称" />
        <ProFormTreeSelect
          name="deptId"
          label="部门"
          placeholder="请选择部门"
          allowClear
          fieldProps={{
            treeData: deptTree ? transformDeptTree(deptTree) : [],
            treeDefaultExpandAll: true,
          }}
        />
        <ProFormText name="phone" label="手机号" placeholder="请输入手机号" />
        <ProFormText name="email" label="邮箱" placeholder="请输入邮箱" />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '正常', value: 'ENABLED' },
            { label: '停用', value: 'DISABLED' },
          ]}
        />
      </ModalForm>

      {/* 重置密码弹窗 */}
      <Modal
        title={`重置密码 - ${editingRecord?.username || ''}`}
        open={resetPwdModalOpen}
        onOk={() => {
          if (!newPassword || newPassword.length < 6) {
            message.error('密码至少6位');
            return;
          }
          if (editingRecord) {
            resetPwdMutation.mutate({ id: editingRecord.id, password: newPassword });
          }
        }}
        onCancel={() => {
          setResetPwdModalOpen(false);
          setEditingRecord(null);
          setNewPassword('');
        }}
        confirmLoading={resetPwdMutation.isPending}
      >
        <div style={{ marginTop: 16 }}>
          <Input.Password
            placeholder="请输入新密码（至少6位）"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
      </Modal>

      {/* 分配角色弹窗 */}
      <Modal
        title={`分配角色 - ${editingRecord?.username || ''}`}
        open={assignRoleModalOpen}
        onOk={() => {
          if (editingRecord) {
            assignRoleMutation.mutate({ id: editingRecord.id, roleIds: selectedRoleIds });
          }
        }}
        onCancel={() => {
          setAssignRoleModalOpen(false);
          setEditingRecord(null);
          setSelectedRoleIds([]);
        }}
        confirmLoading={assignRoleMutation.isPending}
      >
        <div style={{ marginTop: 16 }}>
          <ProFormSelect
            name="roleIds"
            mode="multiple"
            placeholder="请选择角色"
            fieldProps={{
              value: selectedRoleIds,
              onChange: (value) => setSelectedRoleIds(value as number[]),
              style: { width: '100%' },
            }}
            options={roles?.map((role) => ({ label: role.name, value: role.id }))}
          />
        </div>
      </Modal>
    </>
  );
};

export default UserList;
