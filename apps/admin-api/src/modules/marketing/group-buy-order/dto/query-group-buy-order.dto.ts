import { IsOptional, IsString, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryGroupBuyOrderDto {
  @ApiPropertyOptional({ description: '团单号' })
  @IsOptional()
  @IsString()
  groupNo?: string;

  @ApiPropertyOptional({ description: '活动ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  promotionId?: number;

  @ApiPropertyOptional({ description: '商品ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  productId?: number;

  @ApiPropertyOptional({ description: '团长会员ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  leaderId?: number;

  @ApiPropertyOptional({
    description: '状态',
    enum: ['WAITING', 'SUCCESS', 'FAILED', 'CANCELLED'],
  })
  @IsOptional()
  @IsEnum(['WAITING', 'SUCCESS', 'FAILED', 'CANCELLED'])
  status?: 'WAITING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

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
