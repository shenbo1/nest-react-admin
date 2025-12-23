import { Module } from '@nestjs/common';
import { ProductSpecGroupController } from './product-spec-group.controller';
import { ProductSpecGroupService } from './product-spec-group.service';

@Module({
  controllers: [ProductSpecGroupController],
  providers: [ProductSpecGroupService],
  exports: [ProductSpecGroupService],
})
export class ProductSpecGroupModule {}
