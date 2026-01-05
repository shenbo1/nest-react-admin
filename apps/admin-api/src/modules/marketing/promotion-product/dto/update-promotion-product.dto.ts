import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePromotionProductDto } from './create-promotion-product.dto';

export class UpdatePromotionProductDto extends PartialType(
  OmitType(CreatePromotionProductDto, ['promotionId', 'productId', 'skuId'] as const)
) {}
