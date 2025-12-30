import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { WfCategoryStatus } from '@prisma/client';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class QueryCategoryDto extends PaginationDto {
  @ApiPropertyOptional({ description: '分类编码' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: '分类名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '父分类ID（查询子分类）' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  parentId?: number;

  @ApiPropertyOptional({
    description: '状态',
    enum: WfCategoryStatus,
  })
  @IsEnum(WfCategoryStatus)
  @IsOptional()
  status?: WfCategoryStatus;
}
