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
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  message,
  Alert,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  BellOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import request from '@/utils/request';

interface AlertRule {
  id: number;
  name: string;
  type: string;
  condition: string;
  threshold: number;
  level: string;
  notifyType?: string;
  webhookUrl?: string;
  emailTo?: string;
  enabled: boolean;
  silenceMins: number;
  lastTriggeredAt?: string;
  createdAt: string;
  _count?: { alerts: number };
}

interface AlertEvent {
  id: number;
  ruleId: number;
  level: string;
  title: string;
  content: string;
  currentValue: number;
  threshold: number;
  status: string;
  handledBy?: string;
  handledAt?: string;
  handleRemark?: string;
  createdAt: string;
  rule?: { name: string; type: string };
}

interface AlertStats {
  total: number;
  pending: number;
  today: number;
  byLevel: { level: string; count: number }[];
}

const { TextArea } = Input;

const AlertManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isHandleModalOpen, setIsHandleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [handlingAlert, setHandlingAlert] = useState<AlertEvent | null>(null);
  const [form] = Form.useForm();
  const [handleForm] = Form.useForm();
  const queryClient = useQueryClient();

  // 获取告警规则
  const { data: rules, isLoading: rulesLoading } = useQuery<AlertRule[]>({
    queryKey: ['alertRules'],
    queryFn: async () => {
      const data = await request.get('/monitor/alert/rules');
      return data;
    },
  });

  // 获取告警事件
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['alertEvents'],
    queryFn: async () => {
      const data = await request.get('/monitor/alert/events', {
        params: { page: 1, pageSize: 20 },
      });
      return data;
    },
  });

  // 获取告警统计
  const { data: stats } = useQuery<AlertStats>({
    queryKey: ['alertStats'],
    queryFn: async () => {
      const data = await request.get('/monitor/alert/stats');
      return data;
    },
  });

  // 创建规则
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: res } = await request.post('/monitor/alert/rules', data);
      return res;
    },
    onSuccess: () => {
      message.success('创建成功');
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
      setIsRuleModalOpen(false);
      form.resetFields();
    },
  });

  // 更新规则
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const { data: res } = await request.put(`/monitor/alert/rules/${id}`, data);
      return res;
    },
    onSuccess: () => {
      message.success('更新成功');
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
      setIsRuleModalOpen(false);
      setEditingRule(null);
      form.resetFields();
    },
  });

  // 删除规则
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await request.delete(`/monitor/alert/rules/${id}`);
      return data;
    },
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
    },
  });

  // 切换规则状态
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const { data } = await request.put(`/monitor/alert/rules/${id}/toggle`, { enabled });
      return data;
    },
    onSuccess: () => {
      message.success('操作成功');
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
    },
  });

  // 处理告警
  const handleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const { data: res } = await request.put(`/monitor/alert/events/${id}/handle`, data);
      return res;
    },
    onSuccess: () => {
      message.success('处理成功');
      queryClient.invalidateQueries({ queryKey: ['alertEvents'] });
      queryClient.invalidateQueries({ queryKey: ['alertStats'] });
      setIsHandleModalOpen(false);
      setHandlingAlert(null);
      handleForm.resetFields();
    },
  });

  // 删除告警
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await request.delete(`/monitor/alert/events/${id}`);
      return data;
    },
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['alertEvents'] });
      queryClient.invalidateQueries({ queryKey: ['alertStats'] });
    },
  });

  const openRuleModal = (rule?: AlertRule) => {
    if (rule) {
      setEditingRule(rule);
      form.setFieldsValue({
        name: rule.name,
        type: rule.type,
        condition: rule.condition,
        threshold: rule.threshold,
        level: rule.level,
        notifyType: rule.notifyType,
        webhookUrl: rule.webhookUrl,
        emailTo: rule.emailTo,
        silenceMins: rule.silenceMins,
      });
    } else {
      setEditingRule(null);
      form.resetFields();
    }
    setIsRuleModalOpen(true);
  };

  const handleRuleOk = async () => {
    const values = await form.validateFields();
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const openHandleModal = (alert: AlertEvent) => {
    setHandlingAlert(alert);
    handleForm.setFieldsValue({ status: 'ACKNOWLEDGED' });
    setIsHandleModalOpen(true);
  };

  const handleAlertOk = async () => {
    if (!handlingAlert) return;
    const values = await handleForm.validateFields();
    handleMutation.mutate({ id: handlingAlert.id, data: values });
  };

  const levelColors: Record<string, string> = {
    INFO: 'blue',
    WARNING: 'orange',
    ERROR: 'red',
    CRITICAL: 'magenta',
  };

  const ruleTypeLabels: Record<string, string> = {
    CPU: 'CPU 使用率',
    MEMORY: '内存使用率',
    DISK: '磁盘使用率',
    API_ERROR_RATE: 'API 错误率',
    API_RESPONSE_TIME: 'API 响应时间',
    LOGIN_FAIL: '登录失败次数',
    DB_CONNECTION: '数据库连接数',
  };

  const conditionLabels: Record<string, string> = {
    GT: '大于',
    LT: '小于',
    EQ: '等于',
    GTE: '大于等于',
    LTE: '小于等于',
  };

  const ruleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '规则类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => ruleTypeLabels[type] || type,
    },
    {
      title: '触发条件',
      key: 'condition',
      render: (_: any, record: AlertRule) => (
        <span>
          当前值 {conditionLabels[record.condition]} {record.threshold}
        </span>
      ),
    },
    {
      title: '告警级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => <Tag color={levelColors[level]}>{level}</Tag>,
    },
    {
      title: '静默时间',
      dataIndex: 'silenceMins',
      key: 'silenceMins',
      render: (mins: number) => `${mins} 分钟`,
    },
    {
      title: '告警次数',
      key: 'alertCount',
      render: (_: any, record: AlertRule) => record._count?.alerts || 0,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Switch
          checked={enabled}
          onChange={(checked) => toggleMutation.mutate({ id: editingRule?.id || 0, enabled: checked })}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          disabled
        />
      ),
    },
    {
      title: '最后触发',
      dataIndex: 'lastTriggeredAt',
      key: 'lastTriggeredAt',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AlertRule) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openRuleModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该规则？"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const alertColumns = [
    {
      title: '告警标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: AlertEvent) => (
        <Space direction="vertical" size={0}>
          <span>{title}</span>
          <span style={{ color: '#999', fontSize: 12 }}>
            规则: {record.rule?.name || '-'}
          </span>
        </Space>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => <Tag color={levelColors[level]}>{level}</Tag>,
    },
    {
      title: '当前值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      render: (val: number, record: AlertEvent) => `${val.toFixed(2)} / ${record.threshold}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          PENDING: 'orange',
          ACKNOWLEDGED: 'blue',
          RESOLVED: 'green',
        };
        const labels: Record<string, string> = {
          PENDING: '待处理',
          ACKNOWLEDGED: '已确认',
          RESOLVED: '已解决',
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: '处理人',
      dataIndex: 'handledBy',
      key: 'handledBy',
      render: (by: string) => by || '-',
    },
    {
      title: '触发时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AlertEvent) => (
        <Space>
          {record.status === 'PENDING' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => openHandleModal(record)}
            >
              处理
            </Button>
          )}
          <Popconfirm
            title="确定删除该告警？"
            onConfirm={() => deleteAlertMutation.mutate(record.id)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Alert
        message="告警管理"
        description="配置告警规则并监控告警事件，支持 CPU、内存、磁盘、API 性能等多种监控指标。"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理告警"
              value={stats?.pending || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日告警"
              value={stats?.today || 0}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总告警数"
              value={stats?.total || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Space direction="vertical">
              {stats?.byLevel?.map((item) => (
                <div key={item.level} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Tag color={levelColors[item.level]}>{item.level}</Tag>
                  <span>{item.count}</span>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openRuleModal()}
          >
            新增规则
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="告警规则" key="rules">
            <Table
              dataSource={rules}
              columns={ruleColumns}
              rowKey="id"
              loading={rulesLoading}
              pagination={{ pageSize: 10 }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="告警事件" key="events">
            <Table
              dataSource={alertsData?.list}
              columns={alertColumns}
              rowKey="id"
              loading={alertsLoading}
              pagination={{
                pageSize: 10,
                total: alertsData?.total,
              }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* 规则编辑弹窗 */}
      <Modal
        title={editingRule ? '编辑告警规则' : '新增告警规则'}
        open={isRuleModalOpen}
        onOk={handleRuleOk}
        onCancel={() => {
          setIsRuleModalOpen(false);
          setEditingRule(null);
          form.resetFields();
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="规则类型" rules={[{ required: true }]}>
            <Select>
              {Object.entries(ruleTypeLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Space style={{ display: 'flex' }}>
            <Form.Item name="condition" label="触发条件" rules={[{ required: true }]} style={{ width: 150 }}>
              <Select>
                {Object.entries(conditionLabels).map(([key, label]) => (
                  <Select.Option key={key} value={key}>{label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="threshold" label="阈值" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="level" label="告警级别" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="INFO">INFO - 提示</Select.Option>
              <Select.Option value="WARNING">WARNING - 警告</Select.Option>
              <Select.Option value="ERROR">ERROR - 错误</Select.Option>
              <Select.Option value="CRITICAL">CRITICAL - 严重</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="notifyType" label="通知方式">
            <Select mode="multiple" placeholder="选择通知方式">
              <Select.Option value="WEBHOOK">Webhook</Select.Option>
              <Select.Option value="EMAIL">邮件</Select.Option>
              <Select.Option value="SMS">短信</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="webhookUrl" label="Webhook URL">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="emailTo" label="邮件接收人">
            <Input placeholder="多个邮箱用逗号分隔" />
          </Form.Item>
          <Form.Item name="silenceMins" label="静默时间（分钟）">
            <InputNumber min={1} defaultValue={5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 处理告警弹窗 */}
      <Modal
        title="处理告警"
        open={isHandleModalOpen}
        onOk={handleAlertOk}
        onCancel={() => {
          setIsHandleModalOpen(false);
          setHandlingAlert(null);
          handleForm.resetFields();
        }}
        confirmLoading={handleMutation.isPending}
      >
        {handlingAlert && (
          <>
            <Alert
              message={handlingAlert.title}
              description={handlingAlert.content}
              type={levelColors[handlingAlert.level] as any}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={handleForm} layout="vertical">
              <Form.Item name="status" label="处理状态" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="ACKNOWLEDGED">已确认</Select.Option>
                  <Select.Option value="RESOLVED">已解决</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="remark" label="处理备注">
                <TextArea rows={3} placeholder="请输入处理备注..." />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AlertManagement;
