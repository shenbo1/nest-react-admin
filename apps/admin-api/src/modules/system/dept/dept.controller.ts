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
import { DeptService } from './dept.service';
import { CreateDeptDto, UpdateDeptDto } from './dto';
import { RequirePermissions } from '@/common/decorators';

@ApiTags('部门管理')
@ApiBearerAuth()
@Controller('system/dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  @Post()
  @ApiOperation({ summary: '创建部门' })
  @RequirePermissions('system:dept:add')
  create(@Body() createDeptDto: CreateDeptDto) {
    return this.deptService.create(createDeptDto);
  }

  @Get()
  @ApiOperation({ summary: '部门列表(树形)' })
  @RequirePermissions('system:dept:list')
  findAll() {
    return this.deptService.findAll();
  }

  @Get('treeselect')
  @ApiOperation({ summary: '部门下拉树' })
  getTreeSelect() {
    return this.deptService.getTreeSelect();
  }

  @Get(':id')
  @ApiOperation({ summary: '部门详情' })
  @RequirePermissions('system:dept:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deptService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新部门' })
  @RequirePermissions('system:dept:edit')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDeptDto: UpdateDeptDto) {
    return this.deptService.update(id, updateDeptDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除部门' })
  @RequirePermissions('system:dept:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deptService.remove(id);
  }
}
