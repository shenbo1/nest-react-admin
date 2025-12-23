import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateConfigDto {
  @ApiProperty({ description: '配置名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '配置键名' })
  @IsString()
  key: string;

  @ApiProperty({ description: '配置值' })
  @IsString()
  value: string;

  @ApiProperty({ description: '配置类型', required: false })
  @IsString()
  configType?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsString()
  remark?: string;
}
