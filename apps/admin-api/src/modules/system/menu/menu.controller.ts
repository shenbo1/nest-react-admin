import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuDto, UpdateMenuDto } from './dto';
import { RequirePermissions } from '@/common/decorators';

@ApiTags('菜单管理')
@ApiBearerAuth()
@Controller('system/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @ApiOperation({ summary: '创建菜单' })
  @RequirePermissions('system:menu:add')
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto);
  }

  @Get()
  @ApiOperation({ summary: '菜单列表(树形)' })
  @RequirePermissions('system:menu:list')
  findAll() {
    return this.menuService.findAll();
  }

  @Get('treeselect')
  @ApiOperation({ summary: '菜单下拉树' })
  getTreeSelect() {
    return this.menuService.getTreeSelect();
  }

  @Get(':id')
  @ApiOperation({ summary: '菜单详情' })
  @RequirePermissions('system:menu:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新菜单' })
  @RequirePermissions('system:menu:edit')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(id, updateMenuDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除菜单' })
  @RequirePermissions('system:menu:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.remove(id);
  }
}
