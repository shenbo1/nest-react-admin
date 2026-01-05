import { IsOptional, IsInt, IsDateString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySignInDto {
  @ApiPropertyOptional({ description: '会员ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  memberId?: number;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}