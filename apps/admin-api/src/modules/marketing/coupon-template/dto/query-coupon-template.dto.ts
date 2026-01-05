import { IsOptional, IsEnum, IsNumberString, IsString } from 'class-validator';
import { CouponType, Status } from '@prisma/client';

export class QueryCouponTemplateDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  pageSize?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
