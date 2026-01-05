import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { PointRuleType, Status } from '@prisma/client';

export class CreatePointRuleDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(PointRuleType)
  type: PointRuleType;

  @IsNumber()
  @Min(0)
  points: number;

  @IsOptional()
  @IsNumber()
  consumeUnit?: number;

  @IsOptional()
  @IsString()
  extraRules?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  validDays?: number;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsString()
  description?: string;
}
