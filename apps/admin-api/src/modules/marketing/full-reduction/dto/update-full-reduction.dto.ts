import { PartialType } from '@nestjs/mapped-types';
import { CreateFullReductionDto } from './create-full-reduction.dto';

export class UpdateFullReductionDto extends PartialType(CreateFullReductionDto) {}
