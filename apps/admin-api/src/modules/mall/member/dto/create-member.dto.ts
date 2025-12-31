import { IsString, IsOptional, IsInt, IsEnum, MaxLength, MinLength, IsEmail, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Status, Gender } from '@prisma/client';

export class CreateMemberDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  birthday?: Date;

  @IsOptional()
  @IsInt()
  memberLevelId?: number;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
