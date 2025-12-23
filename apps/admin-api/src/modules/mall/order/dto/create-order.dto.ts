import { IsString, IsOptional, IsInt, IsEnum, MaxLength, MinLength, IsNumber } from 'class-validator';
import { OrderStatus, PayStatus, ShippingStatus } from '@prisma/client';

export class CreateOrderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  orderNo: string;

  @IsOptional()
  @IsInt()
  memberId?: number;

  @IsOptional()
  items?: any;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  freight?: number;

  @IsNumber()
  actualAmount: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PayStatus)
  payStatus?: PayStatus;

  @IsOptional()
  @IsEnum(ShippingStatus)
  shippingStatus?: ShippingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  receiver?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
