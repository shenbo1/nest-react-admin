import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateCodeDto {
  @ApiProperty({ description: '模块名称（小写字母、数字、连字符）' })
  @IsString()
  @Matches(/^[a-z][a-z0-9-]*$/, {
    message: '模块名只能包含小写字母、数字和连字符，且必须以字母开头',
  })
  @MaxLength(50)
  moduleName: string;

  @ApiPropertyOptional({ description: '中文名称' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cnName?: string;

  @ApiPropertyOptional({ description: '菜单起始ID', default: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  menuId?: number;
}
