import { IsOptional, IsEnum, IsNumberString, IsString } from 'class-validator';
import { PointProductType, Status } from '@prisma/client';

export class QueryPointProductDto {
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
  @IsEnum(PointProductType)
  productType?: PointProductType;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
