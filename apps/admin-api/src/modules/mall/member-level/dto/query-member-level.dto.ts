import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Status } from '@prisma/client';
import { PaginationDto } from '@/common/dto';

export class QueryMemberLevelDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
