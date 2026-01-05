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
import { FullReductionService } from './full-reduction.service';
import { CreateFullReductionDto } from './dto/create-full-reduction.dto';
import { UpdateFullReductionDto } from './dto/update-full-reduction.dto';
import { QueryFullReductionDto } from './dto/query-full-reduction.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('marketing/full-reduction')
export class FullReductionController {
  constructor(
    private readonly fullReductionService: FullReductionService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 创建满减活动
   */
  @Post()
  @RequirePermissions('marketing:full-reduction:add')
  create(@Body() createDto: CreateFullReductionDto) {
    const userId = this.cls.get('user').id;
    return this.fullReductionService.create(createDto, userId);
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('marketing:full-reduction:list')
  findAll(@Query() query: QueryFullReductionDto) {
    return this.fullReductionService.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('marketing:full-reduction:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fullReductionService.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('marketing:full-reduction:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFullReductionDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.fullReductionService.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('marketing:full-reduction:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.fullReductionService.remove(id, userId);
  }

  /**
   * 切换状态（启用/禁用）
   */
  @Put(':id/toggle-status')
  @RequirePermissions('marketing:full-reduction:disable')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.fullReductionService.toggleStatus(id, userId);
  }
}
