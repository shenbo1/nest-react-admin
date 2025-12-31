import { PartialType } from '@nestjs/swagger';
import { CreateProductSpecGroupDto } from './create-product-spec-group.dto';

export class UpdateProductSpecGroupDto extends PartialType(
  CreateProductSpecGroupDto,
) {}
