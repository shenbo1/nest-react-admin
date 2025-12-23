import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateNoticeDto {
  @ApiProperty({ description: '公告标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '公告类型' })
  @IsString()
  noticeType: string;

  @ApiProperty({ description: '公告内容', required: false })
  @IsString()
  @IsOptional()
  noticeContent?: string;

  @ApiProperty({ description: '公告状态', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsString()
  @IsOptional()
  remark?: string;
}
