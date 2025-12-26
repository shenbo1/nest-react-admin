import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Space,
  Spin,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  ApartmentOutlined,
  LoginOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, LoginLog } from '@/services/system/dashboard';
import { useUserStore } from '@/stores/user';
import dayjs from 'dayjs';
import SystemMetricsComponent from './SystemMetrics';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { userInfo } = useUserStore();

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-statistics'],
    queryFn: dashboardApi.getStatistics,
  });

  const loginColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '登录IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
    },
    {
      title: '登录地点',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '浏览器',
      dataIndex: 'browser',
      key: 'browser',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      key: 'os',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag
          icon={
            status === 'SUCCESS' ? (
              <CheckCircleOutlined />
            ) : (
              <CloseCircleOutlined />
            )
          }
          color={status === 'SUCCESS' ? 'success' : 'error'}
        >
          {status === 'SUCCESS' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? '上午好' : currentHour < 18 ? '下午好' : '晚上好';

  return (
    <div>
      {/* 欢迎区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space orientation="vertical" size={4}>
              <Title level={4} style={{ margin: 0 }}>
                {greeting}，{userInfo?.nickname || userInfo?.username}
              </Title>
              <Text type="secondary">欢迎回来，祝你开心每一天！</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <ClockCircleOutlined style={{ color: '#1890ff' }} />
              <Text type="secondary">
                {dayjs().format('YYYY年MM月DD日 dddd')}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Spin spinning={statsLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="用户总数"
                value={statistics?.userCount || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="角色数量"
                value={statistics?.roleCount || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="菜单数量"
                value={statistics?.menuCount || 0}
                prefix={<MenuOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="部门数量"
                value={statistics?.deptCount || 0}
                prefix={<ApartmentOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12}>
            <Card hoverable>
              <Statistic
                title="今日登录次数"
                value={statistics?.todayLoginCount || 0}
                prefix={<LoginOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card hoverable>
              <Statistic
                title="累计登录次数"
                value={statistics?.loginLogCount || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* 实时系统监控 */}
      <SystemMetricsComponent />

      {/* 系统介绍 */}
      <Card style={{ marginTop: 24 }} title="系统介绍">
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Title level={5}>技术栈</Title>
            <ul style={{ color: '#666', paddingLeft: 20 }}>
              <li>后端：NestJS 11 + Prisma ORM + PostgreSQL</li>
              <li>前端：React 19 + Vite + Ant Design Pro</li>
              <li>状态管理：Zustand + React Query</li>
              <li>认证：JWT Token + Passport.js</li>
            </ul>
          </Col>
          <Col xs={24} md={12}>
            <Title level={5}>功能模块</Title>
            <ul style={{ color: '#666', paddingLeft: 20 }}>
              <li>用户管理：用户的增删改查、角色分配、密码重置</li>
              <li>角色管理：角色权限分配、菜单权限配置</li>
              <li>菜单管理：动态菜单配置、按钮权限</li>
              <li>部门管理：组织架构树形管理</li>
              <li>字典管理：数据字典维护</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
