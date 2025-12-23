import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SystemMetricsService } from './system-metrics.service';
import { MetricsGateway } from './metrics.gateway';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, SystemMetricsService, MetricsGateway],
})
export class DashboardModule {}
