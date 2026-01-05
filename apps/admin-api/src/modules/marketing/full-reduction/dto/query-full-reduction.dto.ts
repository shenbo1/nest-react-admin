import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryFullReductionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(['NOT_STARTED', 'RUNNING', 'ENDED', 'DISABLED'])
  status?: 'NOT_STARTED' | 'RUNNING' | 'ENDED' | 'DISABLED';

  @IsOptional()
  @IsEnum(['ALL', 'CATEGORY', 'PRODUCT'])
  scopeType?: 'ALL' | 'CATEGORY' | 'PRODUCT';

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
