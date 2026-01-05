import { useRef, useState } from 'react';
import { Space, Popconfirm, Tag, message, Switch } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormDateTimeRangePicker,
  ProFormDigit,
} from '@ant-design/pro-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import ProTable, { ProTableRef } from '@/components/ProTable';
import type { ProColumns } from '@ant-design/pro-components';
import PermissionButton from '@/components/PermissionButton';
import { MARKETING } from '@/constants/permissions';
import {
  promotionApi,
  Promotion,
  PromotionForm,
  PromotionType,
  PromotionStatus,
} from '@/services/marketing/promotion';

// 促销类型选项
const promotionTypeOptions = [
  { label: '限时秒杀', value: 'FLASH_SALE' },
  { label: '限时折扣', value: 'TIME_DISCOUNT' },
  { label: '拼团活动', value: 'GROUP_BUY' },
];

// 状态选项（保留用于未来扩展）
// const statusOptions = [
//   { label: '未开始', value: 'NOT_STARTED' },
//   { label: '进行中', value: 'RUNNING' },
//   { label: '已结束', value: 'ENDED' },
//   { label: '已禁用', value: 'DISABLED' },
// ];

// 状态颜色映射
const statusColorMap: Record<PromotionStatus, string> = {
  NOT_STARTED: 'default',
  RUNNING: 'processing',
  ENDED: 'default',
  DISABLED: 'error',
};

// 类型颜色映射
const typeColorMap: Record<PromotionType, string> = {
  FLASH_SALE: 'volcano',
  TIME_DISCOUNT: 'blue',
  GROUP_BUY: 'green',
};

// 类型中文映射
const typeLabelMap: Record<PromotionType, string> = {
  FLASH_SALE: '限时秒杀',
  TIME_DISCOUNT: '限时折扣',
  GROUP_BUY: '拼团活动',
};

// 状态中文映射
const statusLabelMap: Record<PromotionStatus, string> = {
  NOT_STARTED: '未开始',
  RUNNING: '进行中',
  ENDED: '已结束',
  DISABLED: '已禁用',
};

const PromotionList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<Promotion | null>(null);
  const queryClient = useQueryClient();

  // 保存
  const saveMutation = useMutation({
    mutationFn: (values: PromotionForm) => {
      if (editingId) {
        return promotionApi.update(editingId, values);
      }
      return promotionApi.create(values);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      tableRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: promotionApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      tableRef.current?.reload();
    },
  });

  // 切换状态
  const toggleMutation = useMutation({
    mutationFn: promotionApi.toggleStatus,
    onSuccess: () => {
      message.success('状态切换成功');
      tableRef.current?.reload();
    },
  });

  // 结束活动
  const endMutation = useMutation({
    mutationFn: promotionApi.endPromotion,
    onSuccess: () => {
      message.success('活动已结束');
      tableRef.current?.reload();
    },
  });

  // 新增
  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setModalOpen(true);
  };

  // 编辑
  const handleEdit = (record: Promotion) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  // 表格列
  const columns: ProColumns<Promotion>[] = [
    {
      title: '活动名称',
      dataIndex: 'name',
      width: 180,
      fixed: 'left',
    },
    {
      title: '活动编码',
      dataIndex: 'code',
      width: 120,
    },
    {
      title: '活动类型',
      dataIndex: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: {
        FLASH_SALE: { text: '限时秒杀' },
        TIME_DISCOUNT: { text: '限时折扣' },
        GROUP_BUY: { text: '拼团活动' },
      },
      render: (_: any, record: Promotion) => (
        <Tag color={typeColorMap[record.type]}>{typeLabelMap[record.type]}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        NOT_STARTED: { text: '未开始', status: 'Default' },
        RUNNING: { text: '进行中', status: 'Processing' },
        ENDED: { text: '已结束', status: 'Default' },
        DISABLED: { text: '已禁用', status: 'Error' },
      },
      render: (_: any, record: Promotion) => (
        <Tag color={statusColorMap[record.status]}>
          {statusLabelMap[record.status]}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '商品数',
      dataIndex: ['_count', 'products'],
      width: 80,
      hideInSearch: true,
      render: (_: any, record: Promotion) => record._count?.products || 0,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_: any, record: Promotion) => dayjs(record.startTime).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_: any, record: Promotion) => dayjs(record.endTime).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '启用状态',
      dataIndex: 'statusSwitch',
      width: 100,
      hideInSearch: true,
      render: (_: any, record: Promotion) => (
        <Switch
          checked={record.status !== 'DISABLED'}
          disabled={record.status === 'ENDED'}
          onChange={() => toggleMutation.mutate(record.id)}
          loading={toggleMutation.isPending}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
      render: (_: any, record: Promotion) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_: any, record: Promotion) => (
        <Space size={0} split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            type="link"
            size="small"
            permission={MARKETING.PROMOTION.EDIT}
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.status === 'ENDED'}
            fallbackMode="disabled"
          >
            编辑
          </PermissionButton>
          {record.status === 'RUNNING' && (
            <Popconfirm
              title="确定结束该活动吗？"
              onConfirm={() => endMutation.mutate(record.id)}
            >
              <PermissionButton
                type="link"
                size="small"
                permission={MARKETING.PROMOTION.EDIT}
                icon={<StopOutlined />}
                fallbackMode="disabled"
              >
                结束
              </PermissionButton>
            </Popconfirm>
          )}
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <PermissionButton
              type="link"
              size="small"
              danger
              permission={MARKETING.PROMOTION.REMOVE}
              icon={<DeleteOutlined />}
              disabled={record.status === 'RUNNING'}
              fallbackMode="disabled"
            >
              删除
            </PermissionButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 获取数据
  const fetchData = async (params: any) => {
    const { current, pageSize, ...rest } = params;
    const result = await promotionApi.list({
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

  // 表单初始值
  const getInitialValues = () => {
    if (editingRecord) {
      return {
        ...editingRecord,
        timeRange: [
          dayjs(editingRecord.startTime),
          dayjs(editingRecord.endTime),
        ],
      };
    }
    return {
      status: 'NOT_STARTED',
      priority: 0,
    };
  };

  return (
    <>
      <ProTable
        ref={tableRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1500 }}
        request={fetchData}
        search={{ labelWidth: 'auto' }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MARKETING.PROMOTION.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增活动
          </PermissionButton>,
        ]}
      />

      <ModalForm<PromotionForm & { timeRange: [dayjs.Dayjs, dayjs.Dayjs] }>
        title={editingId ? '编辑促销活动' : '新增促销活动'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        width={600}
        initialValues={getInitialValues()}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          const { timeRange, ...rest } = values;
          const submitData: PromotionForm = {
            ...rest,
            startTime: timeRange[0].toISOString(),
            endTime: timeRange[1].toISOString(),
          };
          await saveMutation.mutateAsync(submitData);
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="活动名称"
          placeholder="请输入活动名称"
          rules={[{ required: true, message: '请输入活动名称' }]}
        />
        <ProFormText
          name="code"
          label="活动编码"
          placeholder="请输入活动编码"
          rules={[{ required: true, message: '请输入活动编码' }]}
          disabled={!!editingId}
        />
        <ProFormSelect
          name="type"
          label="活动类型"
          placeholder="请选择活动类型"
          options={promotionTypeOptions}
          rules={[{ required: true, message: '请选择活动类型' }]}
          disabled={!!editingId}
        />
        <ProFormDateTimeRangePicker
          name="timeRange"
          label="活动时间"
          rules={[{ required: true, message: '请选择活动时间' }]}
          fieldProps={{
            showTime: { format: 'HH:mm' },
            format: 'YYYY-MM-DD HH:mm',
          }}
        />
        <ProFormDigit
          name="priority"
          label="优先级"
          placeholder="数值越大优先级越高"
          min={0}
          max={999}
          fieldProps={{ precision: 0 }}
        />
        <ProFormTextArea
          name="description"
          label="活动描述"
          placeholder="请输入活动描述"
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>
    </>
  );
};

export default PromotionList;
