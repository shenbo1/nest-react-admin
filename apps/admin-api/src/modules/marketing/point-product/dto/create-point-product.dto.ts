import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { PointProductType, Status } from '@prisma/client';

export class CreatePointProductDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsNumber()
  sort?: number;

  @IsNumber()
  @Min(1)
  points: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  limitCount?: number;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsEnum(PointProductType)
  productType: PointProductType;

  @IsOptional()
  @IsNumber()
  relatedProductId?: number;

  @IsOptional()
  @IsNumber()
  relatedCouponId?: number;

  @IsOptional()
  @IsString()
  virtualContent?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsString()
  description?: string;
}
