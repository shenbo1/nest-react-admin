import { IsOptional, IsString, IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '@/common/dto';

export class QueryOrderDto extends PaginationDto {
  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  receiver?: string;
}
