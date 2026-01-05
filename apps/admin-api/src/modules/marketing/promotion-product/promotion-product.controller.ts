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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { ClsService } from 'nestjs-cls';
import { PromotionProductService } from './promotion-product.service';
import { CreatePromotionProductDto } from './dto/create-promotion-product.dto';
import { UpdatePromotionProductDto } from './dto/update-promotion-product.dto';
import { QueryPromotionProductDto } from './dto/query-promotion-product.dto';

@ApiTags('促销商品管理')
@Controller('marketing/promotion-product')
export class PromotionProductController {
  constructor(
    private readonly promotionProductService: PromotionProductService,
    private readonly cls: ClsService,
  ) {}

  @ApiOperation({ summary: '添加促销商品' })
  @RequirePermissions('marketing:promotion-product:add')
  @Post()
  create(@Body() dto: CreatePromotionProductDto) {
    const userId = this.cls.get('userId');
    return this.promotionProductService.create(dto, userId);
  }

  @ApiOperation({ summary: '批量添加促销商品' })
  @RequirePermissions('marketing:promotion-product:add')
  @Post('batch/:promotionId')
  batchCreate(
    @Param('promotionId', ParseIntPipe) promotionId: number,
    @Body() products: Omit<CreatePromotionProductDto, 'promotionId'>[],
  ) {
    const userId = this.cls.get('userId');
    return this.promotionProductService.batchCreate(promotionId, products, userId);
  }

  @ApiOperation({ summary: '获取促销商品列表' })
  @RequirePermissions('marketing:promotion-product:list')
  @Get()
  findAll(@Query() query: QueryPromotionProductDto) {
    return this.promotionProductService.findAll(query);
  }

  @ApiOperation({ summary: '获取促销商品详情' })
  @RequirePermissions('marketing:promotion-product:query')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.promotionProductService.findOne(id);
  }

  @ApiOperation({ summary: '更新促销商品' })
  @RequirePermissions('marketing:promotion-product:edit')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionProductDto,
  ) {
    const userId = this.cls.get('userId');
    return this.promotionProductService.update(id, dto, userId);
  }

  @ApiOperation({ summary: '删除促销商品' })
  @RequirePermissions('marketing:promotion-product:remove')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('userId');
    return this.promotionProductService.remove(id, userId);
  }

  @ApiOperation({ summary: '切换促销商品状态' })
  @RequirePermissions('marketing:promotion-product:edit')
  @Put(':id/toggle-status')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('userId');
    return this.promotionProductService.toggleStatus(id, userId);
  }

  @ApiOperation({ summary: '获取活动商品统计' })
  @RequirePermissions('marketing:promotion-product:list')
  @Get('stats/:promotionId')
  getPromotionStats(@Param('promotionId', ParseIntPipe) promotionId: number) {
    return this.promotionProductService.getPromotionStats(promotionId);
  }
}
