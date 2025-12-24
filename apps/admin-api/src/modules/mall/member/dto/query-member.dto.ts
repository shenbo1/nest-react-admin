import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Status } from '@prisma/client';
import { PaginationDto } from '@/common/dto';

export class QueryMemberDto extends PaginationDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
