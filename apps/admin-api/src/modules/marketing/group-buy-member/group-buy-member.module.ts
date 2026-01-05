import { Module } from '@nestjs/common';
import { GroupBuyMemberController } from './group-buy-member.controller';
import { GroupBuyMemberService } from './group-buy-member.service';

@Module({
  controllers: [GroupBuyMemberController],
  providers: [GroupBuyMemberService],
  exports: [GroupBuyMemberService],
})
export class GroupBuyMemberModule {}
