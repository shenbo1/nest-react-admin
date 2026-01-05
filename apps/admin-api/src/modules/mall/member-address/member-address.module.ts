import { Module } from '@nestjs/common';
import { MemberAddressController } from './member-address.controller';
import { MemberAddressService } from './member-address.service';

@Module({
  controllers: [MemberAddressController],
  providers: [MemberAddressService],
  exports: [MemberAddressService],
})
export class MemberAddressModule {}
