import { Module } from '@nestjs/common';
import { GroupBuyOrderController } from './group-buy-order.controller';
import { GroupBuyOrderService } from './group-buy-order.service';

@Module({
  controllers: [GroupBuyOrderController],
  providers: [GroupBuyOrderService],
  exports: [GroupBuyOrderService],
})
export class GroupBuyOrderModule {}
