import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPromotionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(['FLASH_SALE', 'TIME_DISCOUNT', 'GROUP_BUY'])
  type?: 'FLASH_SALE' | 'TIME_DISCOUNT' | 'GROUP_BUY';

  @IsOptional()
  @IsEnum(['NOT_STARTED', 'RUNNING', 'ENDED', 'DISABLED'])
  status?: 'NOT_STARTED' | 'RUNNING' | 'ENDED' | 'DISABLED';

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
