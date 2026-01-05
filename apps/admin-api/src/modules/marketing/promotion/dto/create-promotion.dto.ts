import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsEnum,
  IsDateString,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsEnum(['FLASH_SALE', 'TIME_DISCOUNT', 'GROUP_BUY'])
  type: 'FLASH_SALE' | 'TIME_DISCOUNT' | 'GROUP_BUY';

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @IsOptional()
  @IsObject()
  ruleConfig?: {
    // 拼团专用配置
    requiredCount?: number; // 成团人数
    validHours?: number; // 有效时长（小时）
    // 限时折扣专用配置
    discountRate?: number; // 折扣率
  };

  @IsOptional()
  @IsDateString()
  warmUpTime?: string;

  @IsOptional()
  @IsBoolean()
  showCountdown?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  memberLevelIds?: number[];

  @IsOptional()
  @IsInt()
  @Min(0)
  limitPerMember?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
