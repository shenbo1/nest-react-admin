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
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { QueryBannerDto } from './dto/query-banner.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('mall/banner')
export class BannerController {
  constructor(
    private readonly bannerService: BannerService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 创建banner
   */
  @Post()
  @RequirePermissions('mall:banner:add')
  create(@Body() createDto: CreateBannerDto) {
    const userId = this.cls.get('user').id;
    return this.bannerService.create(createDto, userId);
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('mall:banner:list')
  findAll(@Query() query: QueryBannerDto) {
    return this.bannerService.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('mall:banner:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('mall:banner:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateBannerDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.bannerService.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('mall:banner:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.bannerService.remove(id, userId);
  }

  /**
   * 切换状态
   */
  @Put(':id/toggle-status')
  @RequirePermissions('mall:banner:edit')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.bannerService.toggleStatus(id, userId);
  }
}
