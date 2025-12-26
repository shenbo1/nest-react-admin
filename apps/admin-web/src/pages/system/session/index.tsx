import { useState } from 'react';
import {
  Card,
  Table,
  Space,
  Tag,
  message,
  Alert,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  ReloadOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/utils/request';
import PermissionButton from '@/components/PermissionButton';
import { SYSTEM } from '@/constants/permissions';

interface OnlineUser {
  userId: number;
  username: string;
  nickname: string;
  deptName: string;
  loginTime: string;
  ip: string;
  device: string;
  sessionCount: number;
}

const SessionList: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const queryClient = useQueryClient();

  // 获取在线用户列表
  const {
    data: onlineData,
    isLoading,
    refetch,
  } = useQuery<{ count: number; users: OnlineUser[] }>({
    queryKey: ['onlineUsers'],
    queryFn: async () => {
      const data = await request.get('/system/session/online');
      return data;
    },
  });

  // 获取统计数据
  const { data: statsData } = useQuery<{
    onlineCount: number;
    blacklistCount: number;
  }>({
    queryKey: ['sessionStats'],
    queryFn: async () => {
      const data = await request.get('/system/session/count');
      return data;
    },
  });

  // 踢出单个用户
  const kickMutation = useMutation({
    mutationFn: async (userId: number) => {
      await request.post(`/system/session/${userId}/kick`);
    },
    onSuccess: () => {
      message.success('用户已被踢出');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['sessionStats'] });
      setSelectedRowKeys([]);
    },
  });

  // 批量踢出用户
  const kickBatchMutation = useMutation({
    mutationFn: async (userIds: number[]) => {
      await request.post('/system/session/kick-batch', { userIds });
    },
    onSuccess: () => {
      message.success('批量踢出成功');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['sessionStats'] });
      setSelectedRowKeys([]);
    },
  });

  const handleKick = (userId: number) => {
    kickMutation.mutate(userId);
  };

  const handleBatchKick = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要踢出的用户');
      return;
    }
    kickBatchMutation.mutate(selectedRowKeys);
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
    },
    {
      title: '部门',
      dataIndex: 'deptName',
      key: 'deptName',
      width: 150,
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 180,
      render: (time: string) => {
        if (!time) return '-';
        return new Date(time).toLocaleString('zh-CN');
      },
    },
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
    },
    {
      title: '设备',
      dataIndex: 'device',
      key: 'device',
      width: 150,
    },
    {
      title: '会话数',
      dataIndex: 'sessionCount',
      key: 'sessionCount',
      width: 80,
      render: (count: number) => (
        <Tag color={count > 1 ? 'orange' : 'green'}>{count} 个</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: OnlineUser) => (
        <Space>
          <PermissionButton
            permission={SYSTEM.SESSION.KICK}
            type="link"
            danger
            size="small"
            icon={<LogoutOutlined />}
            onClick={() => handleKick(record.userId)}
            loading={kickMutation.isPending}
          >
            踢出
          </PermissionButton>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys.map((k) => Number(k)));
    },
  };

  return (
    <div>
      <Alert
        message="在线用户管理"
        description="查看当前在线用户列表，可将用户踢出系统。被踢出的用户将立即失效，需要重新登录。"
        type="info"
        showIcon
        icon={<TeamOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="当前在线用户"
              value={statsData?.onlineCount || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已踢出会话"
              value={statsData?.blacklistCount || 0}
              prefix={<LogoutOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="会话总数"
              value={
                onlineData?.users.reduce((acc, u) => acc + u.sessionCount, 0) ||
                0
              }
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="在线用户列表"
        extra={
          <Space>
            <PermissionButton
              permission={SYSTEM.SESSION.QUERY}
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
            >
              刷新
            </PermissionButton>
            <PermissionButton
              permission={SYSTEM.SESSION.KICK}
              danger
              icon={<LogoutOutlined />}
              onClick={handleBatchKick}
              loading={kickBatchMutation.isPending}
              disabled={selectedRowKeys.length === 0}
            >
              批量踢出 ({selectedRowKeys.length})
            </PermissionButton>
          </Space>
        }
      >
        <Table
          dataSource={onlineData?.users || []}
          columns={columns}
          rowKey="userId"
          loading={isLoading}
          rowSelection={rowSelection}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个用户`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default SessionList;
