import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto';

export class QueryJobLogDto extends PaginationDto {
  @ApiPropertyOptional({ description: '执行状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '触发方式' })
  @IsOptional()
  @IsString()
  trigger?: string;
}
