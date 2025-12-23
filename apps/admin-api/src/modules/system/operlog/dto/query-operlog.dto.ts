import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dto';

export class QueryOperLogDto extends PaginationDto {
  @ApiPropertyOptional({ description: '操作人员' })
  @IsOptional()
  @IsString()
  operName?: string;

  @ApiPropertyOptional({ description: '操作类型' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  businessType?: number;

  @ApiPropertyOptional({ description: '状态（0正常 1异常）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsString()
  beginTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsString()
  endTime?: string;
}
