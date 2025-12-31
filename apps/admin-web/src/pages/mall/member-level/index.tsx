import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Switch } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import {
  memberLevelApi,
  MemberLevel,
  MemberLevelForm,
} from '@/services/mall/member-level';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { DictRadio } from '@/components/DictSelect';
import { StatusEnums } from '@/stores/enums/common.enums';

export default function MemberLevelPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MemberLevel | null>(null);

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: MemberLevelForm) => {
      if (editingRecord) {
        return memberLevelApi.update(editingRecord.id, data);
      }
      return memberLevelApi.create(data);
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
    mutationFn: memberLevelApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？如有会员使用此等级，删除可能会失败。',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleEdit = (record: MemberLevel) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const getLevelColor = (level: number) => {
    if (level >= 5) return 'red';
    if (level >= 4) return 'gold';
    if (level >= 3) return 'orange';
    if (level >= 2) return 'blue';
    return 'default';
  };

  const columns: ProColumns<MemberLevel>[] = [
    {
      title: '等级编码',
      dataIndex: 'code',
      width: 120,
      fieldProps: {
        placeholder: '请输入编码',
      },
    },
    {
      title: '等级名称',
      dataIndex: 'name',
      width: 150,
      fieldProps: {
        placeholder: '请输入名称',
      },
      render: (_, record) => (
        <Tag color={getLevelColor(record.level)} icon={<CrownOutlined />}>
          {record.name}
        </Tag>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      width: 80,
      align: 'center',
      search: false,
      sorter: true,
    },
    {
      title: '成长值范围',
      dataIndex: 'minGrowth',
      width: 160,
      search: false,
      render: (_, record) =>
        record.maxGrowth
          ? `${record.minGrowth} ~ ${record.maxGrowth}`
          : `${record.minGrowth} 以上`,
    },
    {
      title: '折扣率',
      dataIndex: 'discountRate',
      width: 100,
      align: 'center',
      search: false,
      render: (value: any) =>
        value ? `${(Number(value) * 100).toFixed(0)}%` : '-',
    },
    {
      title: '积分倍率',
      dataIndex: 'pointsRate',
      width: 100,
      align: 'center',
      search: false,
      render: (value: any) => (value ? `${Number(value)}x` : '-'),
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
          disabled
        />
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      align: 'center',
      search: false,
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
      render: (_, record) => {
        const isEnabled = record.status === 'ENABLED';
        return (
          <Space>
            <PermissionButton
              permission={MALL.MEMBER_LEVEL.EDIT}
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={isEnabled}
              title={isEnabled ? '启用状态不可编辑' : undefined}
            >
              编辑
            </PermissionButton>
            <PermissionButton
              permission={MALL.MEMBER_LEVEL.REMOVE}
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              disabled={isEnabled}
              title={isEnabled ? '启用状态不可删除' : undefined}
            >
              删除
            </PermissionButton>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <ProTable
        headerTitle="会员等级管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1200 }}
        api="/mall/member-level"
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MALL.MEMBER_LEVEL.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增等级
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ModalForm<MemberLevelForm>
        title={editingRecord ? '编辑会员等级' : '新增会员等级'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={
          editingRecord || {
            level: 1,
            minGrowth: 0,
            sort: 0,
            status: StatusEnums.启用,
          }
        }
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
          width: 600,
        }}
      >
        <ProFormText
          name="code"
          label="等级编码"
          placeholder="请输入等级编码，如 VIP1"
          rules={[
            { required: true, message: '请输入等级编码' },
            { max: 20, message: '等级编码最多20个字符' },
          ]}
        />
        <ProFormText
          name="name"
          label="等级名称"
          placeholder="请输入等级名称，如 普通会员"
          rules={[
            { required: true, message: '请输入等级名称' },
            { max: 50, message: '等级名称最多50个字符' },
          ]}
        />
        <ProFormDigit
          name="level"
          label="等级"
          placeholder="请输入等级数值"
          min={1}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true, message: '请输入等级' }]}
          tooltip="等级数值越大，等级越高"
        />
        <ProFormDigit
          name="minGrowth"
          label="最小成长值"
          placeholder="请输入最小成长值"
          min={0}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true, message: '请输入最小成长值' }]}
        />
        <ProFormDigit
          name="maxGrowth"
          label="最大成长值"
          placeholder="留空表示无上限"
          min={0}
          fieldProps={{ precision: 0 }}
          tooltip="留空表示无上限（最高等级）"
        />
        <ProFormDigit
          name="discountRate"
          label="折扣率"
          placeholder="请输入折扣率，如 0.9 表示9折"
          min={0}
          max={1}
          fieldProps={{ precision: 2, step: 0.01 }}
          tooltip="0.9 表示9折，1 表示无折扣"
        />
        <ProFormDigit
          name="pointsRate"
          label="积分倍率"
          placeholder="请输入积分倍率，如 1.5 表示1.5倍积分"
          min={0}
          fieldProps={{ precision: 2, step: 0.1 }}
          tooltip="1.5 表示消费获得1.5倍积分"
        />
        <ProFormTextArea
          name="benefits"
          label="会员权益"
          placeholder="请输入会员权益说明"
          fieldProps={{
            autoSize: { minRows: 2, maxRows: 4 },
            maxLength: 1000,
            showCount: true,
          }}
        />
        <ProFormDigit
          name="sort"
          label="排序"
          placeholder="请输入排序值"
          min={0}
          fieldProps={{ precision: 0 }}
        />
        <DictRadio name="status" label="状态" enum={StatusEnums} />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注信息"
          fieldProps={{
            autoSize: { minRows: 2, maxRows: 4 },
            maxLength: 500,
            showCount: true,
          }}
        />
      </ModalForm>
    </>
  );
}
