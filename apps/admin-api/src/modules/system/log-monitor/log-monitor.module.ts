import { Module } from '@nestjs/common';
import { LogMonitorController } from './log-monitor.controller';
import { LogMonitorService } from './log-monitor.service';

@Module({
  controllers: [LogMonitorController],
  providers: [LogMonitorService],
  exports: [LogMonitorService],
})
export class LogMonitorModule {}
