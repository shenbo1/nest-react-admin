import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Status } from '@prisma/client';
import { PaginationDto } from '@/common/dto';

// ========== 字典类型 ==========
export class CreateDictTypeDto {
  @ApiProperty({ description: '字典名称' })
  @IsNotEmpty({ message: '字典名称不能为空' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '字典类型' })
  @IsNotEmpty({ message: '字典类型不能为空' })
  @IsString()
  @MaxLength(100)
  type: string;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status = Status.ENABLED;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}

export class UpdateDictTypeDto extends PartialType(CreateDictTypeDto) {}

export class QueryDictTypeDto extends PaginationDto {
  @ApiPropertyOptional({ description: '字典名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '字典类型' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}

// ========== 字典数据 ==========
export class CreateDictDataDto {
  @ApiProperty({ description: '字典类型' })
  @IsNotEmpty({ message: '字典类型不能为空' })
  @IsString()
  @MaxLength(100)
  dictType: string;

  @ApiProperty({ description: '字典标签' })
  @IsNotEmpty({ message: '字典标签不能为空' })
  @IsString()
  @MaxLength(100)
  label: string;

  @ApiProperty({ description: '字典值' })
  @IsNotEmpty({ message: '字典值不能为空' })
  @IsString()
  @MaxLength(100)
  value: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number = 0;

  @ApiPropertyOptional({ description: 'CSS类名' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cssClass?: string;

  @ApiPropertyOptional({ description: '列表样式类' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  listClass?: string;

  @ApiPropertyOptional({ description: '是否默认' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status = Status.ENABLED;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}

export class UpdateDictDataDto extends PartialType(CreateDictDataDto) {}

export class QueryDictDataDto extends PaginationDto {
  @ApiPropertyOptional({ description: '字典类型' })
  @IsOptional()
  @IsString()
  dictType?: string;

  @ApiPropertyOptional({ description: '字典标签' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
