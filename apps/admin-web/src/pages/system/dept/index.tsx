import { useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, SubnodeOutlined } from '@ant-design/icons';
import { ProColumns, ModalForm, ProFormText, ProFormSelect, ProFormTreeSelect, ProFormDigit } from '@ant-design/pro-components';
import { message, Space, Switch, Modal, Popconfirm } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deptApi, Dept, CreateDeptParams } from '@/services/system/system';
import PermissionButton from '@/components/PermissionButton';
import { SYSTEM } from '@/constants/permissions';
import ProTable from '@/components/ProTable';

const DeptList: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<Dept | null>(null);
  const queryClient = useQueryClient();

  const { data: deptList, isLoading } = useQuery({
    queryKey: ['depts'],
    queryFn: deptApi.list,
  });

  const saveMutation = useMutation({
    mutationFn: (values: CreateDeptParams) => {
      if (editingId) {
        return deptApi.update(editingId, values);
      }
      return deptApi.create(values);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ['depts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deptApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['depts'] });
    },
  });

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: deptApi.toggleStatus,
    onSuccess: () => {
      message.success('状态更新成功');
      queryClient.invalidateQueries({ queryKey: ['depts'] });
    },
    // onError: (error: any) => {
    //   message.error(error?.message || '状态更新失败');
    // },
  });

  const handleToggleStatus = (record: Dept) => {
    Modal.confirm({
      title: '确认切换状态',
      content: `确定要${record.status === 'ENABLED' ? '禁用' : '启用'}「${record.name}」吗？`,
      onOk: () => toggleStatusMutation.mutate(record.id),
    });
  };

  const handleEdit = (record: Dept) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleAddChild = (record: Dept) => {
    setEditingId(null);
    setEditingRecord({ parentId: record.id } as Dept);
    setModalOpen(true);
  };

  const transformTreeData = (nodes: Dept[]): any[] => {
    return nodes.map((node) => ({
      value: node.id,
      title: node.name,
      children: node.children ? transformTreeData(node.children) : undefined,
    }));
  };

  const columns: ProColumns<Dept>[] = [
    {
      title: '部门名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '负责人',
      dataIndex: 'leader',
      width: 120,
      hideInSearch: true,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      width: 130,
      hideInSearch: true,
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
      width: 80,
      valueType: 'select',
      valueEnum: {
        ENABLED: { text: '正常', status: 'Success' },
        DISABLED: { text: '停用', status: 'Error' },
      },
      render: (_, record: Dept) => (
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
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, record) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            type="link"
            size="small"
            permission={SYSTEM.DEPT.EDIT}
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            fallbackMode="disabled"
          >
            编辑
          </PermissionButton>
          <PermissionButton
            type="link"
            size="small"
            permission={SYSTEM.DEPT.ADD}
            icon={<SubnodeOutlined />}
            onClick={() => handleAddChild(record)}
            fallbackMode="disabled"
          >
            新增子部门
          </PermissionButton>
          <Popconfirm title="确定删除吗？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <PermissionButton
              type="link"
              size="small"
              danger
              permission={SYSTEM.DEPT.REMOVE}
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
    <>
      <ProTable
        request={async () => ({
          data: deptList || [],
          total: deptList?.length || 0,
          success: true,
        })}
        columns={columns}
        dataSource={deptList}
        rowKey="id"
        loading={isLoading}
        search={false}
        pagination={false}
        expandable={{ defaultExpandAllRows: true }}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={SYSTEM.DEPT.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增部门
          </PermissionButton>,
        ]}
      />

      <ModalForm<CreateDeptParams>
        title={editingId ? '编辑部门' : '新增部门'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        width={500}
        initialValues={
          editingRecord
            ? {
                parentId: editingRecord.parentId,
                name: editingRecord.name,
                sort: editingRecord.sort,
                leader: editingRecord.leader,
                phone: editingRecord.phone,
                email: editingRecord.email,
                status: editingRecord.status,
              }
            : { parentId: 0, sort: 0, status: 'ENABLED' }
        }
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
      >
        <ProFormTreeSelect
          name="parentId"
          label="上级部门"
          placeholder="请选择上级部门"
          allowClear
          fieldProps={{
            treeData: [{ value: 0, title: '顶级部门' }, ...(deptList ? transformTreeData(deptList) : [])],
            treeDefaultExpandAll: true,
          }}
        />
        <ProFormText
          name="name"
          label="部门名称"
          rules={[{ required: true, message: '请输入部门名称' }]}
          placeholder="请输入部门名称"
        />
        <ProFormDigit name="sort" label="排序" min={0} fieldProps={{ style: { width: '100%' } }} />
        <ProFormText name="leader" label="负责人" placeholder="请输入负责人" />
        <ProFormText name="phone" label="联系电话" placeholder="请输入联系电话" />
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
    </>
  );
};

export default DeptList;
