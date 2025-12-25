import { useRef, useState, useEffect } from 'react';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import {
  ProColumns,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormDependency,
} from '@ant-design/pro-components';
import { message, Popconfirm, Switch, Drawer, Tag, Form, Typography } from 'antd';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import cronParser from 'cron-parser';
import ProTable, { ProTableRef } from '@/components/ProTable';
import PermissionButton from '@/components/PermissionButton';
import { SYSTEM } from '@/constants/permissions';
import request from '@/utils/request';
import { useUserStore } from '@/stores/user';

interface Job {
  id: number;
  name: string;
  type: 'SYSTEM' | 'HTTP';
  handler: string;
  httpMethod?: string | null;
  httpUrl?: string | null;
  httpHeaders?: Record<string, any> | null;
  cron: string;
  payload?: Record<string, any> | null;
  status: string;
  remark?: string;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
}

interface JobLog {
  id: number;
  jobId: number;
  jobName: string;
  handler: string;
  trigger: string;
  status: string;
  message?: string;
  error?: string;
  payload?: Record<string, any> | null;
  startedAt: string;
  finishedAt?: string | null;
  durationMs?: number | null;
  result?: Record<string, any> | null;
}

const JobList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<Job | null>(null);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [logJob, setLogJob] = useState<Job | null>(null);
  const { hasPermission } = useUserStore();

  useEffect(() => {
    if (!modalOpen) {
      return;
    }
    if (editingRecord) {
      form.setFieldsValue({
        name: editingRecord.name,
        type: editingRecord.type,
        handler: editingRecord.handler,
        httpMethod: editingRecord.httpMethod,
        httpUrl: editingRecord.httpUrl,
        httpHeaders: editingRecord.httpHeaders
          ? JSON.stringify(editingRecord.httpHeaders, null, 2)
          : undefined,
        cron: editingRecord.cron,
        payload: editingRecord.payload
          ? JSON.stringify(editingRecord.payload, null, 2)
          : undefined,
        remark: editingRecord.remark,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        type: 'SYSTEM',
        handler: 'system:heartbeat',
        httpMethod: 'GET',
      });
    }
  }, [editingRecord, form, modalOpen]);

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingId) {
        return request.put(`/system/job/${editingId}`, values);
      }
      return request.post('/system/job', values);
    },
    onSuccess: () => {
      message.success(editingId ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingId(null);
      setEditingRecord(null);
      tableRef.current?.reload();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => request.delete(`/system/job/${id}`),
    onSuccess: () => {
      message.success('删除成功');
      tableRef.current?.reload();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (params: { id: number; status: string }) =>
      request.put(`/system/job/${params.id}/status`, {
        status: params.status,
      }),
    onSuccess: () => {
      message.success('状态已更新');
      tableRef.current?.reload();
    },
  });

  const runMutation = useMutation({
    mutationFn: async (id: number) => request.post(`/system/job/${id}/run`),
    onSuccess: () => {
      message.success('任务已触发');
    },
  });

  const handleEdit = (record: Job) => {
    setEditingId(record.id);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleStatusChange = (record: Job, enabled: boolean) => {
    statusMutation.mutate({
      id: record.id,
      status: enabled ? 'ENABLED' : 'DISABLED',
    });
  };

  const handleShowLogs = (record: Job) => {
    setLogJob(record);
    setLogDrawerOpen(true);
  };

  const columns: ProColumns<Job>[] = [
    {
      title: '任务名称',
      dataIndex: 'name',
      width: 160,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 110,
      valueType: 'select',
      valueEnum: {
        SYSTEM: { text: '系统处理' },
        HTTP: { text: 'HTTP请求' },
      },
    },
    {
      title: '处理器',
      dataIndex: 'handler',
      width: 180,
      render: (_, record) =>
        record.type === 'HTTP'
          ? record.httpUrl || '-'
          : record.handler,
    },
    {
      title: 'Cron',
      dataIndex: 'cron',
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: {
        ENABLED: { text: '启用', status: 'Success' },
        DISABLED: { text: '停用', status: 'Default' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 'ENABLED'}
          checkedChildren="启用"
          unCheckedChildren="停用"
          disabled={!hasPermission(SYSTEM.JOB.EDIT)}
          onChange={(checked) => handleStatusChange(record, checked)}
        />
      ),
    },
    {
      title: '上次执行',
      dataIndex: 'lastRunAt',
      width: 170,
      hideInSearch: true,
      render: (_, record) =>
        record.lastRunAt
          ? dayjs(record.lastRunAt).format('YYYY-MM-DD HH:mm:ss')
          : '-',
    },
    {
      title: '下次执行',
      dataIndex: 'nextRunAt',
      width: 170,
      hideInSearch: true,
      render: (_, record) =>
        record.nextRunAt
          ? dayjs(record.nextRunAt).format('YYYY-MM-DD HH:mm:ss')
          : (() => {
              try {
                const interval = cronParser.parseExpression(record.cron);
                return dayjs(interval.next().toDate()).format(
                  'YYYY-MM-DD HH:mm:ss',
                );
              } catch {
                return '-';
              }
            })(),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      fixed: 'right',
      render: (_, record) => [
        <PermissionButton
          key="edit"
          type="link"
          size="small"
          permission={SYSTEM.JOB.EDIT}
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </PermissionButton>,
        <PermissionButton
          key="run"
          type="link"
          size="small"
          permission={SYSTEM.JOB.RUN}
          icon={<PlayCircleOutlined />}
          disabled={record.status !== 'ENABLED'}
          onClick={() => runMutation.mutate(record.id)}
        >
          立即执行
        </PermissionButton>,
        <PermissionButton
          key="logs"
          type="link"
          size="small"
          permission={SYSTEM.JOB.LOG}
          icon={<FileSearchOutlined />}
          onClick={() => handleShowLogs(record)}
        >
          执行记录
        </PermissionButton>,
        <Popconfirm
          key="delete"
          title="确定删除吗？"
          onConfirm={() => deleteMutation.mutate(record.id)}
        >
          <PermissionButton
            type="link"
            size="small"
            danger
            permission={SYSTEM.JOB.REMOVE}
            icon={<DeleteOutlined />}
          >
            删除
          </PermissionButton>
        </Popconfirm>,
      ],
    },
  ];

  const logColumns: ProColumns<JobLog>[] = [
    {
      title: '任务名称',
      dataIndex: 'jobName',
      width: 160,
      hideInSearch: true,
    },
    {
      title: '处理器',
      dataIndex: 'handler',
      width: 160,
      hideInSearch: true,
    },
    {
      title: '触发方式',
      dataIndex: 'trigger',
      width: 100,
      valueType: 'select',
      valueEnum: {
        CRON: { text: '定时' },
        MANUAL: { text: '手动' },
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        SUCCESS: { text: '成功', status: 'Success' },
        FAILED: { text: '失败', status: 'Error' },
        RUNNING: { text: '执行中', status: 'Processing' },
      },
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          SUCCESS: 'green',
          FAILED: 'red',
          RUNNING: 'blue',
        };
        return <Tag color={colorMap[record.status] ?? 'default'}>{record.status}</Tag>;
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      width: 170,
      hideInSearch: true,
      render: (_, record) => dayjs(record.startedAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '结束时间',
      dataIndex: 'finishedAt',
      width: 170,
      hideInSearch: true,
      render: (_, record) =>
        record.finishedAt
          ? dayjs(record.finishedAt).format('YYYY-MM-DD HH:mm:ss')
          : '-',
    },
    {
      title: '耗时(ms)',
      dataIndex: 'durationMs',
      width: 110,
      hideInSearch: true,
    },
    {
      title: '信息',
      dataIndex: 'message',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '请求参数',
      dataIndex: 'payload',
      width: 220,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) =>
        record.payload ? (
          <Typography.Text
            ellipsis
            copyable={{ text: JSON.stringify(record.payload) }}
          >
            {JSON.stringify(record.payload)}
          </Typography.Text>
        ) : (
          '-'
        ),
    },
    {
      title: '返回结果',
      dataIndex: 'result',
      width: 220,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) =>
        record.result ? (
          <Typography.Text
            ellipsis
            copyable={{ text: JSON.stringify(record.result) }}
          >
            {JSON.stringify(record.result)}
          </Typography.Text>
        ) : (
          '-'
        ),
    },
    {
      title: '错误',
      dataIndex: 'error',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) =>
        record.error ? (
          <Typography.Text
            ellipsis
            copyable={{ text: record.error }}
          >
            {record.error}
          </Typography.Text>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <>
      <ProTable
        ref={tableRef}
        api="/system/job"
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
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={SYSTEM.JOB.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增任务
          </PermissionButton>,
        ]}
      />

      <ModalForm<Job>
        title={editingId ? '编辑任务' : '新增任务'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        width={640}
        form={form}
        initialValues={
          editingRecord
            ? {
                name: editingRecord.name,
                type: editingRecord.type,
                handler: editingRecord.handler,
                httpMethod: editingRecord.httpMethod,
                httpUrl: editingRecord.httpUrl,
                httpHeaders: editingRecord.httpHeaders
                  ? JSON.stringify(editingRecord.httpHeaders, null, 2)
                  : undefined,
                cron: editingRecord.cron,
                payload: editingRecord.payload
                  ? JSON.stringify(editingRecord.payload, null, 2)
                  : undefined,
                remark: editingRecord.remark,
              }
            : {
                type: 'SYSTEM',
                handler: 'system:heartbeat',
                httpMethod: 'GET',
              }
        }
        modalProps={{
          destroyOnHidden: true,
        }}
        onFinish={async (values) => {
          try {
            let payload = undefined;
            if (typeof values.payload === 'string' && values.payload.trim()) {
              payload = JSON.parse(values.payload);
            }
            let httpHeaders = undefined;
            if (
              typeof values.httpHeaders === 'string' &&
              values.httpHeaders.trim()
            ) {
              httpHeaders = JSON.parse(values.httpHeaders);
            }
            const payloadValues = {
              ...values,
              payload,
              httpHeaders,
            };
            await saveMutation.mutateAsync(payloadValues);
            return true;
          } catch (error: any) {
            if (error instanceof SyntaxError) {
              message.error('任务参数/请求头必须是合法 JSON');
              return false;
            }
            return false;
          }
        }}
      >
        <ProFormSelect
          name="type"
          label="任务类型"
          options={[
            { label: '系统处理', value: 'SYSTEM' },
            { label: 'HTTP请求', value: 'HTTP' },
          ]}
          rules={[{ required: true, message: '请选择任务类型' }]}
        />
        <ProFormText
          name="name"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
          placeholder="请输入任务名称"
        />
        <ProFormDependency name={['type']}>
          {({ type }) =>
            type === 'HTTP' ? (
              <>
                <ProFormSelect
                  name="httpMethod"
                  label="HTTP 方法"
                  options={[
                    { label: 'GET', value: 'GET' },
                    { label: 'POST', value: 'POST' },
                    { label: 'PUT', value: 'PUT' },
                    { label: 'PATCH', value: 'PATCH' },
                    { label: 'DELETE', value: 'DELETE' },
                  ]}
                  rules={[{ required: true, message: '请选择 HTTP 方法' }]}
                />
                <ProFormText
                  name="httpUrl"
                  label="HTTP 地址"
                  rules={[{ required: true, message: '请输入请求地址' }]}
                  placeholder="例如 https://api.example.com/health"
                />
                <ProFormTextArea
                  name="httpHeaders"
                  label="HTTP 请求头(JSON)"
                  placeholder='例如 {"Authorization":"Bearer xxx"}'
                  fieldProps={{ rows: 3 }}
                />
                <ProFormText
                  name="handler"
                  label="处理器标识"
                  rules={[{ required: true, message: '请输入处理器标识' }]}
                  placeholder="例如 http:request"
                />
              </>
            ) : (
              <ProFormText
                name="handler"
                label="处理器标识"
                rules={[{ required: true, message: '请输入处理器标识' }]}
                placeholder="例如 system:heartbeat"
              />
            )
          }
        </ProFormDependency>
        <ProFormText
          name="cron"
          label="Cron 表达式"
          rules={[{ required: true, message: '请输入 Cron 表达式' }]}
          placeholder="例如 */5 * * * *"
        />
        <ProFormDependency name={['cron']}>
          {({ cron }) => {
            let nextRunAt = '-';
            if (cron) {
              try {
                const interval = cronParser.parseExpression(cron);
                nextRunAt = dayjs(interval.next().toDate()).format(
                  'YYYY-MM-DD HH:mm:ss',
                );
              } catch {
                nextRunAt = '无效 Cron';
              }
            }
            return (
              <Form.Item label="下次执行时间">
                <span>{nextRunAt}</span>
              </Form.Item>
            );
          }}
        </ProFormDependency>
        <ProFormSelect
          name="cronPreset"
          label="快速填入"
          placeholder="选择常用 Cron"
          fieldProps={{
            onChange: (value: string) => {
              if (value) {
                form.setFieldValue('cron', value);
              }
            },
          }}
          options={[
            { label: '每分钟', value: '* * * * *' },
            { label: '每5分钟', value: '*/5 * * * *' },
            { label: '每10分钟', value: '*/10 * * * *' },
            { label: '每小时', value: '0 * * * *' },
            { label: '每天零点', value: '0 0 * * *' },
            { label: '每周一零点', value: '0 0 * * 1' },
          ]}
        />
        <ProFormTextArea
          name="payload"
          label="请求参数(JSON)"
          placeholder='例如 {"key":"value"}'
          rules={[
            {
              validator: async (_, value) => {
                if (!value || !value.trim()) {
                  return Promise.resolve();
                }
                try {
                  JSON.parse(value);
                  return Promise.resolve();
                } catch {
                  return Promise.reject(new Error('请求参数必须是合法 JSON'));
                }
              },
            },
          ]}
          fieldProps={{
            rows: 4,
          }}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注"
          fieldProps={{
            rows: 2,
          }}
        />
      </ModalForm>

      <Drawer
        title={logJob ? `执行记录 - ${logJob.name}` : '执行记录'}
        open={logDrawerOpen}
        onClose={() => setLogDrawerOpen(false)}
        width={980}
        destroyOnClose
      >
        <ProTable
          rowKey="id"
          columns={logColumns}
          search={{
            labelWidth: 'auto',
          }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 条`,
          }}
          request={async (params) => {
            if (!logJob) {
              return { data: [], total: 0, success: true };
            }
            const { current, pageSize, ...rest } = params;
            const result = await request.get(`/system/job/${logJob.id}/logs`, {
              params: {
                page: current,
                pageSize,
                ...rest,
              },
            });
            return {
              data: result.data,
              total: result.total,
              success: true,
            };
          }}
        />
      </Drawer>
    </>
  );
};

export default JobList;
