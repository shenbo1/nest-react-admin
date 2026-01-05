import {
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PointChangeType } from '@prisma/client';

export class CreateMemberPointLogDto {
  @IsInt()
  memberId: number;

  @IsEnum(PointChangeType)
  type: PointChangeType;

  @IsInt()
  points: number;

  @IsOptional()
  @IsInt()
  orderId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
