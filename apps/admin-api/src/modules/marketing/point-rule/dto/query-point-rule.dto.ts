import { IsOptional, IsEnum, IsNumberString, IsString } from 'class-validator';
import { PointRuleType, Status } from '@prisma/client';

export class QueryPointRuleDto {
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
  @IsEnum(PointRuleType)
  type?: PointRuleType;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
