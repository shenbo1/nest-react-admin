import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Status, DataScope } from '@prisma/client';
import { PaginationDto } from '@/common/dto';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @IsString()
  @MaxLength(30)
  name: string;

  @ApiProperty({ description: '角色标识' })
  @IsNotEmpty({ message: '角色标识不能为空' })
  @IsString()
  @MaxLength(100)
  key: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ description: '数据权限', enum: DataScope })
  @IsOptional()
  @IsEnum(DataScope)
  dataScope?: DataScope;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({ description: '菜单ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  menuIds?: number[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class QueryRoleDto extends PaginationDto {
  @ApiPropertyOptional({ description: '角色名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '角色标识' })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
