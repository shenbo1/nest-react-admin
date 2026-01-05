import { useRef, useState } from 'react';
import { Card, Statistic, Row, Col, Tag, DatePicker } from 'antd';
import { CalendarOutlined, TrophyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ProTable, { ProTableRef } from '@/components/ProTable';
import type { ProColumns } from '@ant-design/pro-components';
import { signInApi, MemberSignIn } from '@/services/marketing/sign-in';

const { RangePicker } = DatePicker;
// const { Option } = Select; // 未使用的变量

const SignInList: React.FC = () => {
  const tableRef = useRef<ProTableRef>(null);
  const [startDate, setStartDate] = useState<string>(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format('YYYY-MM'));

  // 表格列
  const columns: ProColumns<MemberSignIn>[] = [
    {
      title: '会员ID',
      dataIndex: 'memberId',
      width: 100,
    },
    {
      title: '会员信息',
      dataIndex: ['member', 'username'],
      width: 120,
      render: (_: any, record: MemberSignIn) => (
        <div>
          <div>{record.member?.realName || record.member?.username}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.member?.username}
          </div>
        </div>
      ),
    },
    {
      title: '签到日期',
      dataIndex: 'signDate',
      width: 120,
      render: (_, record) => dayjs(record.signDate).format('YYYY-MM-DD'),
    },
    {
      title: '获得积分',
      dataIndex: 'points',
      width: 100,
      render: (_: any, record: MemberSignIn) => (
        <Tag color="gold">
          +{record.points}
        </Tag>
      ),
    },
    {
      title: '基础积分',
      dataIndex: 'basePoints',
      width: 100,
      render: (_, record) => <Tag>{record.basePoints}</Tag>,
    },
    {
      title: '奖励积分',
      dataIndex: 'bonusPoints',
      width: 100,
      render: (_: any, record: MemberSignIn) => (
        record.bonusPoints > 0 ? (
          <Tag color="orange">+{record.bonusPoints}</Tag>
        ) : '-'
      ),
    },
    {
      title: '连续签到',
      dataIndex: 'consecutiveDays',
      width: 100,
      render: (_: any, record: MemberSignIn) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
            {record.consecutiveDays}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>天</div>
        </div>
      ),
    },
    {
      title: '签到时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateTime',
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  // 获取数据
  const fetchData = async (params: any) => {
    const { current, pageSize, ...rest } = params;
    const result = await signInApi.list({
      page: current,
      pageSize,
      ...rest,
    });
    return {
      data: result.data,
      total: result.total,
      success: true,
    };
  };

  // TODO: 实现统计数据的展示
  // const getMonthlyStats = async () => {
  //   const [year, month] = selectedMonth.split('-').map(Number);
  //   return await signInApi.getMonthlyStats(year, month);
  // };
  // const getRanking = async () => {
  //   return await signInApi.getMemberRanking(10);
  // };
  // const getDateStats = async () => {
  //   const stats = await signInApi.getStatsByDate(startDate, endDate);
  //   return stats.map(item => ({
  //     ...item,
  //     date: dayjs(item.date).format('MM-DD'),
  //   }));
  // };
  // useEffect(() => {
  //   getMonthlyStats().then(setMonthlyStats);
  //   getRanking().then(setRanking);
  //   getDateStats().then(setDateStats);
  // }, [selectedMonth, startDate, endDate]);

  return (
    <>
      {/* 统计卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="本月签到人次"
              value={0}
              prefix={<CalendarOutlined />}
              loading={false}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="本月活跃会员"
              value={0}
              prefix={<TrophyOutlined />}
              loading={false}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="本月发放积分"
              value={0}
              suffix="分"
              loading={false}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均连续签到"
              value={0}
              suffix="天"
              loading={false}
            />
          </Col>
        </Row>
      </Card>

      {/* 查询条件 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>日期范围</div>
            <RangePicker
              defaultValue={[dayjs(startDate), dayjs(endDate)]}
              onChange={(dates) => {
                if (dates) {
                  setStartDate(dates[0]?.format('YYYY-MM-DD') || '');
                  setEndDate(dates[1]?.format('YYYY-MM-DD') || '');
                }
              }}
            />
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>月度统计</div>
            <DatePicker
              picker="month"
              defaultValue={dayjs(selectedMonth)}
              onChange={(date) => {
                if (date) {
                  setSelectedMonth(date.format('YYYY-MM'));
                }
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* 签到记录表格 */}
      <ProTable
        ref={tableRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1000 }}
        request={fetchData}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: true,
        }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }}
        options={{
          fullScreen: false,
          reload: true,
          setting: true,
          density: true,
        }}
      />
    </>
  );
};

export default SignInList;