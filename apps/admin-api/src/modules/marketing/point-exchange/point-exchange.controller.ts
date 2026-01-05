import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PointExchangeService } from './point-exchange.service';
import { QueryPointExchangeDto } from './dto/query-point-exchange.dto';
import { ShipPointExchangeDto } from './dto/ship-point-exchange.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('marketing/point-exchange')
export class PointExchangeController {
  constructor(
    private readonly pointExchangeService: PointExchangeService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('marketing:point-exchange:list')
  findAll(@Query() query: QueryPointExchangeDto) {
    return this.pointExchangeService.findAll(query);
  }

  /**
   * 获取统计数据
   */
  @Get('stats')
  @RequirePermissions('marketing:point-exchange:list')
  getStats() {
    return this.pointExchangeService.getStats();
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('marketing:point-exchange:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pointExchangeService.findOne(id);
  }

  /**
   * 发货（实物商品）
   */
  @Put(':id/ship')
  @RequirePermissions('marketing:point-exchange:ship')
  ship(
    @Param('id', ParseIntPipe) id: number,
    @Body() shipDto: ShipPointExchangeDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.pointExchangeService.ship(id, shipDto, userId);
  }

  /**
   * 完成兑换
   */
  @Put(':id/complete')
  @RequirePermissions('marketing:point-exchange:complete')
  complete(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.pointExchangeService.complete(id, userId);
  }

  /**
   * 取消兑换
   */
  @Put(':id/cancel')
  @RequirePermissions('marketing:point-exchange:cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.pointExchangeService.cancel(id, userId);
  }
}
