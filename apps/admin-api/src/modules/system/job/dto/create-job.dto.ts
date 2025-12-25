import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject, IsEnum, IsIn } from 'class-validator';
import { Status, JobType } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({ description: '任务名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '任务类型', required: false })
  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @ApiProperty({ description: '处理器标识' })
  @IsString()
  handler: string;

  @ApiProperty({ description: 'HTTP 请求方法', required: false })
  @IsOptional()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  httpMethod?: string;

  @ApiProperty({ description: 'HTTP 请求地址', required: false })
  @IsOptional()
  @IsString()
  httpUrl?: string;

  @ApiProperty({ description: 'HTTP 请求头', required: false })
  @IsOptional()
  @IsObject()
  httpHeaders?: Record<string, any>;

  @ApiProperty({ description: 'Cron 表达式' })
  @IsString()
  cron: string;

  @ApiProperty({ description: '任务参数', required: false })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
