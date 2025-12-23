import { Injectable } from '@nestjs/common';
import * as osUtils from 'os-utils';
import * as diskusage from 'diskusage';
import * as os from 'os';

@Injectable()
export class SystemMetricsService {
  async getSystemMetrics() {
    const [cpuUsage, diskInfo] = await Promise.all([
      this.getCpuUsage(),
      this.getDiskInfo(),
    ]);

    return {
      cpu: {
        usage: cpuUsage,
        loadavg: os.loadavg(),
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      disk: diskInfo,
      network: this.getNetworkInfo(),
      process: this.getProcessInfo(),
    };
  }

  private getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      osUtils.cpuUsage(resolve);
    });
  }

  private async getDiskInfo() {
    const diskStats = await diskusage.check('/');
    const used = diskStats.total - diskStats.free;
    return {
      total: diskStats.total,
      free: diskStats.free,
      used,
      usage: (used / diskStats.total) * 100,
    };
  }

  private getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    return interfaces;
  }

  private getProcessInfo() {
    return {
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }
}
