import { Module } from '@nestjs/common';
import { MemberPointLogController } from './member-point-log.controller';
import { MemberPointLogService } from './member-point-log.service';

@Module({
  controllers: [MemberPointLogController],
  providers: [MemberPointLogService],
  exports: [MemberPointLogService],
})
export class MemberPointLogModule {}
