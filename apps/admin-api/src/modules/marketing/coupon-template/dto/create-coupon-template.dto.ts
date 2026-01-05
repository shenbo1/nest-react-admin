import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { CouponType, CouponValidType, CouponScopeType } from '@prisma/client';

export class CreateCouponTemplateDto {
  @IsString()
  name: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @IsOptional()
  @IsNumber()
  totalCount?: number;

  @IsOptional()
  @IsNumber()
  perLimitCount?: number;

  @IsOptional()
  @IsDateString()
  receiveStartTime?: string;

  @IsOptional()
  @IsDateString()
  receiveEndTime?: string;

  @IsEnum(CouponValidType)
  validType: CouponValidType;

  @IsOptional()
  @IsDateString()
  validStartTime?: string;

  @IsOptional()
  @IsDateString()
  validEndTime?: string;

  @IsOptional()
  @IsNumber()
  validDays?: number;

  @IsOptional()
  @IsEnum(CouponScopeType)
  scopeType?: CouponScopeType;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? JSON.stringify(value) : value))
  @IsString()
  scopeIds?: string;

  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['ENABLED', 'DISABLED'])
  status?: 'ENABLED' | 'DISABLED';
}
