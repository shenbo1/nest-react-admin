import { Module } from '@nestjs/common';
import { PromotionProductController } from './promotion-product.controller';
import { PromotionProductService } from './promotion-product.service';

@Module({
  controllers: [PromotionProductController],
  providers: [PromotionProductService],
  exports: [PromotionProductService],
})
export class PromotionProductModule {}
