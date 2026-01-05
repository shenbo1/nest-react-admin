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
import { PointProductService } from './point-product.service';
import { CreatePointProductDto } from './dto/create-point-product.dto';
import { UpdatePointProductDto } from './dto/update-point-product.dto';
import { QueryPointProductDto } from './dto/query-point-product.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('marketing/point-product')
export class PointProductController {
  constructor(
    private readonly pointProductService: PointProductService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 创建积分商品
   */
  @Post()
  @RequirePermissions('marketing:point-product:add')
  create(@Body() createDto: CreatePointProductDto) {
    const userId = this.cls.get('user').id;
    return this.pointProductService.create(createDto, userId);
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('marketing:point-product:list')
  findAll(@Query() query: QueryPointProductDto) {
    return this.pointProductService.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('marketing:point-product:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pointProductService.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('marketing:point-product:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePointProductDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.pointProductService.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('marketing:point-product:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.pointProductService.remove(id, userId);
  }

  /**
   * 切换状态（启用/禁用）
   */
  @Put(':id/toggle-status')
  @RequirePermissions('marketing:point-product:disable')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.pointProductService.toggleStatus(id, userId);
  }

  /**
   * 下架商品
   */
  @Put(':id/offline')
  @RequirePermissions('marketing:point-product:offline')
  offline(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.pointProductService.offline(id, userId);
  }
}
