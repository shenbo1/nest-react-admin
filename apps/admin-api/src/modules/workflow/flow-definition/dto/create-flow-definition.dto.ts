import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsInt,
  MaxLength,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';

export class CreateFlowDefinitionDto {
  @ApiProperty({ description: '流程编码' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: '流程名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '流程分类ID' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @ApiPropertyOptional({ description: '流程图数据' })
  @IsObject()
  @IsOptional()
  flowData?: Prisma.InputJsonValue;

  @ApiPropertyOptional({ description: '表单配置（数组或对象）' })
  @ValidateIf((o) => o.formData !== undefined && o.formData !== null)
  @IsOptional()
  formData?: Prisma.InputJsonValue;

  @ApiPropertyOptional({ description: '关联业务表名' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  businessTable?: string;

  @ApiPropertyOptional({ description: '流程描述' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  remark?: string;
}
