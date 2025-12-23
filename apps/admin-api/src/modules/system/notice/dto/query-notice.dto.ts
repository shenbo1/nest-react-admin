import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto';

export class QueryNoticeDto extends PaginationDto {
  @ApiPropertyOptional({ description: '公告标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '公告类型' })
  @IsOptional()
  @IsString()
  noticeType?: string;

  @ApiPropertyOptional({ description: '公告状态' })
  @IsOptional()
  @IsString()
  status?: string;
}
