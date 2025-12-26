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
  Tooltip,
  Drawer,
  Spin,
} from 'antd';
import {
  ReloadOutlined,
  DatabaseOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/utils/request';

interface DatabaseInfo {
  version: string;
  size: string;
  connections: number;
  cacheHitRatio: string;
  transactions: {
    commit: number;
    rollback: number;
  };
  tuples: {
    returned: number;
    fetched: number;
    inserted: number;
    updated: number;
    deleted: number;
  };
  conflicts: number;
  deadlocks: number;
}

interface TableInfo {
  name: string;
  rows: number;
  dataSize: string;
  indexSize: string;
  totalSize: string;
  comment: string;
}

interface ConnectionInfo {
  pid: number;
  username: string;
  database: string;
  clientAddr: string;
  state: string;
  query: string;
  queryStart: Date | null;
}

interface SlowQuery {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  maxTime: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string | null;
  comment: string | null;
}

const DatabaseMonitor: React.FC = () => {
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tables');

  // 获取数据库基本信息
  const { data: dbInfo, refetch: refetchInfo } = useQuery<DatabaseInfo>({
    queryKey: ['databaseInfo'],
    queryFn: async () => {
      const data = await request.get('/system/database-monitor/info');
      return data;
    },
  });

  // 获取表信息
  const { data: tables, isLoading: tablesLoading, refetch: refetchTables } = useQuery<TableInfo[]>({
    queryKey: ['databaseTables'],
    queryFn: async () => {
      const data = await request.get('/system/database-monitor/tables');
      return data;
    },
  });

  // 获取连接列表
  const { data: connections, isLoading: connsLoading, refetch: refetchConns } = useQuery<ConnectionInfo[]>({
    queryKey: ['databaseConnections'],
    queryFn: async () => {
      const data = await request.get('/system/database-monitor/connections');
      return data;
    },
  });

  // 获取连接池状态
  const { data: poolStatus } = useQuery({
    queryKey: ['connectionPool'],
    queryFn: async () => {
      const data = await request.get('/system/database-monitor/connection-pool');
      return data;
    },
  });

  // 获取慢查询
  const { data: slowQueries, isLoading: slowLoading, refetch: refetchSlow } = useQuery<SlowQuery[]>({
    queryKey: ['slowQueries'],
    queryFn: async () => {
      const data = await request.get('/system/database-monitor/slow-queries');
      return data;
    },
  });

  // 获取锁信息
  const { data: locks, isLoading: locksLoading } = useQuery({
    queryKey: ['databaseLocks'],
    queryFn: async () => {
      const data = await request.get('/system/database-monitor/locks');
      return data;
    },
  });

  // 获取未使用索引
  const { data: unusedIndexes, isLoading: indexesLoading } = useQuery({
    queryKey: ['unusedIndexes'],
    queryFn: async () => {
      const data = await request.get('/system/database-monitor/unused-indexes');
      return data;
    },
  });

  // 获取表列信息
  const { data: columns, isLoading: columnsLoading } = useQuery<ColumnInfo[]>({
    queryKey: ['tableColumns', selectedTable],
    queryFn: async () => {
      if (!selectedTable) return [];
      const data = await request.get(`/system/database-monitor/table/${selectedTable}/columns`);
      return data;
    },
    enabled: !!selectedTable,
  });

  // 终止连接
  const terminateMutation = useMutation({
    mutationFn: async (pid: number) => {
      const { data } = await request.post(`/system/database-monitor/connections/${pid}/terminate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databaseConnections'] });
    },
  });

  const handleRefresh = () => {
    refetchInfo();
    refetchTables();
    refetchConns();
    refetchSlow();
  };

  const handleViewColumns = (tableName: string) => {
    setSelectedTable(tableName);
    setColumnModalOpen(true);
  };

  const tableColumns = [
    {
      title: '表名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <a onClick={() => handleViewColumns(text)}>
          <TableOutlined /> {text}
        </a>
      ),
    },
    {
      title: '行数',
      dataIndex: 'rows',
      key: 'rows',
      sorter: (a: TableInfo, b: TableInfo) => a.rows - b.rows,
    },
    {
      title: '数据大小',
      dataIndex: 'dataSize',
      key: 'dataSize',
      sorter: (a: TableInfo, b: TableInfo) =>
        parseFloat(a.dataSize) - parseFloat(b.dataSize),
    },
    {
      title: '索引大小',
      dataIndex: 'indexSize',
      key: 'indexSize',
    },
    {
      title: '总大小',
      dataIndex: 'totalSize',
      key: 'totalSize',
      sorter: (a: TableInfo, b: TableInfo) =>
        parseFloat(a.totalSize) - parseFloat(b.totalSize),
    },
  ];

  const connectionColumns = [
    {
      title: 'PID',
      dataIndex: 'pid',
      key: 'pid',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '数据库',
      dataIndex: 'database',
      key: 'database',
    },
    {
      title: '客户端',
      dataIndex: 'clientAddr',
      key: 'clientAddr',
    },
    {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      render: (state: string) => {
        const color = state === 'active' ? 'green' : state === 'idle' ? 'orange' : 'red';
        return <Tag color={color}>{state}</Tag>;
      },
    },
    {
      title: '当前查询',
      dataIndex: 'query',
      key: 'query',
      ellipsis: true,
      render: (query: string) => (
        <Tooltip title={query}>
          {query ? query.substring(0, 50) + (query.length > 50 ? '...' : '') : '-'}
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: ConnectionInfo) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => terminateMutation.mutate(record.pid)}
          loading={terminateMutation.isPending}
        >
          终止
        </Button>
      ),
    },
  ];

  const slowQueryColumns = [
    {
      title: '查询语句',
      dataIndex: 'query',
      key: 'query',
      ellipsis: true,
      render: (query: string) => (
        <Tooltip title={query}>
          <code>{query?.substring(0, 100)}...</code>
        </Tooltip>
      ),
    },
    {
      title: '调用次数',
      dataIndex: 'calls',
      key: 'calls',
    },
    {
      title: '平均耗时(ms)',
      dataIndex: 'meanTime',
      key: 'meanTime',
      render: (time: number) => time.toFixed(2),
    },
    {
      title: '最大耗时(ms)',
      dataIndex: 'maxTime',
      key: 'maxTime',
      render: (time: number) => time.toFixed(2),
    },
  ];

  return (
    <div>
      <Alert
        message="数据库监控"
        description="监控 PostgreSQL 数据库运行状态，包括连接数、表信息、慢查询等。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据库版本"
              value={dbInfo?.version?.split(' ')[0] || '-'}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="当前连接数"
              value={dbInfo?.connections || 0}
              suffix={`/ ${poolStatus?.maxConnections || 100}`}
              valueStyle={{ color: (dbInfo?.connections || 0) > (poolStatus?.maxConnections || 100) * 0.8 ? '#cf1322' : undefined }}
            />
            <Progress
              percent={Number(poolStatus?.usagePercentage || 0)}
              showInfo={false}
              strokeColor={(dbInfo?.connections || 0) > (poolStatus?.maxConnections || 100) * 0.8 ? '#cf1322' : '#52c41a'}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="缓存命中率"
              value={dbInfo?.cacheHitRatio || '0%'}
              valueStyle={{ color: Number(dbInfo?.cacheHitRatio?.replace('%', '')) > 90 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据库大小"
              value={dbInfo?.size || '-'}
              prefix={<DatabaseOutlined />}
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
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="表信息" key="tables">
            <Table
              dataSource={tables}
              columns={tableColumns}
              rowKey="name"
              loading={tablesLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab={`连接 (${connections?.length || 0})`} key="connections">
            <Table
              dataSource={connections}
              columns={connectionColumns}
              rowKey="pid"
              loading={connsLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="慢查询" key="slow">
            {slowQueries && slowQueries.length > 0 ? (
              <Table
                dataSource={slowQueries}
                columns={slowQueryColumns}
                rowKey="query"
                loading={slowLoading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            ) : (
              <Alert message="暂无慢查询记录" type="success" showIcon />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane tab="锁信息" key="locks">
            <Table
              dataSource={locks}
              columns={[
                { title: 'PID', dataIndex: 'pid', key: 'pid', width: 80 },
                { title: '关系', dataIndex: 'relation', key: 'relation' },
                { title: '模式', dataIndex: 'mode', key: 'mode' },
                {
                  title: '已授予',
                  dataIndex: 'granted',
                  key: 'granted',
                  render: (g: boolean) => <Tag color={g ? 'green' : 'red'}>{g ? '是' : '否'}</Tag>,
                },
                { title: '查询', dataIndex: 'query', key: 'query', ellipsis: true },
              ]}
              rowKey="pid"
              loading={locksLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="未使用索引" key="indexes">
            {unusedIndexes && unusedIndexes.length > 0 ? (
              <Table
                dataSource={unusedIndexes}
                columns={[
                  { title: '表名', dataIndex: 'tableName', key: 'tableName' },
                  { title: '索引名', dataIndex: 'indexName', key: 'indexName' },
                  { title: '索引大小', dataIndex: 'indexSize', key: 'indexSize' },
                ]}
                rowKey="indexName"
                loading={indexesLoading}
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Alert message="没有发现未使用的索引" type="success" showIcon />
            )}
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Drawer
        title={`表结构: ${selectedTable}`}
        open={columnModalOpen}
        onClose={() => setColumnModalOpen(false)}
        width={600}
      >
        <Spin spinning={columnsLoading}>
          {columns && columns.length > 0 ? (
            <Table
              dataSource={columns}
              columns={[
                {
                  title: '列名',
                  dataIndex: 'name',
                  key: 'name',
                  render: (name: string, record: ColumnInfo) => (
                    <Space>
                      <code>{name}</code>
                      {record.isPrimaryKey && <Tag color="gold">PK</Tag>}
                    </Space>
                  ),
                },
                {
                  title: '类型',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type: string) => <Tag>{type}</Tag>,
                },
                {
                  title: '可空',
                  dataIndex: 'isNullable',
                  key: 'isNullable',
                  render: (nullable: boolean) => (
                    <Tag color={nullable ? 'orange' : 'green'}>
                      {nullable ? '是' : '否'}
                    </Tag>
                  ),
                },
                {
                  title: '默认值',
                  dataIndex: 'defaultValue',
                  key: 'defaultValue',
                  render: (val: string | null) => val ? <code>{val}</code> : '-',
                },
                {
                  title: '备注',
                  dataIndex: 'comment',
                  key: 'comment',
                  ellipsis: true,
                },
              ]}
              rowKey="name"
              pagination={false}
              size="small"
              scroll={{ x: 500 }}
            />
          ) : (
            <Alert type="info" showIcon description="暂无列信息" />
          )}
        </Spin>
      </Drawer>
    </div>
  );
};

export default DatabaseMonitor;
