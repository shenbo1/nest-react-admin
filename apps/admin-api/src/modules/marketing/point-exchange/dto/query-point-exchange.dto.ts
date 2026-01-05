import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPointExchangeDto {
  @IsOptional()
  @IsString()
  exchangeNo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  memberId?: number;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsEnum(['PHYSICAL', 'VIRTUAL', 'COUPON'])
  productType?: 'PHYSICAL' | 'VIRTUAL' | 'COUPON';

  @IsOptional()
  @IsEnum(['PENDING', 'SHIPPED', 'COMPLETED', 'CANCELLED'])
  status?: 'PENDING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

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
