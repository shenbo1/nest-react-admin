import { IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { MemberCouponStatus } from '@prisma/client';

export class QueryMemberCouponDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  pageSize?: string;

  @IsOptional()
  @IsNumberString()
  memberId?: string;

  @IsOptional()
  @IsNumberString()
  templateId?: string;

  @IsOptional()
  @IsEnum(MemberCouponStatus)
  status?: MemberCouponStatus;
}
