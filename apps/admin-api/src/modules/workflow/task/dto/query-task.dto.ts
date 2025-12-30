import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { WfTaskStatus, WfTaskResult } from '@prisma/client';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class QueryTaskDto extends PaginationDto {
  @ApiPropertyOptional({ description: '任务编号' })
  @IsString()
  @IsOptional()
  taskNo?: string;

  @ApiPropertyOptional({ description: '节点名称' })
  @IsString()
  @IsOptional()
  nodeName?: string;

  @ApiPropertyOptional({ description: '流程实例ID' })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  flowInstanceId?: number;

  @ApiPropertyOptional({
    description: '状态',
    enum: WfTaskStatus,
  })
  @IsEnum(WfTaskStatus)
  @IsOptional()
  status?: WfTaskStatus;

  @ApiPropertyOptional({
    description: '结果',
    enum: WfTaskResult,
  })
  @IsEnum(WfTaskResult)
  @IsOptional()
  result?: WfTaskResult;
}
