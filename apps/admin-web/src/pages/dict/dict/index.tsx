import { useRef, useState } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { ProColumns, ModalForm, ProFormText, ProFormSelect, ProFormTextArea, ProFormDigit } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag, Tabs } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dictApi, DictType, DictData } from '@/services/dict/dict';
import PermissionButton from '@/components/PermissionButton';
import { SYSTEM } from '@/constants/permissions';
import dayjs from 'dayjs';
import ProTable, { ProTableRef } from '@/components/ProTable';

const DictList: React.FC = () => {
  const typeActionRef = useRef<ProTableRef>(null);
  const dataActionRef = useRef<ProTableRef>(null);
  const [activeTab, setActiveTab] = useState('type');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTypeRecord, setEditingTypeRecord] = useState<DictType | null>(null);
  const [editingDataRecord, setEditingDataRecord] = useState<DictData | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: dictData, isLoading: dataLoading } = useQuery({
    queryKey: ['dict-data', selectedType],
    queryFn: () => dictApi.listData({ dictType: selectedType! }),
    enabled: !!selectedType,
  });

  const saveTypeMutation = useMutation({
    mutationFn: (values: any) => {
      if (editingId) return dictApi.updateType(editingId, values);
      return dictApi.createType(values);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      closeModal();
      typeActionRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['dict-types'] });
    },
  });

  const saveDataMutation = useMutation({
    mutationFn: (values: any) => {
      if (editingId) return dictApi.updateData(editingId, values);
      return dictApi.createData({ ...values, dictType: selectedType });
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['dict-data'] });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: dictApi.deleteType,
    onSuccess: () => {
      message.success('删除成功');
      typeActionRef.current?.reload();
    },
  });

  const deleteDataMutation = useMutation({
    mutationFn: dictApi.deleteData,
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['dict-data'] });
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setEditingTypeRecord(null);
    setEditingDataRecord(null);
  };

  const handleEditType = (record: DictType) => {
    setEditingId(record.id);
    setEditingTypeRecord(record);
    setModalOpen(true);
  };

  const handleEditData = (record: DictData) => {
    setEditingId(record.id);
    setEditingDataRecord(record);
    setModalOpen(true);
  };

  const handleAddType = () => {
    setEditingId(null);
    setEditingTypeRecord(null);
    setModalOpen(true);
  };

  const handleAddData = () => {
    setEditingId(null);
    setEditingDataRecord(null);
    setModalOpen(true);
  };

  const typeColumns: ProColumns<DictType>[] = [
    {
      title: '字典名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '字典类型',
      dataIndex: 'type',
      width: 200,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedType(record.type);
            setActiveTab('data');
          }}
        >
          {record.type}
        </Button>
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
      render: (_, record) => (
        <Tag color={record.status === 'ENABLED' ? 'success' : 'error'}>
          {record.status === 'ENABLED' ? '正常' : '停用'}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => (
        <Space>
          <PermissionButton
            type="link"
            size="small"
            permission={SYSTEM.DICT.EDIT}
            icon={<EditOutlined />}
            onClick={() => handleEditType(record)}
            fallbackMode="disabled"
          >
            编辑
          </PermissionButton>
          <Popconfirm title="确定删除吗？" onConfirm={() => deleteTypeMutation.mutate(record.id)}>
            <PermissionButton
              type="link"
              size="small"
              danger
              permission={SYSTEM.DICT.REMOVE}
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

  const dataColumns: ProColumns<DictData>[] = [
    {
      title: '字典标签',
      dataIndex: 'label',
      width: 150,
    },
    {
      title: '字典值',
      dataIndex: 'value',
      width: 150,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
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
      render: (_, record) => (
        <Tag color={record.status === 'ENABLED' ? 'success' : 'error'}>
          {record.status === 'ENABLED' ? '正常' : '停用'}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => (
        <Space>
          <PermissionButton
            type="link"
            size="small"
            permission={SYSTEM.DICT.EDIT}
            icon={<EditOutlined />}
            onClick={() => handleEditData(record)}
            fallbackMode="disabled"
          >
            编辑
          </PermissionButton>
          <Popconfirm title="确定删除吗？" onConfirm={() => deleteDataMutation.mutate(record.id)}>
            <PermissionButton
              type="link"
              size="small"
              danger
              permission={SYSTEM.DICT.REMOVE}
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
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'type',
            label: '字典类型',
            children: (
              <ProTable
                actionRef={typeActionRef}
                columns={typeColumns}
                rowKey="id"
                request={async (params: any) => {
                  const { current, pageSize, ...rest } = params;
                  const result = await dictApi.listType({
                    page: current,
                    pageSize,
                    ...rest,
                  });
                  return {
                    data: result.data,
                    total: result.total,
                    success: true,
                  };
                }}
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
                    permission={SYSTEM.DICT.ADD}
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddType}
                  >
                    新增类型
                  </PermissionButton>,
                ]}
              />
            ),
          },
          {
            key: 'data',
            label: `字典数据${selectedType ? ` - ${selectedType}` : ''}`,
            children: selectedType ? (
              <ProTable
                actionRef={dataActionRef}
                columns={dataColumns}
                dataSource={dictData?.data}
                loading={dataLoading}
                rowKey="id"
                search={false}
                pagination={{
                  showSizeChanger: true,
                  showTotal: (total: number) => `共 ${total} 条`,
                  total: dictData?.total,
                }}
                request={async () => ({
                  data: dictData?.data || [],
                  total: dictData?.total || 0,
                  success: true,
                })}
                toolBarRender={() => [
                  <Button
                    key="back"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => {
                      setActiveTab('type');
                      setSelectedType(null);
                    }}
                  >
                    返回类型列表
                  </Button>,
                  <PermissionButton
                    key="add"
                    permission={SYSTEM.DICT.ADD}
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddData}
                  >
                    新增数据
                  </PermissionButton>,
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>请先选择一个字典类型</div>
            ),
          },
        ]}
      />

      {/* 字典类型表单 */}
      {activeTab === 'type' && (
        <ModalForm
          title={editingId ? '编辑字典类型' : '新增字典类型'}
          open={modalOpen}
          onOpenChange={setModalOpen}
          initialValues={
            editingTypeRecord
              ? {
                  name: editingTypeRecord.name,
                  type: editingTypeRecord.type,
                  status: editingTypeRecord.status,
                  remark: editingTypeRecord.remark,
                }
              : { status: 'ENABLED' }
          }
          modalProps={{
            destroyOnHidden: true,
          }}
          onFinish={async (values) => {
            await saveTypeMutation.mutateAsync(values);
            return true;
          }}
        >
          <ProFormText
            name="name"
            label="字典名称"
            rules={[{ required: true, message: '请输入字典名称' }]}
            placeholder="请输入字典名称"
          />
          <ProFormText
            name="type"
            label="字典类型"
            rules={[{ required: true, message: '请输入字典类型' }]}
            placeholder="请输入字典类型"
            disabled={!!editingId}
          />
          <ProFormSelect
            name="status"
            label="状态"
            options={[
              { label: '正常', value: 'ENABLED' },
              { label: '停用', value: 'DISABLED' },
            ]}
          />
          <ProFormTextArea name="remark" label="备注" placeholder="请输入备注" fieldProps={{ rows: 3 }} />
        </ModalForm>
      )}

      {/* 字典数据表单 */}
      {activeTab === 'data' && (
        <ModalForm
          title={editingId ? '编辑字典数据' : '新增字典数据'}
          open={modalOpen}
          onOpenChange={setModalOpen}
          initialValues={
            editingDataRecord
              ? {
                  label: editingDataRecord.label,
                  value: editingDataRecord.value,
                  sort: editingDataRecord.sort,
                  status: editingDataRecord.status,
                  remark: editingDataRecord.remark,
                }
              : { sort: 0, status: 'ENABLED' }
          }
          modalProps={{
            destroyOnHidden: true,
          }}
          onFinish={async (values) => {
            await saveDataMutation.mutateAsync(values);
            return true;
          }}
        >
          <ProFormText
            name="label"
            label="字典标签"
            rules={[{ required: true, message: '请输入字典标签' }]}
            placeholder="请输入字典标签"
          />
          <ProFormText
            name="value"
            label="字典值"
            rules={[{ required: true, message: '请输入字典值' }]}
            placeholder="请输入字典值"
          />
          <ProFormDigit name="sort" label="排序" min={0} fieldProps={{ style: { width: '100%' } }} />
          <ProFormSelect
            name="status"
            label="状态"
            options={[
              { label: '正常', value: 'ENABLED' },
              { label: '停用', value: 'DISABLED' },
            ]}
          />
          <ProFormTextArea name="remark" label="备注" placeholder="请输入备注" fieldProps={{ rows: 3 }} />
        </ModalForm>
      )}
    </>
  );
};

export default DictList;
