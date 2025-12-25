import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto';

export class QueryJobDto extends PaginationDto {
  @ApiPropertyOptional({ description: '任务名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '处理器标识' })
  @IsOptional()
  @IsString()
  handler?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string;
}
