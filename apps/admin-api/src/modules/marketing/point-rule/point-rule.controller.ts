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
import { PointRuleService } from './point-rule.service';
import { CreatePointRuleDto } from './dto/create-point-rule.dto';
import { UpdatePointRuleDto } from './dto/update-point-rule.dto';
import { QueryPointRuleDto } from './dto/query-point-rule.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('marketing/point-rule')
export class PointRuleController {
  constructor(
    private readonly pointRuleService: PointRuleService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 创建积分规则
   */
  @Post()
  @RequirePermissions('marketing:point-rule:add')
  create(@Body() createDto: CreatePointRuleDto) {
    const userId = this.cls.get('user').id;
    return this.pointRuleService.create(createDto, userId);
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('marketing:point-rule:list')
  findAll(@Query() query: QueryPointRuleDto) {
    return this.pointRuleService.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('marketing:point-rule:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pointRuleService.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('marketing:point-rule:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePointRuleDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.pointRuleService.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('marketing:point-rule:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.pointRuleService.remove(id, userId);
  }

  /**
   * 切换状态
   */
  @Put(':id/toggle-status')
  @RequirePermissions('marketing:point-rule:disable')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.pointRuleService.toggleStatus(id, userId);
  }
}
