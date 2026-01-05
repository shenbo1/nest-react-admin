import {
  IsInt,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BalanceChangeType } from '@prisma/client';

export class CreateMemberBalanceLogDto {
  @IsInt()
  memberId: number;

  @IsEnum(BalanceChangeType)
  type: BalanceChangeType;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsInt()
  orderId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
