import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType, InvoiceTitleType } from '@prisma/client';

export class QueryMemberInvoiceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  memberId?: number;

  @IsOptional()
  @IsString()
  invoiceTitle?: string;

  @IsOptional()
  @IsString()
  invoiceTaxNo?: string;

  @IsOptional()
  @IsEnum(InvoiceType)
  invoiceType?: InvoiceType;

  @IsOptional()
  @IsEnum(InvoiceTitleType)
  invoiceTitleType?: InvoiceTitleType;
}
