import { Module } from '@nestjs/common';
import { ProductSpecValueController } from './product-spec-value.controller';
import { ProductSpecValueService } from './product-spec-value.service';

@Module({
  controllers: [ProductSpecValueController],
  providers: [ProductSpecValueService],
  exports: [ProductSpecValueService],
})
export class ProductSpecValueModule {}
