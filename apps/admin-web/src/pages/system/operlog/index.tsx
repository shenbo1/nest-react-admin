import { useRef, useState } from 'react';
import { EyeOutlined } from '@ant-design/icons';
import { ProColumns } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import PermissionButton from '@/components/PermissionButton';
import ProTable, { ProTableRef } from '@/components/ProTable';
import { SYSTEM } from '@/constants/permissions';
import dayjs from 'dayjs';
import request from '@/utils/request';

interface OperLog {
  id: number;
  title?: string;
  businessType: number;
  method?: string;
  requestMethod?: string;
  operatorType: number;
  operName?: string;
  deptName?: string;
  operUrl?: string;
  operIp?: string;
  operLocation?: string;
  operParam?: string;
  jsonResult?: string;
  status: number;
  errorMsg?: string;
  operTime: string;
  costTime: number;
}

const OperLogList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<OperLog | null>(null);

  // 删除日志
  const deleteMutation = useMutation({
    mutationFn: async (ids: string) => {
      const result = await request.delete('/log/operlog', {
        params: { ids },
      });
      return result;
    },
    onSuccess: () => {
      message.success('删除成功');
      tableRef.current?.reload();
    },
  });

  // 批量删除
  const handleBatchDelete = async (selectedRows: OperLog[]) => {
    const ids = selectedRows.map((row) => row.id).join(',');
    await deleteMutation.mutateAsync(ids);
  };

  // 查看详情
  const handleViewDetail = (record: OperLog) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  // 业务类型文本
  const getBusinessTypeText = (type: number) => {
    const typeMap: Record<number, string> = {
      0: '其他',
      1: '新增',
      2: '修改',
      3: '删除',
      4: '授权',
      5: '导出',
      6: '导入',
      7: '强退',
      8: '生成代码',
      9: '清空数据',
    };
    return typeMap[type] || '未知';
  };

  // 状态文本
  const getStatusText = (status: number) => {
    return status === 0 ? '正常' : '异常';
  };

  // 操作人类型文本
  const getOperatorTypeText = (type: number) => {
    const typeMap: Record<number, string> = {
      0: '其他',
      1: '后台用户',
      2: '手机端用户',
    };
    return typeMap[type] || '未知';
  };

  const columns: ProColumns<OperLog>[] = [
    {
      title: '日志编号',
      dataIndex: 'id',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '操作模块',
      dataIndex: 'title',
      width: 150,
    },
    {
      title: '操作类型',
      dataIndex: 'businessType',
      width: 100,
      valueType: 'select',
      valueEnum: {
        0: { text: '其他', status: 'Default' },
        1: { text: '新增', status: 'Success' },
        2: { text: '修改', status: 'Warning' },
        3: { text: '删除', status: 'Error' },
        4: { text: '授权', status: 'Processing' },
        5: { text: '导出', status: 'Default' },
        6: { text: '导入', status: 'Default' },
        7: { text: '强退', status: 'Error' },
        8: { text: '生成代码', status: 'Processing' },
        9: { text: '清空数据', status: 'Error' },
      },
      render: (_, record) => getBusinessTypeText(record.businessType),
    },
    {
      title: '操作人员',
      dataIndex: 'operName',
      width: 120,
    },
    {
      title: '部门名称',
      dataIndex: 'deptName',
      width: 120,
      hideInSearch: true,
    },
    {
      title: '操作地址',
      dataIndex: 'operUrl',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '主机',
      dataIndex: 'operIp',
      width: 130,
      hideInSearch: true,
    },
    {
      title: '操作状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        0: { text: '正常', status: 'Success' },
        1: { text: '异常', status: 'Error' },
      },
      render: (_, record) => getStatusText(record.status),
    },
    {
      title: '耗时(ms)',
      dataIndex: 'costTime',
      width: 100,
      hideInSearch: true,
      render: (_, record) => `${record.costTime}ms`,
    },
    {
      title: '操作时间',
      dataIndex: 'operTime',
      width: 160,
      valueType: 'dateTime',
      render: (_, record) =>
        dayjs(record.operTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_: any, record: any) => [
        <PermissionButton
          key="view"
          type="link"
          size="small"
          permission={SYSTEM.LOG.OPERLOG.QUERY}
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </PermissionButton>,
      ],
    },
  ];

  return (
    <>
      <ProTable
        ref={tableRef}
        api="/log/operlog"
        columns={columns}
        rowKey="id"
        scroll={{ x: 1400 }}
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

      {/* 详情弹窗 */}
      {detailOpen && detailRecord && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDetailOpen(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>操作日志详情</h2>
            <div style={{ marginTop: '16px' }}>
              <p>
                <strong>日志编号:</strong> {detailRecord.id}
              </p>
              <p>
                <strong>操作模块:</strong> {detailRecord.title || '-'}
              </p>
              <p>
                <strong>操作类型:</strong>{' '}
                {getBusinessTypeText(detailRecord.businessType)}
              </p>
              <p>
                <strong>操作人员:</strong> {detailRecord.operName || '-'}
              </p>
              <p>
                <strong>部门名称:</strong> {detailRecord.deptName || '-'}
              </p>
              <p>
                <strong>请求地址:</strong> {detailRecord.operUrl || '-'}
              </p>
              <p>
                <strong>请求方法:</strong> {detailRecord.requestMethod || '-'}
              </p>
              <p>
                <strong>操作方法:</strong> {detailRecord.method || '-'}
              </p>
              <p>
                <strong>主机地址:</strong> {detailRecord.operIp || '-'}
              </p>
              <p>
                <strong>操作地点:</strong> {detailRecord.operLocation || '-'}
              </p>
              <p>
                <strong>操作人类型:</strong>{' '}
                {getOperatorTypeText(detailRecord.operatorType)}
              </p>
              <p>
                <strong>操作状态:</strong> {getStatusText(detailRecord.status)}
              </p>
              <p>
                <strong>耗时:</strong> {detailRecord.costTime}ms
              </p>
              <p>
                <strong>操作时间:</strong>{' '}
                {dayjs(detailRecord.operTime).format('YYYY-MM-DD HH:mm:ss')}
              </p>
              {detailRecord.operParam && (
                <p>
                  <strong>请求参数:</strong>
                </p>
              )}
              {detailRecord.operParam && (
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(JSON.parse(detailRecord.operParam), null, 2)}
                </pre>
              )}
              {detailRecord.jsonResult && (
                <p>
                  <strong>返回结果:</strong>
                </p>
              )}
              {detailRecord.jsonResult && (
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(JSON.parse(detailRecord.jsonResult), null, 2)}
                </pre>
              )}
              {detailRecord.errorMsg && (
                <p>
                  <strong>错误消息:</strong>
                </p>
              )}
              {detailRecord.errorMsg && (
                <pre
                  style={{
                    background: '#fff2e8',
                    padding: '12px',
                    borderRadius: '4px',
                    color: '#ff4d4f',
                    overflow: 'auto',
                  }}
                >
                  {detailRecord.errorMsg}
                </pre>
              )}
            </div>
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <Button type="primary" onClick={() => setDetailOpen(false)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OperLogList;
