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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WfCategoryStatus } from '@prisma/client';
import { RequirePermissions } from '@/common/decorators';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoryDto } from './dto';

@ApiTags('工作流-分类管理')
@ApiBearerAuth()
@Controller('workflow/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: '创建分类' })
  @RequirePermissions('workflow:category:add')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询分类列表' })
  @RequirePermissions('workflow:category:list')
  findAll(@Query() query: QueryCategoryDto) {
    return this.categoryService.findAll(query);
  }

  /**
   * 获取所有分类（用于下拉选择）
   */
  @Get('all/select')
  @ApiOperation({ summary: '获取所有分类（下拉选择）' })
  @RequirePermissions('workflow:category:list')
  findAllForSelect() {
    return this.categoryService.findAllForSelect();
  }

  @Get(':id')
  @ApiOperation({ summary: '查询分类详情' })
  @RequirePermissions('workflow:category:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新分类' })
  @RequirePermissions('workflow:category:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分类' })
  @RequirePermissions('workflow:category:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }

  @Delete('batch/:ids')
  @ApiOperation({ summary: '批量删除分类' })
  @RequirePermissions('workflow:category:remove')
  batchRemove(@Param('ids') ids: string) {
    const idArray = ids.split(',').map((id) => parseInt(id, 10));
    return this.categoryService.batchRemove(idArray);
  }

  @Put(':id/status/:status')
  @ApiOperation({ summary: '更新分类状态' })
  @RequirePermissions('workflow:category:edit')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('status') status: WfCategoryStatus,
  ) {
    return this.categoryService.updateStatus(id, status);
  }
}
