import { useRef, useState } from 'react';
import { message, Modal, Space, Tag } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { orderApi, Order, OrderForm } from '@/services/mall/order';
import { PermissionButton } from '@/components/PermissionButton';
import { MALL } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';

export default function OrderPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Order | null>(null);

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: OrderForm) => {
      if (editingRecord) {
        return orderApi.update(editingRecord.id, data);
      }
      return orderApi.create(data);
    },
    onSuccess: () => {
      message.success(editingRecord ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingRecord(null);
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '操作失败');
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: orderApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '删除失败');
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleEdit = (record: Order) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const getOrderStatus = (status: number) => {
    const statusMap: Record<number, { text: string; color: string }> = {
      0: { text: '待付款', color: 'orange' },
      1: { text: '已付款', color: 'green' },
      2: { text: '已发货', color: 'blue' },
      3: { text: '已送达', color: 'purple' },
      4: { text: '已完成', color: 'success' },
      5: { text: '已取消', color: 'error' },
      6: { text: '退款中', color: 'warning' },
      7: { text: '已退款', color: 'default' },
    };
    return statusMap[status] || { text: '未知', color: 'default' };
  };

  const getPayStatus = (status: number) => {
    const statusMap: Record<number, { text: string; color: string }> = {
      0: { text: '未支付', color: 'orange' },
      1: { text: '已支付', color: 'green' },
      2: { text: '退款中', color: 'warning' },
      3: { text: '已退款', color: 'default' },
    };
    return statusMap[status] || { text: '未知', color: 'default' };
  };

  const columns: ProColumns<Order>[] = [
    {
      title: '订单信息',
      dataIndex: 'orderNo',
      width: 220,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            <ShoppingCartOutlined style={{ marginRight: 4 }} />
            {record.orderNo}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.receiver || '-'} | {record.phone || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '会员',
      dataIndex: ['member', 'username'],
      width: 120,
      render: (text) => text || '-',
      search: false,
    },
    {
      title: '订单金额',
      dataIndex: 'actualAmount',
      width: 120,
      align: 'center',
      render: (_, record: any) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
            ¥{(Number(record.actualAmount) || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            运费: ¥{(Number(record.freight) || 0).toFixed(2)}
          </div>
        </div>
      ),
      search: false,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      width: 120,
      render: (status: any) => {
        const statusInfo = getOrderStatus(status);
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '支付状态',
      dataIndex: 'payStatus',
      width: 100,
      render: (status: any) => {
        const statusInfo = getPayStatus(status);
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '发货状态',
      dataIndex: 'shippingStatus',
      width: 100,
      search: false,
      render: (status: any) => {
        const statusMap = ['未发货', '已发货', '已送达'];
        return <Tag color={status === 1 ? 'blue' : status === 2 ? 'purple' : 'default'}>
          {statusMap[status as number] || '未知'}
        </Tag>;
      },
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
            permission={MALL.ORDER.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={MALL.ORDER.REMOVE}
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
        headerTitle="订单管理"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1400 }}
        api="/mall/order"
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={MALL.ORDER.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增订单
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ModalForm<OrderForm>
        title={editingRecord ? '编辑订单管理' : '新增订单管理'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={editingRecord || {}}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
        }}
      >
        <ProFormText
          name="name"
          label="名称"
          placeholder="请输入名称"
          rules={[{ required: true, message: '请输入名称' }]}
        />
        <ProFormText
          name="code"
          label="编码"
          placeholder="请输入编码"
        />
        <ProFormDigit
          name="sort"
          label="排序"
          placeholder="请输入排序号"
          min={0}
          fieldProps={{ precision: 0 }}
        />
        <ProFormTextArea
          name="content"
          label="内容"
          placeholder="请输入内容"
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注"
        />
      </ModalForm>
    </>
  );
}
