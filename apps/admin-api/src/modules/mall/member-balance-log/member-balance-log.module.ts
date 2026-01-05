import { Module } from '@nestjs/common';
import { MemberBalanceLogController } from './member-balance-log.controller';
import { MemberBalanceLogService } from './member-balance-log.service';

@Module({
  controllers: [MemberBalanceLogController],
  providers: [MemberBalanceLogService],
  exports: [MemberBalanceLogService],
})
export class MemberBalanceLogModule {}
