import {
  IsInt,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';

export class CreatePromotionProductDto {
  @IsInt()
  promotionId: number;

  @IsInt()
  productId: number;

  @IsOptional()
  @IsInt()
  skuId?: number;

  @IsNumber()
  @Min(0)
  originalPrice: number;

  @IsNumber()
  @Min(0)
  activityPrice: number;

  @IsInt()
  @Min(0)
  activityStock: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  limitCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @IsEnum(['ENABLED', 'DISABLED'])
  status?: 'ENABLED' | 'DISABLED';
}
