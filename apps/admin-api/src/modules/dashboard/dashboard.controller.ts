import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SystemMetricsService } from './system-metrics.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private systemMetricsService: SystemMetricsService,
  ) {}

  @Get('statistics')
  async getStatistics() {
    return this.dashboardService.getStatistics();
  }

  @Get('recent-logins')
  async getRecentLoginLogs() {
    return this.dashboardService.getRecentLoginLogs();
  }

  @Get('system-metrics')
  async getSystemMetrics() {
    return this.systemMetricsService.getSystemMetrics();
  }
}
