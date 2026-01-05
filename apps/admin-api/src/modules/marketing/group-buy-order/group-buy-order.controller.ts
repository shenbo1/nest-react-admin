import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { ClsService } from 'nestjs-cls';
import { GroupBuyOrderService } from './group-buy-order.service';
import { QueryGroupBuyOrderDto } from './dto/query-group-buy-order.dto';

@ApiTags('拼团订单管理')
@Controller('marketing/group-buy-order')
export class GroupBuyOrderController {
  constructor(
    private readonly groupBuyOrderService: GroupBuyOrderService,
    private readonly cls: ClsService,
  ) {}

  @ApiOperation({ summary: '获取拼团订单列表' })
  @RequirePermissions('marketing:group-buy-order:list')
  @Get()
  findAll(@Query() query: QueryGroupBuyOrderDto) {
    return this.groupBuyOrderService.findAll(query);
  }

  @ApiOperation({ summary: '获取统计数据' })
  @RequirePermissions('marketing:group-buy-order:list')
  @Get('stats')
  getStats() {
    return this.groupBuyOrderService.getStats();
  }

  @ApiOperation({ summary: '获取拼团订单详情' })
  @RequirePermissions('marketing:group-buy-order:query')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupBuyOrderService.findOne(id);
  }

  @ApiOperation({ summary: '取消拼团' })
  @RequirePermissions('marketing:group-buy-order:cancel')
  @Put(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('userId');
    return this.groupBuyOrderService.cancel(id, userId);
  }

  @ApiOperation({ summary: '手动成团' })
  @RequirePermissions('marketing:group-buy-order:manual-finish')
  @Put(':id/manual-finish')
  manualFinish(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('userId');
    return this.groupBuyOrderService.manualFinish(id, userId);
  }
}
