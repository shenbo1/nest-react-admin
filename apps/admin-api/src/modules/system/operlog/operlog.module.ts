import { Module } from '@nestjs/common';
import { OperLogService } from './operlog.service';
import { OperLogController } from './operlog.controller';

@Module({
  controllers: [OperLogController],
  providers: [OperLogService],
})
export class OperLogModule {}
