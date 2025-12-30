import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { WfFlowStatus } from '@prisma/client';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class QueryFlowDefinitionDto extends PaginationDto {
  @ApiPropertyOptional({ description: '流程编码' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: '流程名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '流程分类ID' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({
    description: '状态',
    enum: WfFlowStatus,
  })
  @IsEnum(WfFlowStatus)
  @IsOptional()
  status?: WfFlowStatus;
}
