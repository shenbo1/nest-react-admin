import { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ProColumns, ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { message, Popconfirm } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PermissionButton from '@/components/PermissionButton';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { SYSTEM } from '@/constants/permissions';
import request from '@/utils/request';

interface Config {
  id: number;
  name: string;
  key: string;
  value: string;
  configType: string;
  remark?: string;
}

const ConfigList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<Config | null>(null);
  const queryClient = useQueryClient();

  // 创建/更新配置
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingId) {
        const result = await request.put(`/system/config/${editingId}`, values);
        return result;
      }
      const result = await request.post('/system/config', values);
      return result;
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
  });

  // 删除配置
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await request.delete(`/system/config/${id}`);
      return result;
    },
    onSuccess: () => {
      message.success('删除成功');
      tableRef.current?.reload();
    },
  });

  const handleEdit = (record: Config) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setModalOpen(true);
  };

  const columns: ProColumns<Config>[] = [
    {
      title: '配置名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '配置键名',
      dataIndex: 'key',
      width: 150,
    },
    {
      title: '配置值',
      dataIndex: 'value',
      width: 200,
      ellipsis: true,
    },
    {
      title: '配置类型',
      dataIndex: 'configType',
      width: 100,
      valueType: 'select',
      valueEnum: {
        Y: { text: '系统内置', status: 'Success' },
        N: { text: '用户配置', status: 'Default' },
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
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
          permission={SYSTEM.CONFIG.EDIT}
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
            permission={SYSTEM.CONFIG.REMOVE}
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
        api="/system/config"
        columns={columns}
        rowKey="id"
        scroll={{ x: 1000 }}
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
            permission={SYSTEM.CONFIG.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增配置
          </PermissionButton>,
        ]}
      />

      {/* 新增/编辑配置弹窗 */}
      <ModalForm<Config>
        title={editingId ? '编辑配置' : '新增配置'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        width={600}
        initialValues={
          editingRecord
            ? {
                name: editingRecord.name,
                key: editingRecord.key,
                value: editingRecord.value,
                configType: editingRecord.configType,
                remark: editingRecord.remark,
              }
            : { configType: 'N' }
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
          name="name"
          label="配置名称"
          rules={[{ required: true, message: '请输入配置名称' }]}
          placeholder="请输入配置名称"
        />
        <ProFormText
          name="key"
          label="配置键名"
          rules={[{ required: true, message: '请输入配置键名' }]}
          placeholder="请输入配置键名"
        />
        <ProFormText
          name="value"
          label="配置值"
          rules={[{ required: true, message: '请输入配置值' }]}
          placeholder="请输入配置值"
        />
        <ProFormSelect
          name="configType"
          label="配置类型"
          options={[
            { label: '系统内置', value: 'Y' },
            { label: '用户配置', value: 'N' },
          ]}
        />
        <ProFormText name="remark" label="备注" placeholder="请输入备注" />
      </ModalForm>
    </>
  );
};

export default ConfigList;
