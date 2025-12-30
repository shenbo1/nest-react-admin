import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsInt,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Prisma } from '@prisma/client';

export class StartFlowDto {
  @ApiProperty({ description: '流程定义ID' })
  @IsInt()
  flowDefinitionId: number;

  @ApiProperty({ description: '流程标题' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: '表单数据' })
  @IsObject()
  @IsOptional()
  formData?: Prisma.InputJsonValue;

  @ApiPropertyOptional({ description: '关联业务ID' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  businessId?: string;

  @ApiPropertyOptional({ description: '关联业务编号' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  businessNo?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  remark?: string;
}
