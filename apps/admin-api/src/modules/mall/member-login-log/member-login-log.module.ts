import { Module } from '@nestjs/common';
import { MemberLoginLogController } from './member-login-log.controller';
import { MemberLoginLogService } from './member-login-log.service';

@Module({
  controllers: [MemberLoginLogController],
  providers: [MemberLoginLogService],
  exports: [MemberLoginLogService],
})
export class MemberLoginLogModule {}
