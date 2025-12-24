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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('mall/category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 创建category
   */
  @Post()
  @RequirePermissions('mall:category:add')
  create(@Body() createDto: CreateCategoryDto) {
    const userId = this.cls.get('user').id;
    return this.categoryService.create(createDto, userId);
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('mall:category:list')
  findAll(@Query() query: QueryCategoryDto) {
    return this.categoryService.findAll(query);
  }

  /**
   * 获取所有分类（用于下拉选择）
   */
  @Get('all/select')
  @RequirePermissions('mall:category:list')
  findAllForSelect() {
    return this.categoryService.findAllForSelect();
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('mall:category:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('mall:category:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCategoryDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.categoryService.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('mall:category:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.categoryService.remove(id, userId);
  }

  /**
   * 切换状态
   */
  @Put(':id/toggle-status')
  @RequirePermissions('mall:category:edit')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.categoryService.toggleStatus(id, userId);
  }
}
