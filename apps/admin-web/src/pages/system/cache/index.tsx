import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Popconfirm,
  message,
  Alert,
  Descriptions,
  Spin,
} from 'antd';
import {
  ReloadOutlined,
  DeleteOutlined,
  SearchOutlined,
  WarningOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/utils/request';
import PermissionButton from '@/components/PermissionButton';
import { SYSTEM } from '@/constants/permissions';

interface CacheInfo {
  version: string;
  mode: string;
  os: string;
  architecture: string;
  tcpPort: string;
  uptime: string;
  memory: string;
  connectedClients: number;
  dbSize: number;
}

interface CacheKey {
  key: string;
  type: string;
  value: string;
  ttl: string;
  size: string;
}

const CacheList: React.FC = () => {
  const [searchKey, setSearchKey] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const queryClient = useQueryClient();

  // 检查缓存键是否受保护
  const isProtectedKey = (key: string): boolean => {
    if (!protectedPrefixes || protectedPrefixes.length === 0) return false;
    return protectedPrefixes.some(prefix => key.startsWith(prefix));
  };

  // 获取缓存信息
  const {
    data: cacheInfo,
    isLoading: infoLoading,
    refetch: refetchInfo,
  } = useQuery<CacheInfo>({
    queryKey: ['cacheInfo'],
    queryFn: async () => {
      const data = await request.get('/system/cache/info');
      return data;
    },
  });

  // 获取受保护的缓存键前缀
  const { data: protectedPrefixes } = useQuery<string[]>({
    queryKey: ['protectedPrefixes'],
    queryFn: async () => {
      try {
        const data = await request.get('/system/cache/protected-prefixes');
        return data;
      } catch (error) {
        console.error('获取受保护键前缀失败:', error);
        return [];
      }
    },
  });

  // 获取缓存键列表
  const {
    data: keys,
    isLoading: keysLoading,
    refetch: refetchKeys,
  } = useQuery<string[]>({
    queryKey: ['cacheKeys', searchKey],
    queryFn: async () => {
      const data = await request.get('/system/cache/keys', {
        params: { pattern: searchKey || '*' },
      });
      return data;
    },
  });

  // 获取选中键的详细信息
  const { data: keyDetails, isLoading: detailsLoading } = useQuery<CacheKey>({
    queryKey: ['cacheKeyInfo', selectedKeys[0]],
    queryFn: async () => {
      if (!selectedKeys[0]) return null;
      console.log('获取键详情:', selectedKeys[0]);
      const data = await request.get('/system/cache/key-info', {
        params: { key: selectedKeys[0] as string },
      });
      console.log('键详情数据:', data);
      return data;
    },
    enabled: !!selectedKeys[0],
  });

  // 删除缓存键
  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const { data } = await request.delete('/system/cache/key', { params: { key } });
      return data;
    },
    onSuccess: (data) => {
      message.success(data?.message || '删除成功');
      refetchKeys();
      setSelectedKeys([]);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '删除失败');
    },
  });

  // 清空所有缓存
  const flushMutation = useMutation({
    mutationFn: async () => {
      const { data } = await request.delete('/system/cache/flush');
      return data;
    },
    onSuccess: (data) => {
      message.success(data?.message || '缓存已清空');
      refetchInfo();
      refetchKeys();
      setSelectedKeys([]);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '清空缓存失败');
    },
  });

  const handleRefresh = () => {
    refetchInfo();
    refetchKeys();
  };

  const handleDelete = (key: string) => {
    deleteMutation.mutate(key);
  };

  const handleFlush = () => {
    flushMutation.mutate();
  };

  const columns = [
    {
      title: '缓存键',
      dataIndex: 'key',
      key: 'key',
      ellipsis: true,
      render: (text: string) => (
        <span style={{ color: isProtectedKey(text) ? '#ff4d4f' : undefined }}>
          {text}
          {isProtectedKey(text) && (
            <Tag color="error" style={{ marginLeft: 8 }}>
              受保护
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: { key: string }) => (
        <Space>
          <PermissionButton
            permission={SYSTEM.CACHE.REMOVE}
            type="link"
            danger
            size="small"
            onClick={() => handleDelete(record.key)}
            disabled={isProtectedKey(record.key)}
            title={isProtectedKey(record.key) ? '该缓存键受保护，不能删除' : '删除缓存键'}
          >
            删除
          </PermissionButton>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Alert
        title="缓存管理"
        description="管理 Redis 缓存数据，请谨慎操作，清空缓存可能会影响系统性能。"
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Redis 版本"
              value={cacheInfo?.version || '-'}
              prefix={<CloudServerOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已使用内存" value={cacheInfo?.memory || '-'} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线客户端"
              value={cacheInfo?.connectedClients || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="数据库键数量" value={cacheInfo?.dbSize || 0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="运行模式" value={cacheInfo?.mode || '-'} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="运行时间" value={cacheInfo?.uptime || '-'} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="操作系统" value={cacheInfo?.os || '-'} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="TCP 端口" value={cacheInfo?.tcpPort || '-'} />
          </Card>
        </Col>
      </Row>

      <Card
        title="缓存键列表"
        extra={
          <Space>
            <Input
              placeholder="搜索键名"
              prefix={<SearchOutlined />}
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <PermissionButton
              permission={SYSTEM.CACHE.QUERY}
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </PermissionButton>
            <PermissionButton
              permission={SYSTEM.CACHE.REMOVE}
              danger
              icon={<DeleteOutlined />}
              onClick={handleFlush}
              loading={flushMutation.isPending}
            >
              清空所有
            </PermissionButton>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={14}>
            <Table
              dataSource={(keys || []).map((key) => ({ key }))}
              columns={columns}
              rowKey="key"
              size="small"
              loading={keysLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个键`,
              }}
              rowSelection={{
                selectedRowKeys: selectedKeys,
                onChange: (keys) => {
                  console.log('选中键变化:', keys);
                  setSelectedKeys(keys);
                },
              }}
              scroll={{ x: 500 }}
            />
          </Col>
          <Col span={10}>
            <Card title="键详情" size="small">
              {selectedKeys.length === 0 ? (
                <div
                  style={{ textAlign: 'center', color: '#999', padding: 20 }}
                >
                  请选择一个缓存键查看详情
                </div>
              ) : detailsLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Spin />
                </div>
              ) : keyDetails ? (
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="键名">
                    {keyDetails.key}
                  </Descriptions.Item>
                  <Descriptions.Item label="类型">
                    <Tag color="blue">{keyDetails.type}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="过期时间">
                    {keyDetails.ttl}
                  </Descriptions.Item>
                  <Descriptions.Item label="大小">
                    {keyDetails.size}
                  </Descriptions.Item>
                  <Descriptions.Item label="值" span={3}>
                    <pre
                      style={{ maxHeight: 300, overflow: 'auto', margin: 0 }}
                    >
                      {typeof keyDetails.value === 'object'
                        ? JSON.stringify(keyDetails.value, null, 2)
                        : keyDetails.value?.toString()}
                    </pre>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <div
                  style={{ textAlign: 'center', color: '#999', padding: 20 }}
                >
                  无法获取键详情
                </div>
              )}
            </Card>
            {selectedKeys.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Popconfirm
                  title="确定删除该缓存键？"
                  onConfirm={() => handleDelete(selectedKeys[0] as string)}
                >
                  <Button danger block loading={deleteMutation.isPending}>
                    删除选中的缓存键
                  </Button>
                </Popconfirm>
              </div>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CacheList;
