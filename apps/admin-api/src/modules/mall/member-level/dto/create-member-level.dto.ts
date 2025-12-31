import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Status } from '@prisma/client';

export class CreateMemberLevelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  code: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsInt()
  @Min(1)
  level: number;

  @IsInt()
  @Min(0)
  minGrowth: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxGrowth?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  discountRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pointsRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  benefits?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
