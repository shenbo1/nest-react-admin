import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Switch } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
  ProFormDateTimeRangePicker,
  ProFormDependency,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import {
  pointRuleApi,
  PointRule,
  PointRuleForm,
} from '@/services/marketing/point-rule';
import { PermissionButton } from '@/components/PermissionButton';
import { MARKETING } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import dayjs from 'dayjs';

// 规则类型枚举
const ruleTypeEnums: Record<string, { text: string; color: string }> = {
  SIGN_IN: { text: '签到', color: 'blue' },
  CONSUME: { text: '消费', color: 'green' },
  REGISTER: { text: '注册', color: 'purple' },
  FIRST_ORDER: { text: '首单', color: 'orange' },
  BIRTHDAY: { text: '生日', color: 'pink' },
};

const statusEnums = {
  ENABLED: { text: '启用', status: 'Success' as const },
  DISABLED: { text: '禁用', status: 'Error' as const },
};

export default function PointRulePage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<PointRule | null>(null);
  const queryClient = useQueryClient();

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: PointRuleForm) => {
      if (editingId) {
        return pointRuleApi.update(editingId, data);
      }
      return pointRuleApi.create(data);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ['pointRuleList'] });
      actionRef.current?.reload();
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: pointRuleApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: pointRuleApi.toggleStatus,
    onSuccess: () => {
      message.success('状态更新成功');
      actionRef.current?.reload();
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个积分规则吗？',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleToggleStatus = (record: PointRule) => {
    Modal.confirm({
      title: '确认切换状态',
      content: `确定要${record.status === 'ENABLED' ? '禁用' : '启用'}「${record.name}」吗？`,
      onOk: () => toggleStatusMutation.mutate(record.id),
    });
  };

  const handleEdit = async (record: PointRule) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setModalOpen(true);
  };

  const columns: ProColumns<PointRule>[] = [
    {
      title: '规则编码',
      dataIndex: 'code',
      width: 120,
      render: (text) => <code>{text}</code>,
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '规则类型',
      dataIndex: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(ruleTypeEnums).map(([k, v]) => [k, { text: v.text }])
      ),
      render: (_, record) => (
        <Tag color={ruleTypeEnums[record.type]?.color}>
          {ruleTypeEnums[record.type]?.text}
        </Tag>
      ),
    },
    {
      title: '赠送积分',
      dataIndex: 'points',
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        if (record.type === 'CONSUME' && record.consumeUnit) {
          return <span>每{record.consumeUnit}元送{record.points}分</span>;
        }
        return <Tag color="blue">{record.points}积分</Tag>;
      },
    },
    {
      title: '每日上限',
      dataIndex: 'dailyLimit',
      width: 100,
      hideInSearch: true,
      render: (_, record) =>
        record.dailyLimit === 0 ? (
          <Tag color="green">不限制</Tag>
        ) : (
          `${record.dailyLimit}积分`
        ),
    },
    {
      title: '有效期',
      dataIndex: 'validDays',
      width: 100,
      hideInSearch: true,
      render: (_, record) =>
        record.validDays === 0 ? (
          <Tag color="green">永久</Tag>
        ) : (
          `${record.validDays}天`
        ),
    },
    {
      title: '生效时间',
      width: 200,
      hideInSearch: true,
      render: (_, record) => {
        if (record.startTime && record.endTime) {
          return (
            <span style={{ fontSize: 12 }}>
              {dayjs(record.startTime).format('YYYY-MM-DD')} ~ {dayjs(record.endTime).format('YYYY-MM-DD')}
            </span>
          );
        }
        return <Tag>长期有效</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: statusEnums,
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.status === 'ENABLED'}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onClick={() => handleToggleStatus(record)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      hideInSearch: true,
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            permission={MARKETING.POINT_RULE.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={MARKETING.POINT_RULE.REMOVE}
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

  // 准备初始值
  const getInitialValues = () => {
    if (editingRecord) {
      return {
        ...editingRecord,
        dateRange: editingRecord.startTime && editingRecord.endTime
          ? [dayjs(editingRecord.startTime), dayjs(editingRecord.endTime)]
          : undefined,
      };
    }
    return {
      status: 'ENABLED',
      dailyLimit: 0,
      totalLimit: 0,
      validDays: 0,
    };
  };

  return (
    <>
      <ProTable
        headerTitle="积分规则管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1200 }}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          const result = await pointRuleApi.list({
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
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MARKETING.POINT_RULE.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增规则
          </PermissionButton>,
        ]}
      />

      <ModalForm<PointRuleForm>
        title={editingId ? '编辑积分规则' : '新增积分规则'}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditingId(null);
            setEditingRecord(null);
          }
        }}
        width={600}
        initialValues={getInitialValues()}
        onFinish={async (values: any) => {
          // 处理日期范围
          if (values.dateRange && values.dateRange.length === 2) {
            values.startTime = dayjs(values.dateRange[0]).format('YYYY-MM-DD HH:mm:ss');
            values.endTime = dayjs(values.dateRange[1]).format('YYYY-MM-DD HH:mm:ss');
          }
          delete values.dateRange;
          await saveMutation.mutateAsync(values as PointRuleForm);
          return true;
        }}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
      >
        <ProFormText
          name="code"
          label="规则编码"
          placeholder="请输入规则编码，如 SIGN_IN_DAILY"
          rules={[{ required: true, message: '请输入规则编码' }]}
          disabled={!!editingId}
        />

        <ProFormText
          name="name"
          label="规则名称"
          placeholder="请输入规则名称"
          rules={[{ required: true, message: '请输入规则名称' }]}
        />

        <ProFormSelect
          name="type"
          label="规则类型"
          rules={[{ required: true, message: '请选择规则类型' }]}
          valueEnum={{
            SIGN_IN: '签到',
            CONSUME: '消费',
            REGISTER: '注册',
            FIRST_ORDER: '首单',
            BIRTHDAY: '生日',
          }}
        />

        <ProFormDigit
          name="points"
          label="基础积分"
          placeholder="请输入基础积分"
          rules={[{ required: true, message: '请输入基础积分' }]}
          min={1}
          fieldProps={{ precision: 0 }}
        />

        <ProFormDependency name={['type']}>
          {({ type }) =>
            type === 'CONSUME' && (
              <ProFormDigit
                name="consumeUnit"
                label="消费金额单位"
                placeholder="每消费X元送上述积分"
                rules={[{ required: true, message: '请输入消费金额单位' }]}
                min={1}
                fieldProps={{ precision: 2, addonAfter: '元' }}
              />
            )
          }
        </ProFormDependency>

        <ProFormDigit
          name="dailyLimit"
          label="每日上限"
          placeholder="0表示不限制"
          min={0}
          fieldProps={{ precision: 0 }}
          tooltip="用户每日通过此规则获取积分的上限，0表示不限制"
        />

        <ProFormDigit
          name="totalLimit"
          label="总上限"
          placeholder="0表示不限制"
          min={0}
          fieldProps={{ precision: 0 }}
          tooltip="用户通过此规则累计获取积分的总上限，0表示不限制"
        />

        <ProFormDigit
          name="validDays"
          label="积分有效期"
          placeholder="0表示永不过期"
          min={0}
          fieldProps={{ precision: 0, addonAfter: '天' }}
          tooltip="通过此规则获取的积分有效期，0表示永不过期"
        />

        <ProFormDateTimeRangePicker
          name="dateRange"
          label="生效时间"
          placeholder={['开始时间', '结束时间']}
          tooltip="规则的生效时间范围，不填则长期有效"
        />

        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入规则描述"
        />
      </ModalForm>
    </>
  );
}
