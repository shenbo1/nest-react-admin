import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Switch, Card } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
  ProFormDateTimeRangePicker,
  ProFormSwitch,
  ProFormList,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import {
  fullReductionApi,
  FullReductionActivity,
  FullReductionForm,
} from '@/services/marketing/full-reduction';
import { PermissionButton } from '@/components/PermissionButton';
import { MARKETING } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import dayjs from 'dayjs';

// 活动状态枚举
const statusEnums = {
  NOT_STARTED: { text: '未开始', status: 'Default' as const },
  RUNNING: { text: '进行中', status: 'Processing' as const },
  ENDED: { text: '已结束', status: 'Default' as const },
  DISABLED: { text: '已禁用', status: 'Error' as const },
};

// 适用范围枚举
const scopeTypeEnums: Record<string, { text: string; color: string }> = {
  ALL: { text: '全场通用', color: 'green' },
  CATEGORY: { text: '指定分类', color: 'blue' },
  PRODUCT: { text: '指定商品', color: 'orange' },
};

export default function FullReductionPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<FullReductionActivity | null>(null);
  const queryClient = useQueryClient();

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: FullReductionForm) => {
      if (editingId) {
        return fullReductionApi.update(editingId, data);
      }
      return fullReductionApi.create(data);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ['fullReductionList'] });
      actionRef.current?.reload();
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: fullReductionApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: fullReductionApi.toggleStatus,
    onSuccess: () => {
      message.success('状态更新成功');
      actionRef.current?.reload();
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个满减活动吗？',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleToggleStatus = (record: FullReductionActivity) => {
    const action = record.status === 'DISABLED' ? '启用' : '禁用';
    Modal.confirm({
      title: '确认操作',
      content: `确定要${action}「${record.name}」吗？`,
      onOk: () => toggleStatusMutation.mutate(record.id),
    });
  };

  const handleEdit = async (record: FullReductionActivity) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setModalOpen(true);
  };

  // 格式化满减规则显示
  const formatRules = (rules: { minAmount: number; reduceAmount: number }[]) => {
    if (!rules || rules.length === 0) return '-';
    return rules.map((rule, index) => (
      <Tag key={index} color="blue" style={{ marginBottom: 2 }}>
        满{rule.minAmount}减{rule.reduceAmount}
      </Tag>
    ));
  };

  const columns: ProColumns<FullReductionActivity>[] = [
    {
      title: '活动编码',
      dataIndex: 'code',
      width: 120,
      render: (text) => <code>{text}</code>,
    },
    {
      title: '活动名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '满减规则',
      dataIndex: 'rules',
      width: 200,
      hideInSearch: true,
      render: (_, record) => formatRules(record.rules),
    },
    {
      title: '适用范围',
      dataIndex: 'scopeType',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(scopeTypeEnums).map(([k, v]) => [k, { text: v.text }])
      ),
      render: (_, record) => (
        <Tag color={scopeTypeEnums[record.scopeType]?.color}>
          {scopeTypeEnums[record.scopeType]?.text}
        </Tag>
      ),
    },
    {
      title: '叠加',
      dataIndex: 'stackable',
      width: 80,
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.stackable ? 'green' : 'default'}>
          {record.stackable ? '可叠加' : '不可叠加'}
        </Tag>
      ),
    },
    {
      title: '活动时间',
      width: 200,
      hideInSearch: true,
      render: (_, record) => (
        <span style={{ fontSize: 12 }}>
          {dayjs(record.startTime).format('YYYY-MM-DD HH:mm')}
          <br />
          ~ {dayjs(record.endTime).format('YYYY-MM-DD HH:mm')}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: statusEnums,
      render: (_, record) => {
        const isDisabled = record.status === 'DISABLED';
        return (
          <Switch
            size="small"
            checked={!isDisabled}
            checkedChildren="启用"
            unCheckedChildren="禁用"
            onClick={() => handleToggleStatus(record)}
          />
        );
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      hideInSearch: true,
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
            permission={MARKETING.FULL_REDUCTION.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={MARKETING.FULL_REDUCTION.REMOVE}
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
        dateRange: [dayjs(editingRecord.startTime), dayjs(editingRecord.endTime)],
      };
    }
    return {
      stackable: false,
      exclusive: true,
      priority: 0,
      limitPerMember: 0,
      firstOrderOnly: false,
      scopeType: 'ALL',
      rules: [{ minAmount: 100, reduceAmount: 10 }],
    };
  };

  return (
    <>
      <ProTable
        headerTitle="满减活动管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1400 }}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          const result = await fullReductionApi.list({
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
            permission={MARKETING.FULL_REDUCTION.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增活动
          </PermissionButton>,
        ]}
      />

      <ModalForm<FullReductionForm>
        title={editingId ? '编辑满减活动' : '新增满减活动'}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditingId(null);
            setEditingRecord(null);
          }
        }}
        width={700}
        initialValues={getInitialValues()}
        onFinish={async (values: any) => {
          // 处理日期范围
          if (values.dateRange && values.dateRange.length === 2) {
            values.startTime = dayjs(values.dateRange[0]).format('YYYY-MM-DD HH:mm:ss');
            values.endTime = dayjs(values.dateRange[1]).format('YYYY-MM-DD HH:mm:ss');
          }
          delete values.dateRange;
          await saveMutation.mutateAsync(values as FullReductionForm);
          return true;
        }}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
      >
        <ProFormText
          name="code"
          label="活动编码"
          placeholder="请输入活动编码"
          rules={[{ required: true, message: '请输入活动编码' }]}
          disabled={!!editingId}
        />

        <ProFormText
          name="name"
          label="活动名称"
          placeholder="请输入活动名称"
          rules={[{ required: true, message: '请输入活动名称' }]}
        />

        <ProFormList
          name="rules"
          label="满减规则"
          creatorButtonProps={{
            creatorButtonText: '添加规则',
          }}
          min={1}
          copyIconProps={false}
          deleteIconProps={{
            Icon: MinusCircleOutlined,
            tooltipText: '删除此规则',
          }}
          itemRender={({ listDom, action }, { index }) => (
            <Card
              size="small"
              style={{ marginBottom: 8 }}
              title={`规则 ${index + 1}`}
              extra={action}
              bodyStyle={{ paddingBottom: 0 }}
            >
              {listDom}
            </Card>
          )}
        >
          <Space>
            <ProFormDigit
              name="minAmount"
              label="满"
              placeholder="满足金额"
              rules={[{ required: true, message: '请输入满足金额' }]}
              min={1}
              fieldProps={{ precision: 0, addonAfter: '元' }}
              width={150}
            />
            <ProFormDigit
              name="reduceAmount"
              label="减"
              placeholder="优惠金额"
              rules={[{ required: true, message: '请输入优惠金额' }]}
              min={1}
              fieldProps={{ precision: 0, addonAfter: '元' }}
              width={150}
            />
          </Space>
        </ProFormList>

        <ProFormDateTimeRangePicker
          name="dateRange"
          label="活动时间"
          rules={[{ required: true, message: '请选择活动时间' }]}
          placeholder={['开始时间', '结束时间']}
        />

        <ProFormSelect
          name="scopeType"
          label="适用范围"
          rules={[{ required: true, message: '请选择适用范围' }]}
          valueEnum={{
            ALL: '全场通用',
            CATEGORY: '指定分类',
            PRODUCT: '指定商品',
          }}
        />

        <ProFormSwitch
          name="stackable"
          label="可与优惠券叠加"
          tooltip="开启后，该满减活动可与优惠券同时使用"
        />

        <ProFormSwitch
          name="exclusive"
          label="与其他满减互斥"
          tooltip="开启后，该活动不能与其他满减活动同时享受"
        />

        <ProFormDigit
          name="priority"
          label="优先级"
          placeholder="数字越大优先级越高"
          min={0}
          fieldProps={{ precision: 0 }}
          tooltip="当多个活动同时生效时，优先级高的先计算"
        />

        <ProFormDigit
          name="limitPerMember"
          label="每人限参与次数"
          placeholder="0表示不限制"
          min={0}
          fieldProps={{ precision: 0 }}
        />

        <ProFormSwitch
          name="firstOrderOnly"
          label="仅限首单"
          tooltip="开启后，仅首次下单的用户可享受此活动"
        />

        <ProFormTextArea
          name="description"
          label="活动描述"
          placeholder="请输入活动描述"
        />
      </ModalForm>
    </>
  );
}
