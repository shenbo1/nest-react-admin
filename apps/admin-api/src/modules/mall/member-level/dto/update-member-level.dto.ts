import { PartialType } from '@nestjs/swagger';
import { CreateMemberLevelDto } from './create-member-level.dto';

export class UpdateMemberLevelDto extends PartialType(CreateMemberLevelDto) {}
