import { PartialType } from '@nestjs/swagger';
import { CreateMemberAddressDto } from './create-member-address.dto';

export class UpdateMemberAddressDto extends PartialType(
  CreateMemberAddressDto,
) {}
