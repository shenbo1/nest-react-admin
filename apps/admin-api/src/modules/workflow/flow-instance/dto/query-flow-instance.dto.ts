import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { WfInstanceStatus } from '@prisma/client';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class QueryFlowInstanceDto extends PaginationDto {
  @ApiPropertyOptional({ description: '实例编号' })
  @IsString()
  @IsOptional()
  instanceNo?: string;

  @ApiPropertyOptional({ description: '流程标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '流程定义ID' })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  flowDefinitionId?: number;

  @ApiPropertyOptional({
    description: '状态',
    enum: WfInstanceStatus,
  })
  @IsEnum(WfInstanceStatus)
  @IsOptional()
  status?: WfInstanceStatus;

  @ApiPropertyOptional({ description: '发起人ID' })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  initiatorId?: number;

  @ApiPropertyOptional({ description: '关联业务ID' })
  @IsString()
  @IsOptional()
  businessId?: string;
}
