import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { MemberCouponService } from './member-coupon.service';
import { QueryMemberCouponDto } from './dto/query-member-coupon.dto';
import { RequirePermissions } from '@/common/decorators';

@Controller('marketing/member-coupon')
export class MemberCouponController {
  constructor(private readonly memberCouponService: MemberCouponService) {}

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('marketing:member-coupon:list')
  findAll(@Query() query: QueryMemberCouponDto) {
    return this.memberCouponService.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('marketing:member-coupon:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.memberCouponService.findOne(id);
  }

  /**
   * 禁用/作废优惠券
   */
  @Put(':id/disable')
  @RequirePermissions('marketing:member-coupon:disable')
  disable(@Param('id', ParseIntPipe) id: number) {
    return this.memberCouponService.disable(id);
  }

  /**
   * 核销优惠券
   */
  @Put(':id/use')
  @RequirePermissions('marketing:member-coupon:use')
  use(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { orderId?: number; orderNo?: string; discountAmount?: number },
  ) {
    return this.memberCouponService.use(id, data.orderId, data.orderNo, data.discountAmount);
  }
}
