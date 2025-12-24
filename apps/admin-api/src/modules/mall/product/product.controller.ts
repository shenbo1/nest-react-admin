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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('mall/product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 创建product
   */
  @Post()
  @RequirePermissions('mall:product:add')
  create(@Body() createDto: CreateProductDto) {
    const userId = this.cls.get('user').id;
    return this.productService.create(createDto, userId);
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('mall:product:list')
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('mall:product:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('mall:product:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.productService.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('mall:product:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.productService.remove(id, userId);
  }

  /**
   * 复制商品（需放在 :id 路由之前，否则 :id 会匹配到 'duplicate'）
   */
  @Post(':id/duplicate')
  @RequirePermissions('mall:product:add')
  duplicate(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.productService.duplicate(id, userId);
  }

  /**
   * 切换商品状态
   */
  @Put(':id/toggle-status')
  @RequirePermissions('mall:product:edit')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.productService.toggleStatus(id, userId);
  }

  /**
   * 批量切换商品状态
   */
  @Put('batch/toggle-status')
  @RequirePermissions('mall:product:edit')
  batchToggleStatus(@Body() body: { ids: number[] }) {
    const userId = this.cls.get('user').id;
    return this.productService.batchToggleStatus(body.ids, userId);
  }
}
