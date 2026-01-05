import { Module } from '@nestjs/common';
import { MemberInvoiceController } from './member-invoice.controller';
import { MemberInvoiceService } from './member-invoice.service';

@Module({
  controllers: [MemberInvoiceController],
  providers: [MemberInvoiceService],
  exports: [MemberInvoiceService],
})
export class MemberInvoiceModule {}
