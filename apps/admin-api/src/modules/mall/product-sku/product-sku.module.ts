import { Module } from '@nestjs/common';
import { ProductSkuController } from './product-sku.controller';
import { ProductSkuService } from './product-sku.service';

@Module({
  controllers: [ProductSkuController],
  providers: [ProductSkuService],
  exports: [ProductSkuService],
})
export class ProductSkuModule {}
