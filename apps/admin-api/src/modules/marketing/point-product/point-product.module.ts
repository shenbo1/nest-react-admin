import { Module } from '@nestjs/common';
import { PointProductController } from './point-product.controller';
import { PointProductService } from './point-product.service';

@Module({
  controllers: [PointProductController],
  providers: [PointProductService],
  exports: [PointProductService],
})
export class PointProductModule {}
