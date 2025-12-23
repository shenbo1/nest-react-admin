import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto';

export class QueryLoginLogDto extends PaginationDto {
  @ApiPropertyOptional({ description: '用户名称' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: '登录状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsString()
  beginTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsString()
  endTime?: string;
}
