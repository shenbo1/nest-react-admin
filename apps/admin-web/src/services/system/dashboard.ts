import request from '@/utils/request';

export interface Statistics {
  userCount: number;
  roleCount: number;
  menuCount: number;
  deptCount: number;
  loginLogCount: number;
  todayLoginCount: number;
}

export interface LoginLog {
  id: number;
  username: string;
  ip: string;
  location: string;
  browser: string;
  os: string;
  status: string;
  msg: string;
  loginTime: string;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadavg: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usage: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usage: number;
  };
  network: any;
  process: {
    cpuUsage: {
      user: number;
      system: number;
    };
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    uptime: number;
  };
}

export const dashboardApi = {
  getStatistics: () => request.get<Statistics>('/dashboard/statistics'),
  getRecentLogins: () => request.get<LoginLog[]>('/dashboard/recent-logins'),
  getSystemMetrics: () => request.get<SystemMetrics>('/dashboard/system-metrics'),
};
