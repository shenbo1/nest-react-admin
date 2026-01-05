import { PartialType } from '@nestjs/swagger';
import { CreateMemberInvoiceDto } from './create-member-invoice.dto';

export class UpdateMemberInvoiceDto extends PartialType(
  CreateMemberInvoiceDto,
) {}
