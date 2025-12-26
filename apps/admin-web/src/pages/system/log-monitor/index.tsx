import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Tabs,
  Alert,
} from 'antd';
import {
  ReloadOutlined,
  FileTextOutlined,
  LoginOutlined,
  GlobalOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import request from '@/utils/request';

interface LogStats {
  loginLog: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  operLog: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

interface LogTrend {
  date: string;
  count: number;
}

interface DistributionItem {
  status?: string;
  statusCode?: string;
  type?: string;
  typeCode?: number;
  location?: string;
  browser?: string;
  os?: string;
  username?: string;
  count: number;
}

interface ErrorLog {
  id: number;
  title?: string;
  operName?: string;
  username?: string;
  ipaddr?: string;
  location?: string;
  errorMsg?: string;
  msg?: string;
  operTime?: string;
  loginTime?: string;
}

const LogMonitor: React.FC = () => {
  const [activeTab, setActiveTab] = useState('trend');

  // 获取日志统计
  const { data: stats, refetch: refetchStats } = useQuery<LogStats>({
    queryKey: ['logStats'],
    queryFn: async () => {
      const data = await request.get('/monitor/log/overview');
      return data;
    },
  });

  // 获取登录趋势
  const { data: loginTrend } = useQuery<LogTrend[]>({
    queryKey: ['loginTrend'],
    queryFn: async () => {
      const data = await request.get('/monitor/log/login-trend');
      return data;
    },
  });

  // 获取操作趋势
  const { data: operTrend } = useQuery<LogTrend[]>({
    queryKey: ['operTrend'],
    queryFn: async () => {
      const data = await request.get('/monitor/log/oper-trend');
      return data;
    },
  });

  // 获取登录状态分布
  const { data: loginStatusDist } = useQuery<DistributionItem[]>({
    queryKey: ['loginStatusDistribution'],
    queryFn: async () => {
      const data = await request.get('/monitor/log/login-status-distribution');
      return data;
    },
  });

  // 获取操作类型分布
  const { data: operTypeDist } = useQuery<DistributionItem[]>({
    queryKey: ['operTypeDistribution'],
    queryFn: async () => {
      const data = await request.get('/monitor/log/oper-type-distribution');
      return data;
    },
  });

  // 获取登录地点分布
  const { data: locationDist } = useQuery<DistributionItem[]>({
    queryKey: ['loginLocationDistribution'],
    queryFn: async () => {
      const data = await request.get('/monitor/log/login-location-distribution');
      return data;
    },
  });

  // 获取浏览器分布
  const { data: browserDist } = useQuery<DistributionItem[]>({
    queryKey: ['browserDistribution'],
    queryFn: async () => {
      const data = await request.get('/monitor/log/browser-distribution');
      return data;
    },
  });

  // 获取操作系统分布
  const { data: osDist } = useQuery<DistributionItem[]>({
    queryKey: ['osDistribution'],
    queryFn: async () => {
      const data = await request.get('/monitor/log/os-distribution');
      return data;
    },
  });

  // 获取操作用户排行
  const { data: topOperators } = useQuery<DistributionItem[]>({
    queryKey: ['topOperators'],
    queryFn: async () => {
      const data = await request.get('/monitor/log/top-operators');
      return data;
    },
  });

  // 获取最近错误
  const { data: recentErrors } = useQuery<{ operErrors: ErrorLog[]; loginErrors: ErrorLog[] }>({
    queryKey: ['recentErrors'],
    queryFn: async () => {
      const data = await request.get('/monitor/log/recent-errors', {
        params: { limit: 20 },
      });
      return data;
    },
  });

  // 清理过期日志
  const cleanupMutation = useMutation({
    mutationFn: async (days: number) => {
      const { data } = await request.delete('/monitor/log/cleanup', {
        params: { days },
      });
      return data;
    },
    onSuccess: () => {
      refetchStats();
    },
  });

  const handleRefresh = () => {
    refetchStats();
  };

  const handleCleanup = (days: number) => {
    cleanupMutation.mutate(days);
  };

  const maxTrendCount = Math.max(
    ...(loginTrend?.map((t) => t.count) || [1]),
    ...(operTrend?.map((t) => t.count) || [1])
  );

  return (
    <div>
      <Alert
        message="日志监控"
        description="监控登录日志和操作日志的统计信息，包括日志量趋势、分布分析等。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="登录日志总数"
              value={stats?.loginLog.total || 0}
              prefix={<LoginOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日登录"
              value={stats?.loginLog.today || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="操作日志总数"
              value={stats?.operLog.total || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日操作"
              value={stats?.operLog.today || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button onClick={() => handleCleanup(90)} loading={cleanupMutation.isPending}>
              清理90天前日志
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="日志趋势" key="trend">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="登录日志趋势（30天）" size="small">
                  <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                    {loginTrend?.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                        <div
                          style={{
                            height: Math.max(2, (item.count / maxTrendCount) * 180),
                            backgroundColor: '#52c41a',
                            borderRadius: '2px 2px 0 0',
                          }}
                          title={`${item.date}: ${item.count}`}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="操作日志趋势（30天）" size="small">
                  <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                    {operTrend?.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                        <div
                          style={{
                            height: Math.max(2, (item.count / maxTrendCount) * 180),
                            backgroundColor: '#1890ff',
                            borderRadius: '2px 2px 0 0',
                          }}
                          title={`${item.date}: ${item.count}`}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>

          <Tabs.TabPane tab="分布分析" key="distribution">
            <Row gutter={16}>
              <Col span={8}>
                <Card title="登录状态" size="small">
                  {loginStatusDist?.map((item) => (
                    <div key={item.statusCode} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Tag color={item.statusCode === '0' ? 'green' : 'red'}>
                          {item.status}
                        </Tag>
                        <span>{item.count}</span>
                      </div>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={8}>
                <Card title="操作类型" size="small">
                  {operTypeDist?.map((item) => (
                    <div key={item.typeCode} style={{ marginBottom: 8 }}>
                      <Tag>{item.type}</Tag>
                      <span style={{ marginLeft: 8 }}>{item.count}</span>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={8}>
                <Card title="登录地点 Top5" size="small">
                  {locationDist?.slice(0, 5).map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <GlobalOutlined /> {item.location}
                      <span style={{ float: 'right' }}>{item.count}</span>
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Card title="浏览器分布" size="small">
                  {browserDist?.slice(0, 5).map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <GlobalOutlined /> {item.browser}
                      <span style={{ float: 'right' }}>{item.count}</span>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={8}>
                <Card title="操作系统分布" size="small">
                  {osDist?.slice(0, 5).map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <TeamOutlined /> {item.os}
                      <span style={{ float: 'right' }}>{item.count}</span>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={8}>
                <Card title="操作用户排行 Top5" size="small">
                  {topOperators?.slice(0, 5).map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <TeamOutlined /> {item.username}
                      <span style={{ float: 'right' }}>{item.count}</span>
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>

          <Tabs.TabPane tab="最近错误" key="errors">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="登录失败" size="small">
                  {recentErrors?.loginErrors && recentErrors.loginErrors.length > 0 ? (
                    <Table
                      dataSource={recentErrors.loginErrors}
                      columns={[
                        { title: '用户名', dataIndex: 'username', key: 'username' },
                        { title: 'IP', dataIndex: 'ipaddr', key: 'ipaddr' },
                        { title: '地点', dataIndex: 'location', key: 'location' },
                        { title: '时间', dataIndex: 'loginTime', key: 'loginTime', render: (t: string) => new Date(t).toLocaleString() },
                        { title: '原因', dataIndex: 'msg', key: 'msg', ellipsis: true },
                      ]}
                      rowKey="id"
                      size="small"
                      pagination={{ pageSize: 5 }}
                    />
                  ) : (
                    <Alert message="暂无登录失败记录" type="success" showIcon />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="操作失败" size="small">
                  {recentErrors?.operErrors && recentErrors.operErrors.length > 0 ? (
                    <Table
                      dataSource={recentErrors.operErrors}
                      columns={[
                        { title: '用户', dataIndex: 'operName', key: 'operName' },
                        { title: '操作', dataIndex: 'title', key: 'title', ellipsis: true },
                        { title: 'URL', dataIndex: 'operUrl', key: 'operUrl', ellipsis: true },
                        { title: '时间', dataIndex: 'operTime', key: 'operTime', render: (t: string) => new Date(t).toLocaleString() },
                        { title: '错误', dataIndex: 'errorMsg', key: 'errorMsg', ellipsis: true },
                      ]}
                      rowKey="id"
                      size="small"
                      pagination={{ pageSize: 5 }}
                    />
                  ) : (
                    <Alert message="暂无操作失败记录" type="success" showIcon />
                  )}
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default LogMonitor;
