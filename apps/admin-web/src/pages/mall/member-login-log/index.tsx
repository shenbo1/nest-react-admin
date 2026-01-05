import { useRef, useState } from 'react';
import { message, Modal, Space, Tag, Avatar, Popconfirm } from 'antd';
import {
  DeleteOutlined,
  ClearOutlined,
  UserOutlined,
  DesktopOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { ProColumns } from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  memberLoginLogApi,
  MemberLoginLog,
} from '@/services/mall/member-login-log';
import { memberApi } from '@/services/mall/member';
import { PermissionButton } from '@/components/PermissionButton';
import { MEMBER } from '@/constants/permissions';
import ProTable, { ProTableRef } from '@/components/ProTable';
import dayjs from 'dayjs';

export default function MemberLoginLogPage() {
  const actionRef = useRef<ProTableRef>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  // 获取会员列表用于选择
  const { data: memberOptions = [] } = useQuery({
    queryKey: ['memberOptionsForLoginLog'],
    queryFn: async () => {
      const res = await memberApi.list({ pageSize: 1000 });
      return res.data.map((m) => ({
        label: m.nickname || m.username,
        value: m.id,
      }));
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: memberLoginLogApi.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  // 批量删除
  const batchDeleteMutation = useMutation({
    mutationFn: memberLoginLogApi.batchDelete,
    onSuccess: () => {
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    },
  });

  // 清空
  const clearMutation = useMutation({
    mutationFn: memberLoginLogApi.clear,
    onSuccess: () => {
      message.success('清空成功');
      actionRef.current?.reload();
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条登录日志吗？',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的记录');
      return;
    }
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      okType: 'danger',
      onOk: () => batchDeleteMutation.mutate(selectedRowKeys),
    });
  };

  const handleClear = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有登录日志吗？此操作不可恢复！',
      okType: 'danger',
      onOk: () => clearMutation.mutate(),
    });
  };

  const columns: ProColumns<MemberLoginLog>[] = [
    {
      title: '会员',
      dataIndex: 'memberId',
      width: 180,
      valueType: 'select',
      fieldProps: {
        options: memberOptions,
        showSearch: true,
        placeholder: '请选择会员',
      },
      render: (_, record) => (
        <Space>
          <Avatar
            size="small"
            src={record.member?.avatar}
            icon={<UserOutlined />}
          />
          <span>{record.member?.nickname || record.member?.username || '-'}</span>
        </Space>
      ),
    },
    {
      title: '登录IP',
      dataIndex: 'ipaddr',
      width: 140,
      render: (_, record) => (
        <Space>
          <GlobalOutlined style={{ color: '#1890ff' }} />
          <span>{record.ipaddr || '-'}</span>
        </Space>
      ),
    },
    {
      title: '登录地点',
      dataIndex: 'loginLocation',
      width: 150,
      hideInSearch: true,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '浏览器',
      dataIndex: 'browser',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          <DesktopOutlined />
          <span>{record.browser || '-'}</span>
        </Space>
      ),
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      width: 120,
      hideInSearch: true,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      valueType: 'select',
      valueEnum: {
        '0': { text: '成功', status: 'Success' },
        '1': { text: '失败', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={record.status === '0' ? 'success' : 'error'}>
          {record.status === '0' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '提示信息',
      dataIndex: 'msg',
      width: 150,
      hideInSearch: true,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      width: 170,
      valueType: 'dateTimeRange',
      search: {
        transform: (value) => ({
          startTime: value?.[0],
          endTime: value?.[1],
        }),
      },
      render: (_, record) =>
        record.loginTime
          ? dayjs(record.loginTime).format('YYYY-MM-DD HH:mm:ss')
          : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm
          title="确定删除吗？"
          onConfirm={() => deleteMutation.mutate(record.id)}
        >
          <PermissionButton
            permission={MEMBER.LOGIN_LOG.REMOVE}
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
          >
            删除
          </PermissionButton>
        </Popconfirm>
      ),
    },
  ];

  return (
    <ProTable
      headerTitle="会员登录日志"
      actionRef={actionRef}
      columns={columns}
      rowKey="id"
      scroll={{ x: 1300 }}
      api="/mall/member-login-log"
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys as number[]),
      }}
      toolBarRender={() => [
        <PermissionButton
          key="batchDelete"
          permission={MEMBER.LOGIN_LOG.REMOVE}
          danger
          icon={<DeleteOutlined />}
          onClick={handleBatchDelete}
          disabled={selectedRowKeys.length === 0}
        >
          批量删除
        </PermissionButton>,
        <PermissionButton
          key="clear"
          permission={MEMBER.LOGIN_LOG.REMOVE}
          danger
          icon={<ClearOutlined />}
          onClick={handleClear}
        >
          清空日志
        </PermissionButton>,
      ]}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
    />
  );
}
