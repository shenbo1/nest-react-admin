import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  MaxLength,
  IsNotEmpty,
  Min,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WfCategoryStatus } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类编码' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: '分类名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '父分类ID' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  parentId?: number;

  @ApiPropertyOptional({ description: '分类图标' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string;

  @ApiPropertyOptional({ description: '分类颜色' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({ description: '排序号', default: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  sort?: number;

  @ApiPropertyOptional({
    description: '状态',
    enum: WfCategoryStatus,
    default: WfCategoryStatus.ENABLED,
  })
  @IsEnum(WfCategoryStatus)
  @IsOptional()
  status?: WfCategoryStatus;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  remark?: string;
}
