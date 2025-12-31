import { PartialType } from '@nestjs/swagger';
import { CreateProductSpecValueDto } from './create-product-spec-value.dto';

export class UpdateProductSpecValueDto extends PartialType(CreateProductSpecValueDto) {}
