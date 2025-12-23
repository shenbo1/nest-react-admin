import { IsOptional, IsString, IsInt, IsEnum } from 'class-validator';
import { ProductStatus } from '@prisma/client';
import { PaginationDto } from '@/common/dto';

export class QueryProductDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  code?: string;
}
