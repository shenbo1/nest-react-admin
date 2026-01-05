import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPromotionProductDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  promotionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  productId?: number;

  @IsOptional()
  @IsEnum(['ENABLED', 'DISABLED'])
  status?: 'ENABLED' | 'DISABLED';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
