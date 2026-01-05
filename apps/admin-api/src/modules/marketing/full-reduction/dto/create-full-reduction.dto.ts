import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsEnum,
  IsDateString,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// 满减规则项
class FullReductionRuleItem {
  @IsInt()
  @Min(1)
  minAmount: number;

  @IsInt()
  @Min(1)
  reduceAmount: number;
}

export class CreateFullReductionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FullReductionRuleItem)
  rules: FullReductionRuleItem[];

  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  exclusive?: boolean;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsEnum(['ALL', 'CATEGORY', 'PRODUCT'])
  scopeType: 'ALL' | 'CATEGORY' | 'PRODUCT';

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  scopeIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  memberLevelIds?: number[];

  @IsOptional()
  @IsInt()
  @Min(0)
  limitPerMember?: number;

  @IsOptional()
  @IsBoolean()
  firstOrderOnly?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
