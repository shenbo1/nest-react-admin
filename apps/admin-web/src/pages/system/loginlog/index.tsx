import { useRef } from 'react';
import { ProColumns } from '@ant-design/pro-components';
import ProTable, { ProTableRef } from '@/components/ProTable';
import dayjs from 'dayjs';
import request from '@/utils/request';

interface LoginLog {
  id: number;
  username?: string;
  ipaddr?: string;
  location?: string;
  browser?: string;
  os?: string;
  status: string;
  msg?: string;
  loginTime: string;
}

const LoginLogList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);

  // 删除日志
  const deleteMutation = {
    mutate: async (ids: string) => {
      await request.delete('/log/loginlog', { params: { ids } });
    },
  };

  // 批量删除
  const handleBatchDelete = async (selectedRows: LoginLog[]) => {
    const ids = selectedRows.map((row) => row.id).join(',');
    await deleteMutation.mutate(ids);
  };

  // 状态文本
  const getStatusText = (status: string) => {
    return status === '0' ? '成功' : '失败';
  };

  const columns: ProColumns<LoginLog>[] = [
    {
      title: '日志编号',
      dataIndex: 'id',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '用户名称',
      dataIndex: 'username',
      width: 120,
    },
    {
      title: '登录地址',
      dataIndex: 'ipaddr',
      width: 130,
      hideInSearch: true,
    },
    {
      title: '登录地点',
      dataIndex: 'location',
      width: 150,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '浏览器',
      dataIndex: 'browser',
      width: 120,
      hideInSearch: true,
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      width: 120,
      hideInSearch: true,
    },
    {
      title: '登录状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        '0': { text: '成功', status: 'Success' },
        '1': { text: '失败', status: 'Error' },
      },
      render: (_, record) => getStatusText(record.status),
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      width: 160,
      valueType: 'dateTime',
      render: (_, record) => dayjs(record.loginTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: () => [],
    },
  ];

  return (
    <ProTable
      ref={tableRef}
      api="/log/loginlog"
      columns={columns}
      rowKey="id"
      scroll={{ x: 1200 }}
      search={{
        labelWidth: 'auto',
      }}
      pagination={{
        showSizeChanger: true,
        showTotal: (total: number) => `共 ${total} 条`,
      }}
      rowSelection={{
        onChange: (_: any, selectedRows: any[]) => {
          if (selectedRows.length > 0) {
            handleBatchDelete(selectedRows);
          }
        },
      }}
    />
  );
};

export default LoginLogList;
