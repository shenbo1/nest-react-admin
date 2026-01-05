import { IsOptional, IsInt, IsBoolean, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryGroupBuyMemberDto {
  @ApiPropertyOptional({ description: '团单ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  groupOrderId?: number;

  @ApiPropertyOptional({ description: '会员ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  memberId?: number;

  @ApiPropertyOptional({ description: '是否团长' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isLeader?: boolean;

  @ApiPropertyOptional({
    description: '支付状态',
    enum: ['UNPAID', 'PAID', 'REFUNDED'],
  })
  @IsOptional()
  @IsEnum(['UNPAID', 'PAID', 'REFUNDED'])
  payStatus?: 'UNPAID' | 'PAID' | 'REFUNDED';

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}
