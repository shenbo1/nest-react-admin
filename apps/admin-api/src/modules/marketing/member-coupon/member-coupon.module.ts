import { Module } from '@nestjs/common';
import { MemberCouponController } from './member-coupon.controller';
import { MemberCouponService } from './member-coupon.service';

@Module({
  controllers: [MemberCouponController],
  providers: [MemberCouponService],
  exports: [MemberCouponService],
})
export class MemberCouponModule {}
