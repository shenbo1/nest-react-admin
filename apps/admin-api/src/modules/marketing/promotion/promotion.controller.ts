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
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { QueryPromotionDto } from './dto/query-promotion.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('marketing/promotion')
export class PromotionController {
  constructor(
    private readonly promotionService: PromotionService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 创建促销活动
   */
  @Post()
  @RequirePermissions('marketing:promotion:add')
  create(@Body() createDto: CreatePromotionDto) {
    const userId = this.cls.get('user').id;
    return this.promotionService.create(createDto, userId);
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('marketing:promotion:list')
  findAll(@Query() query: QueryPromotionDto) {
    return this.promotionService.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('marketing:promotion:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('marketing:promotion:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePromotionDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.promotionService.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('marketing:promotion:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.promotionService.remove(id, userId);
  }

  /**
   * 切换状态（启用/禁用）
   */
  @Put(':id/toggle-status')
  @RequirePermissions('marketing:promotion:disable')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.promotionService.toggleStatus(id, userId);
  }
}
