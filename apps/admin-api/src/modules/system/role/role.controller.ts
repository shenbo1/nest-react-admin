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
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
import { RequirePermissions } from '@/common/decorators';

@ApiTags('角色管理')
@ApiBearerAuth()
@Controller('system/role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @RequirePermissions('system:role:add')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: '角色列表' })
  @RequirePermissions('system:role:list')
  findAll(@Query() query: QueryRoleDto) {
    return this.roleService.findAll(query);
  }

  @Get('simple')
  @ApiOperation({ summary: '角色下拉列表' })
  findAllSimple() {
    return this.roleService.findAllSimple();
  }

  @Get(':id')
  @ApiOperation({ summary: '角色详情' })
  @RequirePermissions('system:role:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色' })
  @RequirePermissions('system:role:edit')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @RequirePermissions('system:role:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.remove(id);
  }

  @Put(':id/toggle-status')
  @ApiOperation({ summary: '切换角色状态' })
  @RequirePermissions('system:role:edit')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.toggleStatus(id);
  }
}
