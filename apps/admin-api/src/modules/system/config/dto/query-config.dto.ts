import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto';

export class QueryConfigDto extends PaginationDto {
  @ApiPropertyOptional({ description: '配置名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '配置键名' })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional({ description: '配置类型' })
  @IsOptional()
  @IsString()
  configType?: string;
}
