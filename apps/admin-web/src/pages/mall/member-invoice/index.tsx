import { useRef, useState } from 'react';
import { message, Modal, Space, Switch, Tooltip } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSwitch,
  ProFormDependency,
  ProFormSelect,
  ProFormRadio,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  memberInvoiceApi,
  MemberInvoice,
  MemberInvoiceForm,
  InvoiceType,
} from '@/services/mall/member-invoice';
import { memberApi } from '@/services/mall/member';
import { PermissionButton } from '@/components/PermissionButton';
import { MEMBER } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';

const invoiceTypeOptions = [
  { label: '电子普票', value: 'ELECTRONIC' },
  { label: '纸质普票', value: 'PAPER' },
  { label: '增值税专票', value: 'VAT_SPECIAL' },
];

const invoiceTitleTypeOptions = [
  { label: '个人', value: 'PERSONAL' },
  { label: '企业', value: 'COMPANY' },
];

// 增值税专票只能是企业
const getInvoiceTitleTypeOptions = (invoiceType?: InvoiceType) => {
  if (invoiceType === 'VAT_SPECIAL') {
    return [{ label: '企业', value: 'COMPANY' }];
  }
  return invoiceTitleTypeOptions;
};

export default function MemberInvoicePage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MemberInvoice | null>(null);

  // 获取会员列表用于选择
  const { data: memberOptions = [] } = useQuery({
    queryKey: ['memberOptionsForInvoice'],
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
    mutationFn: (data: MemberInvoiceForm) => {
      if (editingRecord) {
        return memberInvoiceApi.update(editingRecord.id, data);
      }
      return memberInvoiceApi.create(data);
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
    mutationFn: memberInvoiceApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  // 设置默认
  const setDefaultMutation = useMutation({
    mutationFn: memberInvoiceApi.setDefault,
    onSuccess: () => {
      message.success('设置成功');
      actionRef.current?.reload();
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条发票信息吗？删除后无法恢复。',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleEdit = (record: MemberInvoice) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const columns: ProColumns<MemberInvoice>[] = [
    {
      title: '会员',
      dataIndex: 'memberId',
      width: 120,
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
      title: '发票类型',
      dataIndex: 'invoiceType',
      width: 100,
      valueType: 'select',
      valueEnum: {
        ELECTRONIC: { text: '电子普票', status: 'Processing' },
        PAPER: { text: '纸质普票', status: 'Default' },
        VAT_SPECIAL: { text: '增值税专票', status: 'Success' },
      },
    },
    {
      title: '抬头类型',
      dataIndex: 'invoiceTitleType',
      width: 80,
      valueType: 'select',
      valueEnum: {
        PERSONAL: { text: '个人', status: 'Default' },
        COMPANY: { text: '企业', status: 'Processing' },
      },
    },
    {
      title: '发票抬头',
      dataIndex: 'invoiceTitle',
      width: 180,
      ellipsis: true,
      fieldProps: {
        placeholder: '请输入发票抬头',
      },
      render: (_, record) => (
        <Tooltip title={record.invoiceTitle}>
          <span>{record.invoiceTitle || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '税号',
      dataIndex: 'invoiceTaxNo',
      width: 180,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => (
        <Tooltip title={record.invoiceTaxNo}>
          <span>{record.invoiceTaxNo || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      width: 180,
      hideInSearch: true,
      render: (_, record) => {
        // 电子普票显示邮箱，其他显示电话
        if (record.invoiceType === 'ELECTRONIC') {
          return record.invoiceEmail ? (
            <span>
              <MailOutlined style={{ marginRight: 4, color: '#1890ff' }} />
              {record.invoiceEmail}
            </span>
          ) : (
            '-'
          );
        }
        return record.invoicePhone ? (
          <span>
            <PhoneOutlined style={{ marginRight: 4, color: '#52c41a' }} />
            {record.invoicePhone}
          </span>
        ) : (
          '-'
        );
      },
    },
    {
      title: '开户信息',
      dataIndex: 'bankInfo',
      width: 200,
      hideInSearch: true,
      render: (_, record) => {
        // 只有增值税专票需要显示开户信息
        if (record.invoiceType !== 'VAT_SPECIAL') {
          return '-';
        }
        if (!record.bankName && !record.bankAccount) {
          return '-';
        }
        return (
          <Tooltip title={`${record.bankName || ''} ${record.bankAccount || ''}`}>
            <span>
              {record.bankName || ''}{record.bankName && record.bankAccount ? ' / ' : ''}{record.bankAccount || ''}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '默认',
      dataIndex: 'isDefault',
      width: 80,
      align: 'center',
      hideInSearch: true,
      render: (_, record) => (
        <Switch
          checked={record.isDefault}
          checkedChildren="是"
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
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <PermissionButton
            permission={MEMBER.INVOICE.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={MEMBER.INVOICE.REMOVE}
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
        headerTitle="发票信息管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1400 }}
        api="/mall/member-invoice"
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MEMBER.INVOICE.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增发票信息
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ModalForm<MemberInvoiceForm>
        title={editingRecord ? '编辑发票信息' : '新增发票信息'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={
          editingRecord || {
            invoiceType: 'ELECTRONIC',
            invoiceTitleType: 'PERSONAL',
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
          width: 650,
        }}
      >
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
          disabled={!!editingRecord}
        />

        <ProFormRadio.Group
          name="invoiceType"
          label="发票类型"
          options={invoiceTypeOptions}
          rules={[{ required: true, message: '请选择发票类型' }]}
        />

        <ProFormDependency name={['invoiceType']}>
          {({ invoiceType }) => (
            <ProFormRadio.Group
              name="invoiceTitleType"
              label="抬头类型"
              options={getInvoiceTitleTypeOptions(invoiceType)}
              rules={[{ required: true, message: '请选择抬头类型' }]}
            />
          )}
        </ProFormDependency>

        <ProFormText
          name="invoiceTitle"
          label="发票抬头"
          placeholder="请输入发票抬头（个人姓名或企业名称）"
          rules={[{ required: true, message: '请输入发票抬头' }]}
        />

        <ProFormDependency name={['invoiceType', 'invoiceTitleType']}>
          {({ invoiceType, invoiceTitleType }) => {
            // 企业或增值税专票需要填写税号
            const needTaxNo = invoiceTitleType === 'COMPANY' || invoiceType === 'VAT_SPECIAL';
            if (!needTaxNo) return null;
            return (
              <ProFormText
                name="invoiceTaxNo"
                label="税号"
                placeholder="请输入纳税人识别号"
                rules={[{ required: invoiceType === 'VAT_SPECIAL', message: '增值税专票必须填写税号' }]}
              />
            );
          }}
        </ProFormDependency>

        <ProFormText
          name="invoiceContent"
          label="发票内容"
          placeholder="请输入发票内容，如：商品明细、服务费等"
        />

        <ProFormDependency name={['invoiceType']}>
          {({ invoiceType }) => {
            // 电子普票需要邮箱
            if (invoiceType === 'ELECTRONIC') {
              return (
                <ProFormText
                  name="invoiceEmail"
                  label="接收邮箱"
                  placeholder="请输入接收电子发票的邮箱"
                  rules={[
                    { required: true, message: '电子普票需要填写接收邮箱' },
                    { type: 'email', message: '请输入正确的邮箱格式' },
                  ]}
                />
              );
            }
            // 纸质普票和增值税专票需要电话和地址
            return (
              <>
                <ProFormText
                  name="invoicePhone"
                  label="联系电话"
                  placeholder="请输入联系电话"
                  rules={[{ required: invoiceType === 'VAT_SPECIAL', message: '增值税专票需要填写联系电话' }]}
                />
                <ProFormText
                  name="invoiceAddress"
                  label="收票地址"
                  placeholder="请输入收票地址"
                  rules={[{ required: invoiceType === 'VAT_SPECIAL', message: '增值税专票需要填写地址' }]}
                />
              </>
            );
          }}
        </ProFormDependency>

        <ProFormDependency name={['invoiceType']}>
          {({ invoiceType }) => {
            // 增值税专票需要开户信息
            if (invoiceType !== 'VAT_SPECIAL') return null;
            return (
              <>
                <ProFormText
                  name="bankName"
                  label="开户银行"
                  placeholder="请输入开户银行名称"
                  rules={[{ required: true, message: '增值税专票需要填写开户银行' }]}
                />
                <ProFormText
                  name="bankAccount"
                  label="银行账号"
                  placeholder="请输入银行账号"
                  rules={[{ required: true, message: '增值税专票需要填写银行账号' }]}
                />
              </>
            );
          }}
        </ProFormDependency>

        <ProFormSwitch
          name="isDefault"
          label="设为默认"
        />

        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注信息"
          fieldProps={{
            autoSize: { minRows: 2, maxRows: 4 },
          }}
        />
      </ModalForm>
    </>
  );
}
