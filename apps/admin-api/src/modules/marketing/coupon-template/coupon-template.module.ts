import { Module } from '@nestjs/common';
import { CouponTemplateController } from './coupon-template.controller';
import { CouponTemplateService } from './coupon-template.service';

@Module({
  controllers: [CouponTemplateController],
  providers: [CouponTemplateService],
  exports: [CouponTemplateService],
})
export class CouponTemplateModule {}
