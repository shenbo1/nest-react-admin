import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Switch, Image } from 'antd';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
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
  pointProductApi,
  PointProduct,
  PointProductForm,
} from '@/services/marketing/point-product';
import { couponTemplateApi } from '@/services/marketing/coupon-template';
import { PermissionButton } from '@/components/PermissionButton';
import { MARKETING } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import dayjs from 'dayjs';

// 商品类型枚举
const productTypeEnums: Record<string, { text: string; color: string }> = {
  PHYSICAL: { text: '实物商品', color: 'blue' },
  VIRTUAL: { text: '虚拟商品', color: 'purple' },
  COUPON: { text: '优惠券', color: 'orange' },
};

const statusEnums = {
  ENABLED: { text: '上架', status: 'Success' as const },
  DISABLED: { text: '下架', status: 'Default' as const },
};

export default function PointProductPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<PointProduct | null>(null);
  const queryClient = useQueryClient();

  // 获取优惠券模板列表（用于关联选择）
  const { data: couponTemplates } = useQuery({
    queryKey: ['couponTemplatesForSelect'],
    queryFn: () => couponTemplateApi.list({ pageSize: 100 }),
    select: (data) =>
      data.data
        .filter((item) => item.status === 'ENABLED')
        .map((item) => ({
          label: item.name,
          value: item.id,
        })),
  });

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: PointProductForm) => {
      if (editingId) {
        return pointProductApi.update(editingId, data);
      }
      return pointProductApi.create(data);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ['pointProductList'] });
      actionRef.current?.reload();
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: pointProductApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  // 切换状态
  const toggleStatusMutation = useMutation({
    mutationFn: pointProductApi.toggleStatus,
    onSuccess: () => {
      message.success('状态更新成功');
      actionRef.current?.reload();
    },
  });

  // 下架
  const offlineMutation = useMutation({
    mutationFn: pointProductApi.offline,
    onSuccess: () => {
      message.success('下架成功');
      actionRef.current?.reload();
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个积分商品吗？',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleToggleStatus = (record: PointProduct) => {
    Modal.confirm({
      title: '确认切换状态',
      content: `确定要${record.status === 'ENABLED' ? '下架' : '上架'}「${record.name}」吗？`,
      onOk: () => toggleStatusMutation.mutate(record.id),
    });
  };

  const handleOffline = (record: PointProduct) => {
    Modal.confirm({
      title: '确认下架',
      content: `确定要下架「${record.name}」吗？`,
      onOk: () => offlineMutation.mutate(record.id),
    });
  };

  const handleEdit = async (record: PointProduct) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    setModalOpen(true);
  };

  const columns: ProColumns<PointProduct>[] = [
    {
      title: '商品图片',
      dataIndex: 'image',
      width: 80,
      hideInSearch: true,
      render: (_, record) =>
        record.image ? (
          <Image src={record.image} width={50} height={50} style={{ objectFit: 'cover' }} />
        ) : (
          <span style={{ color: '#999' }}>-</span>
        ),
    },
    {
      title: '商品编码',
      dataIndex: 'code',
      width: 120,
      render: (text) => <code>{text}</code>,
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '商品类型',
      dataIndex: 'productType',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(productTypeEnums).map(([k, v]) => [k, { text: v.text }])
      ),
      render: (_, record) => (
        <Tag color={productTypeEnums[record.productType]?.color}>
          {productTypeEnums[record.productType]?.text}
        </Tag>
      ),
    },
    {
      title: '兑换积分',
      dataIndex: 'points',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <span>
          <Tag color="blue">{record.points}积分</Tag>
          {record.price && Number(record.price) > 0 && (
            <span style={{ marginLeft: 4 }}>+ ¥{Number(record.price).toFixed(2)}</span>
          )}
        </span>
      ),
    },
    {
      title: '库存/已兑',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <span>
          <Tag color={record.remainingStock > 0 ? 'green' : 'red'}>{record.remainingStock}</Tag>
          <span style={{ color: '#999' }}> / {record.exchangedCount}</span>
        </span>
      ),
    },
    {
      title: '限兑数量',
      dataIndex: 'limitCount',
      width: 100,
      hideInSearch: true,
      render: (_, record) =>
        record.limitCount === 0 ? (
          <Tag color="green">不限制</Tag>
        ) : (
          `${record.limitCount}件/人`
        ),
    },
    {
      title: '兑换时间',
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
          checkedChildren="上架"
          unCheckedChildren="下架"
          onClick={() => handleToggleStatus(record)}
        />
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <PermissionButton
            permission={MARKETING.POINT_PRODUCT.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          {record.status === 'ENABLED' && (
            <PermissionButton
              permission={MARKETING.POINT_PRODUCT.OFFLINE}
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleOffline(record)}
            >
              下架
            </PermissionButton>
          )}
          <PermissionButton
            permission={MARKETING.POINT_PRODUCT.REMOVE}
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
      stock: 0,
      limitCount: 0,
      sort: 0,
    };
  };

  return (
    <>
      <ProTable
        headerTitle="积分商品管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1400 }}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          const result = await pointProductApi.list({
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
            permission={MARKETING.POINT_PRODUCT.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增商品
          </PermissionButton>,
        ]}
      />

      <ModalForm<PointProductForm>
        title={editingId ? '编辑积分商品' : '新增积分商品'}
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
          await saveMutation.mutateAsync(values as PointProductForm);
          return true;
        }}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
      >
        <ProFormText
          name="code"
          label="商品编码"
          placeholder="请输入商品编码"
          rules={[{ required: true, message: '请输入商品编码' }]}
          disabled={!!editingId}
        />

        <ProFormText
          name="name"
          label="商品名称"
          placeholder="请输入商品名称"
          rules={[{ required: true, message: '请输入商品名称' }]}
        />

        <ProFormText
          name="image"
          label="商品图片"
          placeholder="请输入商品图片URL"
        />

        <ProFormSelect
          name="productType"
          label="商品类型"
          rules={[{ required: true, message: '请选择商品类型' }]}
          valueEnum={{
            PHYSICAL: '实物商品',
            VIRTUAL: '虚拟商品',
            COUPON: '优惠券',
          }}
        />

        <ProFormDependency name={['productType']}>
          {({ productType }) => {
            switch (productType) {
              case 'PHYSICAL':
                return (
                  <ProFormDigit
                    name="relatedProductId"
                    label="关联商品ID"
                    placeholder="请输入关联的商品ID（可选）"
                    tooltip="关联商城中的实物商品ID，可选填"
                  />
                );
              case 'VIRTUAL':
                return (
                  <ProFormTextArea
                    name="virtualContent"
                    label="虚拟商品内容"
                    placeholder="请输入虚拟商品内容，如卡密、兑换码等"
                    rules={[{ required: true, message: '请输入虚拟商品内容' }]}
                  />
                );
              case 'COUPON':
                return (
                  <ProFormSelect
                    name="relatedCouponId"
                    label="关联优惠券模板"
                    placeholder="请选择关联的优惠券模板"
                    rules={[{ required: true, message: '请选择优惠券模板' }]}
                    options={couponTemplates || []}
                  />
                );
              default:
                return null;
            }
          }}
        </ProFormDependency>

        <ProFormDigit
          name="points"
          label="兑换积分"
          placeholder="请输入兑换所需积分"
          rules={[{ required: true, message: '请输入兑换积分' }]}
          min={1}
          fieldProps={{ precision: 0 }}
        />

        <ProFormDigit
          name="price"
          label="兑换金额"
          placeholder="积分+金额模式下的金额，0或不填表示纯积分兑换"
          min={0}
          fieldProps={{ precision: 2, addonAfter: '元' }}
          tooltip="如需积分+金额模式，请填写金额；纯积分兑换则填0或留空"
        />

        <ProFormDigit
          name="stock"
          label="库存数量"
          placeholder="请输入库存数量"
          rules={[{ required: true, message: '请输入库存数量' }]}
          min={0}
          fieldProps={{ precision: 0 }}
        />

        <ProFormDigit
          name="limitCount"
          label="每人限兑"
          placeholder="0表示不限制"
          min={0}
          fieldProps={{ precision: 0 }}
        />

        <ProFormDigit
          name="sort"
          label="排序"
          placeholder="数字越小越靠前"
          min={0}
          fieldProps={{ precision: 0 }}
        />

        <ProFormDateTimeRangePicker
          name="dateRange"
          label="兑换时间"
          placeholder={['开始时间', '结束时间']}
          tooltip="商品的兑换时间范围，不填则长期有效"
        />

        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入商品描述"
        />
      </ModalForm>
    </>
  );
}
