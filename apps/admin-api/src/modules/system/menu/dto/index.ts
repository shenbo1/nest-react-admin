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
import { Status, MenuType } from '@prisma/client';

export class CreateMenuDto {
  @ApiProperty({ description: '菜单名称' })
  @IsNotEmpty({ message: '菜单名称不能为空' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: '父菜单ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number = 0;

  @ApiProperty({ description: '菜单类型', enum: MenuType })
  @IsNotEmpty({ message: '菜单类型不能为空' })
  @IsEnum(MenuType)
  type: MenuType;

  @ApiPropertyOptional({ description: '路由路径' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  path?: string;

  @ApiPropertyOptional({ description: '组件路径' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  component?: string;

  @ApiPropertyOptional({ description: '权限标识' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  perms?: string;

  @ApiPropertyOptional({ description: '图标' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number = 0;

  @ApiPropertyOptional({ description: '是否显示' })
  @IsOptional()
  @IsBoolean()
  visible?: boolean = true;

  @ApiPropertyOptional({ description: '状态', enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status = Status.ENABLED;

  @ApiPropertyOptional({ description: '是否外链' })
  @IsOptional()
  @IsBoolean()
  isFrame?: boolean = false;

  @ApiPropertyOptional({ description: '是否缓存' })
  @IsOptional()
  @IsBoolean()
  isCache?: boolean = true;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}

export class UpdateMenuDto extends PartialType(CreateMenuDto) {}
