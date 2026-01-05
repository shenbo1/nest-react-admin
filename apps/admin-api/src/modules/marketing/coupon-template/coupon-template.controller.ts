import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CouponTemplateService } from './coupon-template.service';
import { CreateCouponTemplateDto } from './dto/create-coupon-template.dto';
import { UpdateCouponTemplateDto } from './dto/update-coupon-template.dto';
import { QueryCouponTemplateDto } from './dto/query-coupon-template.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('marketing/coupon-template')
export class CouponTemplateController {
  constructor(
    private readonly couponTemplateService: CouponTemplateService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 创建优惠券模板
   */
  @Post()
  @RequirePermissions('marketing:coupon-template:add')
  create(@Body() createDto: CreateCouponTemplateDto) {
    const userId = this.cls.get('user').id;
    return this.couponTemplateService.create(createDto, userId);
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('marketing:coupon-template:list')
  findAll(@Query() query: QueryCouponTemplateDto) {
    return this.couponTemplateService.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('marketing:coupon-template:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.couponTemplateService.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('marketing:coupon-template:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCouponTemplateDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.couponTemplateService.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('marketing:coupon-template:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.couponTemplateService.remove(id, userId);
  }

  /**
   * 切换状态
   */
  @Put(':id/toggle-status')
  @RequirePermissions('marketing:coupon-template:disable')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.couponTemplateService.toggleStatus(id, userId);
  }

  /**
   * 发放优惠券给用户
   */
  @Post(':id/grant')
  @RequirePermissions('marketing:coupon-template:grant')
  grant(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { memberIds: number[]; grantBy?: string },
  ) {
    const userId = this.cls.get('user').id;
    return this.couponTemplateService.grant(id, data.memberIds, userId, data.grantBy);
  }
}
