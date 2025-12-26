import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiMonitorController } from './api-monitor.controller';
import { ApiMonitorService } from './api-monitor.service';
import { ApiMonitorInterceptor } from './api-monitor.interceptor';

@Module({
  controllers: [ApiMonitorController],
  providers: [
    ApiMonitorService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiMonitorInterceptor,
    },
  ],
  exports: [ApiMonitorService],
})
export class ApiMonitorModule {}
