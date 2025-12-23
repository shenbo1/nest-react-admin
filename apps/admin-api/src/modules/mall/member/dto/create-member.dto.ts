import { IsString, IsOptional, IsInt, IsEnum, MaxLength, MinLength } from 'class-validator';
import { Status } from '@prisma/client';

export class CreateMemberDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
