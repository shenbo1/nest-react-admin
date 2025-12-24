import { useMemo, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, SubnodeOutlined } from '@ant-design/icons';
import { ProColumns, ModalForm, ProFormText, ProFormSelect, ProFormTreeSelect, ProFormDigit, ProFormSwitch } from '@ant-design/pro-components';
import { Form, message, Popconfirm, Space, Tag, Switch, Modal } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { menuApi, Menu, CreateMenuParams } from '@/services/system/system';
import PermissionButton from '@/components/PermissionButton';
import { SYSTEM } from '@/constants/permissions';
import { generateMenuPermission } from '@/utils/permission-key';
import ProTable from '@/components/ProTable';

const MenuList: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<Menu | null>(null);
  const [permsManuallyEdited, setPermsManuallyEdited] = useState(false);
  const [form] = Form.useForm<CreateMenuParams>();
  const queryClient = useQueryClient();

  const { data: menuList, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: menuApi.list,
  });

  const saveMutation = useMutation({
    mutationFn: (values: CreateMenuParams) => {
      if (editingId) {
        return menuApi.update(editingId, values);
      }
      return menuApi.create(values);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: menuApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: menuApi.toggleStatus,
    onSuccess: () => {
      message.success('状态更新成功');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    // onError: (error: any) => {
    //   message.error(error?.message || '状态更新失败');
    // },
  });

  const handleToggleStatus = (record: Menu) => {
    Modal.confirm({
      title: '确认切换状态',
      content: `确定要${record.status === 'ENABLED' ? '禁用' : '启用'}「${record.name}」吗？`,
      onOk: () => toggleStatusMutation.mutate(record.id),
    });
  };

  const handleEdit = (record: Menu) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setPermsManuallyEdited(false);
    setModalOpen(true);
  };

  const handleAddChild = (record: Menu) => {
    setEditingId(null);
    setEditingRecord({ parentId: record.id } as Menu);
    setPermsManuallyEdited(false);
    setModalOpen(true);
  };

  const transformTreeData = (nodes: Menu[]): any[] => {
    return nodes.map((node) => ({
      value: node.id,
      title: node.name,
      children: node.children ? transformTreeData(node.children) : undefined,
    }));
  };

  const menuMap = useMemo(() => {
    const map = new Map<number, Menu>();
    const walk = (nodes: Menu[]) => {
      nodes.forEach((node) => {
        map.set(node.id, node);
        if (node.children) {
          walk(node.children);
        }
      });
    };
    if (menuList) {
      walk(menuList);
    }
    return map;
  }, [menuList]);

  const updatePermsIfNeeded = (nextValues?: Partial<CreateMenuParams>) => {
    if (editingId || permsManuallyEdited) return;
    const values = { ...form.getFieldsValue(), ...nextValues };
    const parentMenu = values.parentId ? menuMap.get(values.parentId as number) : undefined;
    const perms = generateMenuPermission({
      type: values.type,
      path: values.path,
      name: values.name,
      parentPath: parentMenu?.path,
      parentPerms: parentMenu?.perms,
    });
    form.setFieldsValue({ perms });
  };

  const columns: ProColumns<Menu>[] = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 100,
      hideInSearch: true,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '权限标识',
      dataIndex: 'perms',
      width: 180,
      hideInSearch: true,
    },
    {
      title: '组件路径',
      dataIndex: 'component',
      width: 200,
      hideInSearch: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      valueType: 'select',
      valueEnum: {
        DIR: { text: '目录', status: 'Processing' },
        MENU: { text: '菜单', status: 'Success' },
        BUTTON: { text: '按钮', status: 'Warning' },
      },
      render: (_, record) => {
        const map: Record<string, { text: string; color: string }> = {
          DIR: { text: '目录', color: 'blue' },
          MENU: { text: '菜单', color: 'green' },
          BUTTON: { text: '按钮', color: 'orange' },
        };
        return <Tag color={map[record.type]?.color}>{map[record.type]?.text}</Tag>;
      },
    },
    {
      title: '可见',
      dataIndex: 'visible',
      width: 80,
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.visible ? 'success' : 'default'}>{record.visible ? '是' : '否'}</Tag>
      ),
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
      render: (_, record: Menu) => (
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
            permission={SYSTEM.MENU.EDIT}
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            fallbackMode="disabled"
          >
            编辑
          </PermissionButton>
          <PermissionButton
            type="link"
            size="small"
            permission={SYSTEM.MENU.ADD}
            icon={<SubnodeOutlined />}
            onClick={() => handleAddChild(record)}
            fallbackMode="disabled"
          >
            新增子菜单
          </PermissionButton>
          <Popconfirm title="确定删除吗？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <PermissionButton
              type="link"
              size="small"
              danger
              permission={SYSTEM.MENU.REMOVE}
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
          data: menuList || [],
          total: menuList?.length || 0,
          success: true,
        })}
        columns={columns}
        dataSource={menuList}
        rowKey="id"
        loading={isLoading}
        search={false}
        pagination={false}
        expandable={{ defaultExpandAllRows: true }}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={SYSTEM.MENU.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增菜单
          </PermissionButton>,
        ]}
      />

      <ModalForm<CreateMenuParams>
        title={editingId ? '编辑菜单' : '新增菜单'}
        open={modalOpen}
        form={form}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setPermsManuallyEdited(false);
          } else if (!editingId) {
            setPermsManuallyEdited(false);
          }
        }}
        width={600}
        initialValues={
          editingRecord
            ? {
                parentId: editingRecord.parentId,
                type: editingRecord.type,
                name: editingRecord.name,
                icon: editingRecord.icon,
                sort: editingRecord.sort,
                path: editingRecord.path,
                component: editingRecord.component,
                perms: editingRecord.perms,
                visible: editingRecord.visible,
                status: editingRecord.status,
              }
            : { parentId: 0, sort: 0, visible: true, status: 'ENABLED' }
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
          label="上级菜单"
          placeholder="请选择上级菜单"
          allowClear
          fieldProps={{
            treeData: [{ value: 0, title: '根目录' }, ...(menuList ? transformTreeData(menuList) : [])],
            treeDefaultExpandAll: true,
            onChange: (value) => {
              updatePermsIfNeeded({ parentId: value as number });
            },
          }}
        />
        <ProFormSelect
          name="type"
          label="菜单类型"
          rules={[{ required: true, message: '请选择菜单类型' }]}
          placeholder="请选择菜单类型"
          options={[
            { label: '目录', value: 'DIR' },
            { label: '菜单', value: 'MENU' },
            { label: '按钮', value: 'BUTTON' },
          ]}
          fieldProps={{
            onChange: (value) => {
              updatePermsIfNeeded({ type: value as CreateMenuParams['type'] });
            },
          }}
        />
        <ProFormText
          name="name"
          label="菜单名称"
          rules={[{ required: true, message: '请输入菜单名称' }]}
          placeholder="请输入菜单名称"
          fieldProps={{
            onChange: (event) => {
              updatePermsIfNeeded({ name: event.target.value });
            },
          }}
        />
        <ProFormText name="icon" label="图标" placeholder="请输入图标名称" />
        <ProFormDigit name="sort" label="排序" min={0} fieldProps={{ style: { width: '100%' } }} />
        <ProFormText
          name="path"
          label="路由地址"
          placeholder="请输入路由地址"
          fieldProps={{
            onChange: (event) => {
              updatePermsIfNeeded({ path: event.target.value });
            },
          }}
        />
        <ProFormText name="component" label="组件路径" placeholder="请输入组件路径" />
        <ProFormText
          name="perms"
          label="权限标识"
          placeholder="请输入权限标识，如：system:user:list"
          fieldProps={{
            onChange: () => setPermsManuallyEdited(true),
          }}
        />
        <ProFormSwitch name="visible" label="是否可见" />
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

export default MenuList;
