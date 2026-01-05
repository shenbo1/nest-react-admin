import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Switch } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSwitch,
  ProFormGroup,
  ProFormSelect,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  memberAddressApi,
  MemberAddress,
  MemberAddressForm,
} from '@/services/mall/member-address';
import { memberApi } from '@/services/mall/member';
import { PermissionButton } from '@/components/PermissionButton';
import { MEMBER } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';

export default function MemberAddressPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MemberAddress | null>(null);

  // 获取会员列表用于选择
  const { data: memberOptions = [] } = useQuery({
    queryKey: ['memberOptionsForAddress'],
    queryFn: async () => {
      const res = await memberApi.list({ pageSize: 1000 });
      return res.data.map((m) => ({
        label: m.nickname || m.username,
        value: m.id,
      }));
    },
  });

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: MemberAddressForm) => {
      if (editingRecord) {
        return memberAddressApi.update(editingRecord.id, data);
      }
      return memberAddressApi.create(data);
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
    mutationFn: memberAddressApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  // 设置默认
  const setDefaultMutation = useMutation({
    mutationFn: memberAddressApi.setDefault,
    onSuccess: () => {
      message.success('设置成功');
      actionRef.current?.reload();
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条收货地址吗？删除后无法恢复。',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleEdit = (record: MemberAddress) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const columns: ProColumns<MemberAddress>[] = [
    {
      title: '会员',
      dataIndex: 'memberId',
      width: 150,
      valueType: 'select',
      fieldProps: {
        options: memberOptions,
        showSearch: true,
        placeholder: '请选择会员',
      },
      render: (_, record) => (
        <span>{record.member?.nickname || record.member?.username || '-'}</span>
      ),
    },
    {
      title: '收货人',
      dataIndex: 'receiver',
      width: 120,
      fieldProps: {
        placeholder: '请输入收货人',
      },
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      width: 140,
      fieldProps: {
        placeholder: '请输入电话',
      },
      render: (text) => (
        <span>
          <PhoneOutlined style={{ marginRight: 4 }} />
          {text}
        </span>
      ),
    },
    {
      title: '收货地址',
      dataIndex: 'address',
      width: 300,
      search: false,
      ellipsis: true,
      render: (_, record) => {
        const fullAddress = [
          record.province,
          record.city,
          record.district,
          record.street,
          record.address,
        ]
          .filter(Boolean)
          .join('');
        return (
          <span>
            <EnvironmentOutlined style={{ marginRight: 4, color: '#1890ff' }} />
            {fullAddress}
          </span>
        );
      },
    },
    {
      title: '默认地址',
      dataIndex: 'isDefault',
      width: 100,
      align: 'center',
      search: false,
      render: (_, record) => (
        <Switch
          checked={record.isDefault}
          checkedChildren="默认"
          unCheckedChildren="否"
          loading={setDefaultMutation.isPending}
          onChange={() => {
            if (!record.isDefault) {
              setDefaultMutation.mutate(record.id);
            }
          }}
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
            permission={MEMBER.ADDRESS.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={MEMBER.ADDRESS.REMOVE}
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
        headerTitle="收货地址管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1200 }}
        api="/mall/member-address"
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MEMBER.ADDRESS.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增地址
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ModalForm<MemberAddressForm>
        title={editingRecord ? '编辑收货地址' : '新增收货地址'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={
          editingRecord || {
            isDefault: false,
          }
        }
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
          width: 700,
        }}
      >
        <ProFormGroup title="基本信息">
          <ProFormSelect
            name="memberId"
            label="会员"
            placeholder="请选择会员"
            rules={[{ required: true, message: '请选择会员' }]}
            options={memberOptions}
            fieldProps={{
              showSearch: true,
              optionFilterProp: 'label',
            }}
            colProps={{ span: 12 }}
            disabled={!!editingRecord}
          />
          <ProFormText
            name="receiver"
            label="收货人"
            placeholder="请输入收货人姓名"
            rules={[{ required: true, message: '请输入收货人' }]}
            colProps={{ span: 12 }}
          />
          <ProFormText
            name="phone"
            label="联系电话"
            placeholder="请输入联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
            colProps={{ span: 12 }}
          />
          <ProFormText
            name="postalCode"
            label="邮政编码"
            placeholder="请输入邮政编码"
            colProps={{ span: 12 }}
          />
        </ProFormGroup>

        <ProFormGroup title="地址信息">
          <ProFormText
            name="province"
            label="省份"
            placeholder="请输入省份"
            colProps={{ span: 8 }}
          />
          <ProFormText
            name="city"
            label="城市"
            placeholder="请输入城市"
            colProps={{ span: 8 }}
          />
          <ProFormText
            name="district"
            label="区/县"
            placeholder="请输入区/县"
            colProps={{ span: 8 }}
          />
          <ProFormText
            name="street"
            label="街道"
            placeholder="请输入街道"
            colProps={{ span: 24 }}
          />
          <ProFormTextArea
            name="address"
            label="详细地址"
            placeholder="请输入详细地址"
            rules={[{ required: true, message: '请输入详细地址' }]}
            fieldProps={{
              autoSize: { minRows: 2, maxRows: 4 },
            }}
          />
        </ProFormGroup>

        <ProFormGroup title="其他设置">
          <ProFormSwitch
            name="isDefault"
            label="设为默认"
            colProps={{ span: 12 }}
          />
          <ProFormTextArea
            name="remark"
            label="备注"
            placeholder="请输入备注信息"
            fieldProps={{
              autoSize: { minRows: 2, maxRows: 4 },
            }}
          />
        </ProFormGroup>
      </ModalForm>
    </>
  );
}
