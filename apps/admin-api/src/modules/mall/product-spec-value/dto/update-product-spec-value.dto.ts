import { PartialType } from 'nestjs-mapped-types';
import { CreateProductSpecValueDto } from './create-product-spec-value.dto';

export class UpdateProductSpecValueDto extends PartialType(CreateProductSpecValueDto) {}
