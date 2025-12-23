import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Card, Row, Col, Statistic, Tooltip } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';

import * as echarts from 'echarts';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, SystemMetrics } from '@/services/system/dashboard';
import { io } from 'socket.io-client';

// 图表类型定义
interface GaugeChartOption {
  title: string;
  value: number;
  formatter?: string;
  progressColor?: [string, string];
  trackColor?: string;
}


const formatValueText = (value: number, formatter: string) => {
  if (!formatter) return String(value);
  return formatter.includes('{value}')
    ? formatter.replace('{value}', String(value))
    : formatter;
};

const getThresholdGradient = (value: number, base: [string, string]) => {
  if (value >= 80) return ['#F97316', '#DC2626'] as [string, string];
  if (value >= 60) return ['#FBBF24', '#D97706'] as [string, string];
  return base;
};

// 生成通用的环形进度配置
const createGaugeOption = (config: GaugeChartOption): echarts.EChartsOption => {
  const {
    title,
    value,
    formatter = '{value}%',
    progressColor = ['#3B82F6', '#1D4ED8'],
    trackColor = '#E9EEF6',
  } = config;

  const displayValue = formatValueText(value, formatter);
  const gradient = getThresholdGradient(value, progressColor);

  return {
    series: [
      {
        type: 'pie',
        radius: ['64%', '76%'],
        center: ['50%', '52%'],
        startAngle: 90,
        clockwise: true,
        avoidLabelOverlap: true,
        animation: false,
        label: {
          show: false,
        },
        data: [
          {
            value,
            name: 'value',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: gradient[0] },
                { offset: 1, color: gradient[1] },
              ]),
              shadowBlur: 0,
              shadowColor: 'transparent',
            },
          },
          {
            value: Math.max(0, 100 - value),
            name: 'track',
            itemStyle: {
              color: trackColor,
            },
          },
        ],
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '40%',
        style: {
          text: displayValue,
          fontSize: 26,
          fontWeight: 600,
          fill: '#111827',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '58%',
        style: {
          text: title,
          fontSize: 12,
          fill: '#64748B',
        },
      },
    ],
  };
};

// 自定义hook管理图表生命周期
const useGaugeChart = (
  ref: React.RefObject<HTMLDivElement | null>,
  config: Omit<GaugeChartOption, 'value'>
) => {
  const chartRef = useRef<echarts.ECharts | null>(null);

  // 初始化图表
  useEffect(() => {
    if (!ref.current) return;

    const chart = echarts.init(ref.current);
    chartRef.current = chart;

    const option = createGaugeOption({
      ...config,
      value: 0,
    });

    chart.setOption(option);

    // 添加窗口大小变化监听
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, [ref, config]);

  // 更新图表数据
  const updateChart = useCallback((value: number) => {
    if (!chartRef.current) return;

    chartRef.current.setOption(createGaugeOption({ ...config, value }));
  }, [config]);

  // 调整图表大小
  const resizeChart = useCallback(() => {
    if (!chartRef.current) return;
    chartRef.current.resize();
  }, []);

  return {
    updateChart,
    resizeChart,
  };
};

const SystemMetricsComponent: React.FC = () => {
  // 用于实时指标更新的socket连接
  const socketRef = useRef<any>(null);

  // 系统指标数据
  const { data: initialMetrics } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: dashboardApi.getSystemMetrics,
  });

  const [metrics, setMetrics] = useState<SystemMetrics | null>(
    initialMetrics || null
  );

  // 图表refs
  const cpuChartRef = useRef<HTMLDivElement>(null);
  const memoryChartRef = useRef<HTMLDivElement>(null);
  const diskChartRef = useRef<HTMLDivElement>(null);

  // 使用自定义hook管理图表
  const cpuConfig = useMemo(() => ({
    title: 'CPU使用率',
    progressColor: ['#38BDF8', '#2563EB'] as [string, string],
  }), []);
  const memoryConfig = useMemo(() => ({
    title: '内存使用率',
    progressColor: ['#34D399', '#059669'] as [string, string],
  }), []);
  const diskConfig = useMemo(() => ({
    title: '磁盘使用率',
    progressColor: ['#FBBF24', '#D97706'] as [string, string],
  }), []);

  const cpuChart = useGaugeChart(cpuChartRef, cpuConfig);
  const memoryChart = useGaugeChart(memoryChartRef, memoryConfig);
  const diskChart = useGaugeChart(diskChartRef, diskConfig);

  // 格式化字节数
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 更新图表数据
  useEffect(() => {
    if (metrics) {
      const cpuUsage = Math.round(metrics.cpu.usage * 100);
      const memoryUsage = Math.round(metrics.memory.usage);
      const diskUsage = Math.round(metrics.disk.usage);

      cpuChart.updateChart(cpuUsage);
      memoryChart.updateChart(memoryUsage);
      diskChart.updateChart(diskUsage);
    }
  }, [metrics, cpuChart, memoryChart, diskChart]);

  // Socket.IO 实时连接
  useEffect(() => {
    // 建立Socket.IO连接
    socketRef.current = io('http://localhost:8080');

    // 监听系统指标更新
    socketRef.current.on('systemMetricsUpdate', (data: SystemMetrics) => {
      setMetrics(data);
    });

    // 清理函数
    return () => {
      socketRef.current.close();
    };
  }, []);

  return (
    <div style={{ marginBottom: 24 }}>
      {/* 实时监控卡片 */}
      <Card title="实时系统监控">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="CPU使用率"
                value={metrics ? (metrics.cpu.usage * 100).toFixed(1) : 0}
                suffix="%"
                prefix={<ThunderboltOutlined />}
              />
              <div
                ref={cpuChartRef}
                style={{
                  height: 150,
                  marginTop: 16,
                  background: '#FFFFFF',
                  borderRadius: 12,
                  padding: 8,
                  border: '1px solid #E2E8F0',
                }}
              ></div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="内存使用率"
                value={metrics ? metrics.memory.usage.toFixed(1) : 0}
                suffix="%"
              />
              <Tooltip
                title={`已用: ${metrics ? formatBytes(metrics.memory.used) : '0 KB'} / ${metrics ? formatBytes(metrics.memory.total) : '0 KB'}`}
              >
                <div
                  ref={memoryChartRef}
                  style={{
                    height: 150,
                    marginTop: 16,
                    background: '#FFFFFF',
                    borderRadius: 12,
                    padding: 8,
                    border: '1px solid #E2E8F0',
                  }}
                ></div>
              </Tooltip>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="磁盘使用率"
                value={metrics ? metrics.disk.usage.toFixed(1) : 0}
                suffix="%"
                // prefix={<CloudOutlined />}
              />
              <Tooltip
                title={`已用: ${metrics ? formatBytes(metrics.disk.used) : '0 KB'} / ${metrics ? formatBytes(metrics.disk.total) : '0 KB'}`}
              >
                <div
                  ref={diskChartRef}
                  style={{
                    height: 150,
                    marginTop: 16,
                    background: '#FFFFFF',
                    borderRadius: 12,
                    padding: 8,
                    border: '1px solid #E2E8F0',
                  }}
                ></div>
              </Tooltip>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="运行时间"
                value={metrics ? Math.floor(metrics.process.uptime / 3600) : 0}
                suffix="小时"
                prefix={<ThunderboltOutlined />}
              />
              <div
                style={{
                  height: 150,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 16,
                  background: '#FFFFFF',
                  borderRadius: 12,
                  padding: 8,
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: '#1890ff',
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                }}>
                  {metrics ?
                    `${Math.floor(metrics.process.uptime / 3600).toString().padStart(2, '0')}:` +
                    `${Math.floor((metrics.process.uptime % 3600) / 60).toString().padStart(2, '0')}:` +
                    `${Math.floor(metrics.process.uptime % 60).toString().padStart(2, '0')}`
                    : '00:00:00'
                  }
                </div>
                <p style={{ color: '#666', marginTop: 8 }}>运行时间 (HH:MM:SS)</p>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default SystemMetricsComponent;
