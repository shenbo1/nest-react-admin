import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface LogStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface LogTrend {
  date: string;
  count: number;
}

@Injectable()
export class LogMonitorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取日志统计概览
   */
  async getLogOverview() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [loginLogStats, operLogStats] = await Promise.all([
      this.getLoginLogStats(todayStart, weekStart, monthStart),
      this.getOperLogStats(todayStart, weekStart, monthStart),
    ]);

    return {
      loginLog: loginLogStats,
      operLog: operLogStats,
    };
  }

  /**
   * 获取登录日志统计
   */
  private async getLoginLogStats(
    todayStart: Date,
    weekStart: Date,
    monthStart: Date,
  ): Promise<LogStats> {
    const [total, today, thisWeek, thisMonth] = await Promise.all([
      this.prisma.sysLoginLog.count(),
      this.prisma.sysLoginLog.count({
        where: { loginTime: { gte: todayStart } },
      }),
      this.prisma.sysLoginLog.count({
        where: { loginTime: { gte: weekStart } },
      }),
      this.prisma.sysLoginLog.count({
        where: { loginTime: { gte: monthStart } },
      }),
    ]);

    return { total, today, thisWeek, thisMonth };
  }

  /**
   * 获取操作日志统计
   */
  private async getOperLogStats(
    todayStart: Date,
    weekStart: Date,
    monthStart: Date,
  ): Promise<LogStats> {
    const [total, today, thisWeek, thisMonth] = await Promise.all([
      this.prisma.sysOperLog.count(),
      this.prisma.sysOperLog.count({
        where: { operTime: { gte: todayStart } },
      }),
      this.prisma.sysOperLog.count({
        where: { operTime: { gte: weekStart } },
      }),
      this.prisma.sysOperLog.count({
        where: { operTime: { gte: monthStart } },
      }),
    ]);

    return { total, today, thisWeek, thisMonth };
  }

  /**
   * 获取登录日志趋势（最近30天）
   */
  async getLoginLogTrend(): Promise<LogTrend[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT
        DATE(login_time) as date,
        COUNT(*) as count
      FROM sys_login_log
      WHERE login_time >= ${thirtyDaysAgo}
      GROUP BY DATE(login_time)
      ORDER BY date ASC
    `;

    return logs.map((log) => ({
      date: log.date,
      count: Number(log.count),
    }));
  }

  /**
   * 获取操作日志趋势（最近30天）
   */
  async getOperLogTrend(): Promise<LogTrend[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT
        DATE(oper_time) as date,
        COUNT(*) as count
      FROM sys_oper_log
      WHERE oper_time >= ${thirtyDaysAgo}
      GROUP BY DATE(oper_time)
      ORDER BY date ASC
    `;

    return logs.map((log) => ({
      date: log.date,
      count: Number(log.count),
    }));
  }

  /**
   * 获取登录状态分布
   */
  async getLoginStatusDistribution() {
    const distribution = await this.prisma.$queryRaw<
      { status: string; count: bigint }[]
    >`
      SELECT status, COUNT(*) as count
      FROM sys_login_log
      GROUP BY status
    `;

    return distribution.map((d) => ({
      status: d.status === '0' ? '成功' : '失败',
      statusCode: d.status,
      count: Number(d.count),
    }));
  }

  /**
   * 获取操作类型分布
   */
  async getOperTypeDistribution() {
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

    const distribution = await this.prisma.$queryRaw<
      { business_type: number; count: bigint }[]
    >`
      SELECT business_type, COUNT(*) as count
      FROM sys_oper_log
      GROUP BY business_type
      ORDER BY count DESC
    `;

    return distribution.map((d) => ({
      type: typeMap[d.business_type] || '其他',
      typeCode: d.business_type,
      count: Number(d.count),
    }));
  }

  /**
   * 获取操作状态分布
   */
  async getOperStatusDistribution() {
    const distribution = await this.prisma.$queryRaw<
      { status: number; count: bigint }[]
    >`
      SELECT status, COUNT(*) as count
      FROM sys_oper_log
      GROUP BY status
    `;

    return distribution.map((d) => ({
      status: d.status === 1 ? '成功' : '失败',
      statusCode: d.status,
      count: Number(d.count),
    }));
  }

  /**
   * 获取登录地点分布（Top 10）
   */
  async getLoginLocationDistribution() {
    const distribution = await this.prisma.$queryRaw<
      { location: string; count: bigint }[]
    >`
      SELECT COALESCE(location, 'Unknown') as location, COUNT(*) as count
      FROM sys_login_log
      WHERE location IS NOT NULL AND location != ''
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    `;

    return distribution.map((d) => ({
      location: d.location,
      count: Number(d.count),
    }));
  }

  /**
   * 获取浏览器分布
   */
  async getBrowserDistribution() {
    const distribution = await this.prisma.$queryRaw<
      { browser: string; count: bigint }[]
    >`
      SELECT COALESCE(browser, 'Unknown') as browser, COUNT(*) as count
      FROM sys_login_log
      WHERE browser IS NOT NULL AND browser != ''
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 10
    `;

    return distribution.map((d) => ({
      browser: d.browser,
      count: Number(d.count),
    }));
  }

  /**
   * 获取操作系统分布
   */
  async getOsDistribution() {
    const distribution = await this.prisma.$queryRaw<
      { os: string; count: bigint }[]
    >`
      SELECT COALESCE(os, 'Unknown') as os, COUNT(*) as count
      FROM sys_login_log
      WHERE os IS NOT NULL AND os != ''
      GROUP BY os
      ORDER BY count DESC
      LIMIT 10
    `;

    return distribution.map((d) => ({
      os: d.os,
      count: Number(d.count),
    }));
  }

  /**
   * 获取操作用户排行（Top 10）
   */
  async getTopOperators() {
    const operators = await this.prisma.$queryRaw<
      { oper_name: string; count: bigint }[]
    >`
      SELECT oper_name, COUNT(*) as count
      FROM sys_oper_log
      WHERE oper_name IS NOT NULL AND oper_name != ''
      GROUP BY oper_name
      ORDER BY count DESC
      LIMIT 10
    `;

    return operators.map((o) => ({
      username: o.oper_name,
      count: Number(o.count),
    }));
  }

  /**
   * 获取最近的错误日志
   */
  async getRecentErrors(limit = 50) {
    const operErrors = await this.prisma.sysOperLog.findMany({
      where: { status: 0 },
      orderBy: { operTime: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        operName: true,
        operUrl: true,
        errorMsg: true,
        operTime: true,
      },
    });

    const loginErrors = await this.prisma.sysLoginLog.findMany({
      where: { status: '1' },
      orderBy: { loginTime: 'desc' },
      take: limit,
      select: {
        id: true,
        username: true,
        ipaddr: true,
        location: true,
        msg: true,
        loginTime: true,
      },
    });

    return {
      operErrors,
      loginErrors,
    };
  }

  /**
   * 清理过期日志
   */
  async cleanupLogs(daysToKeep: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const [deletedLoginLogs, deletedOperLogs] = await Promise.all([
      this.prisma.sysLoginLog.deleteMany({
        where: { loginTime: { lt: cutoffDate } },
      }),
      this.prisma.sysOperLog.deleteMany({
        where: { operTime: { lt: cutoffDate } },
      }),
    ]);

    return {
      deletedLoginLogs: deletedLoginLogs.count,
      deletedOperLogs: deletedOperLogs.count,
      cutoffDate,
    };
  }
}
