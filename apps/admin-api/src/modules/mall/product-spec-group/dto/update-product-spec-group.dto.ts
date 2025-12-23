import { PartialType } from 'nestjs-mapped-types';
import { CreateProductSpecGroupDto } from './create-product-spec-group.dto';

export class UpdateProductSpecGroupDto extends PartialType(
  CreateProductSpecGroupDto,
) {}
