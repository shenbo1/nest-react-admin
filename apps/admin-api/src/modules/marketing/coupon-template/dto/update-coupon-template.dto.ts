import { PartialType } from '@nestjs/mapped-types';
import { CreateCouponTemplateDto } from './create-coupon-template.dto';

export class UpdateCouponTemplateDto extends PartialType(CreateCouponTemplateDto) {}
