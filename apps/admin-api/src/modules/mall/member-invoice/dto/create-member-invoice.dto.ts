import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { InvoiceType, InvoiceTitleType } from '@prisma/client';

export class CreateMemberInvoiceDto {
  @IsInt()
  memberId: number;

  @IsOptional()
  @IsEnum(InvoiceType)
  invoiceType?: InvoiceType;

  @IsOptional()
  @IsEnum(InvoiceTitleType)
  invoiceTitleType?: InvoiceTitleType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  invoiceTaxNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  invoiceContent?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  invoiceEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  invoicePhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  invoiceAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccount?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
