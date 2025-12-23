import { Module } from '@nestjs/common';
import { LoginLogService } from './loginlog.service';
import { LoginLogController } from './loginlog.controller';

@Module({
  controllers: [LoginLogController],
  providers: [LoginLogService],
})
export class LoginLogModule {}
