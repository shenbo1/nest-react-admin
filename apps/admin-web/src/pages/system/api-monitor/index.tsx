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
  Progress,
  Alert,
} from 'antd';
import {
  ReloadOutlined,
  ApiOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import request from '@/utils/request';

interface ApiOverview {
  totalApis: number;
  totalCalls: number;
  totalErrors: number;
  avgResponseTime: string;
  errorRate: string;
  todayCalls: number;
}

interface ApiMetric {
  path: string;
  method: string;
  totalCalls: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  lastCalledAt: string | null;
}

interface ApiCall {
  path: string;
  method: string;
  status: number;
  responseTime: number;
  timestamp: string;
  ip: string;
}

const ApiMonitor: React.FC = () => {
  const [activeTab, setActiveTab] = useState('metrics');

  // 获取概览数据
  const { data: overview, refetch: refetchOverview } = useQuery<ApiOverview>({
    queryKey: ['apiOverview'],
    queryFn: async () => {
      const data = await request.get('/system/api-monitor/overview');
      return data;
    },
  });

  // 获取 API 指标
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<ApiMetric[]>({
    queryKey: ['apiMetrics'],
    queryFn: async () => {
      const data = await request.get('/system/api-monitor/metrics');
      return data;
    },
  });

  // 获取最近调用
  const { data: recentCalls, isLoading: callsLoading, refetch: refetchCalls } = useQuery<ApiCall[]>({
    queryKey: ['apiRecentCalls'],
    queryFn: async () => {
      const data = await request.get('/system/api-monitor/recent-calls', {
        params: { limit: 100 },
      });
      return data;
    },
  });

  // 获取最近错误
  const { data: recentErrors, isLoading: errorsLoading } = useQuery<ApiCall[]>({
    queryKey: ['apiRecentErrors'],
    queryFn: async () => {
      const data = await request.get('/system/api-monitor/recent-errors', {
        params: { limit: 50 },
      });
      return data;
    },
  });

  // 获取慢接口
  const { data: slowApis, isLoading: slowLoading } = useQuery<ApiMetric[]>({
    queryKey: ['apiSlowApis'],
    queryFn: async () => {
      const data = await request.get('/system/api-monitor/slow-apis');
      return data;
    },
  });

  // 获取高错误率接口
  const { data: highErrorApis, isLoading: highErrorLoading } = useQuery<ApiMetric[]>({
    queryKey: ['apiHighErrorApis'],
    queryFn: async () => {
      const data = await request.get('/system/api-monitor/high-error-rate');
      return data;
    },
  });

  // 获取调用趋势
  const { data: trend } = useQuery({
    queryKey: ['apiTrend'],
    queryFn: async () => {
      const data = await request.get('/system/api-monitor/trend');
      return data;
    },
  });

  // 获取状态码分布
  const { data: statusDistribution } = useQuery({
    queryKey: ['apiStatusDistribution'],
    queryFn: async () => {
      const data = await request.get('/system/api-monitor/status-distribution');
      return data;
    },
  });

  // 清除统计
  const clearMutation = useMutation({
    mutationFn: async () => {
      const { data } = await request.delete('/system/api-monitor/metrics');
      return data;
    },
    onSuccess: () => {
      refetchOverview();
      refetchMetrics();
      refetchCalls();
    },
  });

  const handleRefresh = () => {
    refetchOverview();
    refetchMetrics();
    refetchCalls();
  };

  const methodColors: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple',
  };

  const metricColumns = [
    {
      title: 'API 路径',
      dataIndex: 'path',
      key: 'path',
      render: (path: string, record: ApiMetric) => (
        <Space>
          <Tag color={methodColors[record.method] || 'default'}>{record.method}</Tag>
          <code>{path}</code>
        </Space>
      ),
    },
    {
      title: '调用次数',
      dataIndex: 'totalCalls',
      key: 'totalCalls',
      sorter: (a: ApiMetric, b: ApiMetric) => a.totalCalls - b.totalCalls,
    },
    {
      title: '成功',
      dataIndex: 'successCount',
      key: 'successCount',
    },
    {
      title: '失败',
      dataIndex: 'errorCount',
      key: 'errorCount',
      render: (count: number) => <Tag color={count > 0 ? 'red' : 'green'}>{count}</Tag>,
    },
    {
      title: '平均响应(ms)',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      render: (time: number) => time.toFixed(2),
      sorter: (a: ApiMetric, b: ApiMetric) => a.avgResponseTime - b.avgResponseTime,
    },
    {
      title: '最大响应(ms)',
      dataIndex: 'maxResponseTime',
      key: 'maxResponseTime',
      render: (time: number) => time.toFixed(2),
    },
    {
      title: '最后调用',
      dataIndex: 'lastCalledAt',
      key: 'lastCalledAt',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
  ];

  const recentCallColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: string) => new Date(time).toLocaleTimeString(),
      width: 100,
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => <Tag color={methodColors[method]}>{method}</Tag>,
    },
    {
      title: '路径',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => {
        const color = status >= 200 && status < 300 ? 'green' : status >= 400 ? 'red' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 100,
      render: (time: number) => (
        <span style={{ color: time > 1000 ? '#cf1322' : time > 500 ? '#faad14' : undefined }}>
          {time.toFixed(0)}ms
        </span>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
    },
  ];

  const statusData = statusDistribution?.map((item: any) => ({
    status: item.status,
    count: item.count,
    percentage: ((item.count / (overview?.totalCalls || 1)) * 100).toFixed(1),
  }));

  return (
    <div>
      <Alert
        message="API 监控"
        description="监控所有 API 接口的调用情况，包括调用量、响应时间、错误率等指标。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="API 数量"
              value={overview?.totalApis || 0}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="今日调用"
              value={overview?.todayCalls || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总调用量"
              value={overview?.totalCalls || 0}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总错误数"
              value={overview?.totalErrors || 0}
              valueStyle={{ color: overview?.totalErrors ? '#cf1322' : undefined }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="平均响应"
              value={overview?.avgResponseTime || '0'}
              suffix="ms"
              valueStyle={{ color: Number(overview?.avgResponseTime) > 500 ? '#cf1322' : undefined }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="错误率"
              value={overview?.errorRate || '0'}
              suffix="%"
              valueStyle={{ color: Number(overview?.errorRate) > 5 ? '#cf1322' : undefined }}
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
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => clearMutation.mutate()}
              loading={clearMutation.isPending}
            >
              清除统计
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="API 指标" key="metrics">
            <Table
              dataSource={metrics}
              columns={metricColumns}
              rowKey="path"
              loading={metricsLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="最近调用" key="recent">
            <Table
              dataSource={recentCalls}
              columns={recentCallColumns}
              rowKey="timestamp"
              loading={callsLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="最近错误" key="errors">
            {recentErrors && recentErrors.length > 0 ? (
              <Table
                dataSource={recentErrors}
                columns={recentCallColumns}
                rowKey="timestamp"
                loading={errorsLoading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            ) : (
              <Alert message="暂无错误记录" type="success" showIcon />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane tab="慢接口" key="slow">
            {slowApis && slowApis.length > 0 ? (
              <Table
                dataSource={slowApis}
                columns={metricColumns}
                rowKey="path"
                loading={slowLoading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1000 }}
              />
            ) : (
              <Alert message="暂无慢接口（响应时间 > 1000ms）" type="success" showIcon />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane tab="高错误率" key="highError">
            {highErrorApis && highErrorApis.length > 0 ? (
              <Table
                dataSource={highErrorApis}
                columns={[
                  ...metricColumns,
                  {
                    title: '错误率',
                    dataIndex: 'errorRate',
                    key: 'errorRate',
                    render: (rate: string) => (
                      <Progress
                        percent={Number(rate)}
                        size="small"
                        status={Number(rate) > 10 ? 'exception' : 'normal'}
                      />
                    ),
                  },
                ]}
                rowKey="path"
                loading={highErrorLoading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1100 }}
              />
            ) : (
              <Alert message="暂无高错误率接口（错误率 > 5%）" type="success" showIcon />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane tab="调用趋势" key="trend">
            <Row gutter={16}>
              <Col span={16}>
                <Card title="24小时调用量趋势" size="small">
                  {trend && (
                    <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                      {trend.map((item: any, idx: number) => (
                        <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                          <div
                            style={{
                              height: Math.max(5, (item.calls / Math.max(...trend.map((t: any) => t.calls))) * 150),
                              backgroundColor: '#1890ff',
                              borderRadius: '4px 4px 0 0',
                            }}
                          />
                          <div style={{ fontSize: 10, marginTop: 4 }}>
                            {item.time.split(' ')[1]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={8}>
                <Card title="状态码分布" size="small">
                  {statusData?.map((item: any) => (
                    <div key={item.status} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Tag color={
                          item.status === '2xx' ? 'green' :
                          item.status === '4xx' ? 'orange' :
                          item.status === '5xx' ? 'red' : 'blue'
                        }>
                          {item.status}
                        </Tag>
                        <span>{item.count} ({item.percentage}%)</span>
                      </div>
                      <Progress
                        percent={Number(item.percentage)}
                        size="small"
                        showInfo={false}
                        strokeColor={
                          item.status === '2xx' ? '#52c41a' :
                          item.status === '4xx' ? '#faad14' :
                          item.status === '5xx' ? '#cf1322' : '#1890ff'
                        }
                      />
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ApiMonitor;
