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
import { DictService } from './dict.service';
import {
  CreateDictTypeDto,
  UpdateDictTypeDto,
  QueryDictTypeDto,
  CreateDictDataDto,
  UpdateDictDataDto,
  QueryDictDataDto,
} from './dto';
import { RequirePermissions } from '@/common/decorators';

@ApiTags('字典管理')
@ApiBearerAuth()
@Controller('system/dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  // ========== 字典类型 ==========
  @Post('type')
  @ApiOperation({ summary: '创建字典类型' })
  @RequirePermissions('system:dict:add')
  createType(@Body() dto: CreateDictTypeDto) {
    return this.dictService.createType(dto);
  }

  @Get('type')
  @ApiOperation({ summary: '字典类型列表' })
  @RequirePermissions('system:dict:list')
  findAllTypes(@Query() query: QueryDictTypeDto) {
    return this.dictService.findAllTypes(query);
  }

  @Get('type/:id')
  @ApiOperation({ summary: '字典类型详情' })
  @RequirePermissions('system:dict:query')
  findOneType(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.findOneType(id);
  }

  @Put('type/:id')
  @ApiOperation({ summary: '更新字典类型' })
  @RequirePermissions('system:dict:edit')
  updateType(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDictTypeDto) {
    return this.dictService.updateType(id, dto);
  }

  @Delete('type/:id')
  @ApiOperation({ summary: '删除字典类型' })
  @RequirePermissions('system:dict:remove')
  removeType(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.removeType(id);
  }

  // ========== 字典数据 ==========
  @Post('data')
  @ApiOperation({ summary: '创建字典数据' })
  @RequirePermissions('system:dict:add')
  createData(@Body() dto: CreateDictDataDto) {
    return this.dictService.createData(dto);
  }

  @Get('data')
  @ApiOperation({ summary: '字典数据列表' })
  @RequirePermissions('system:dict:list')
  findAllData(@Query() query: QueryDictDataDto) {
    return this.dictService.findAllData(query);
  }

  @Get('data/type/:dictType')
  @ApiOperation({ summary: '根据类型获取字典数据' })
  findDataByType(@Param('dictType') dictType: string) {
    return this.dictService.findDataByType(dictType);
  }

  @Get('data/:id')
  @ApiOperation({ summary: '字典数据详情' })
  @RequirePermissions('system:dict:query')
  findOneData(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.findOneData(id);
  }

  @Put('data/:id')
  @ApiOperation({ summary: '更新字典数据' })
  @RequirePermissions('system:dict:edit')
  updateData(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDictDataDto) {
    return this.dictService.updateData(id, dto);
  }

  @Delete('data/:id')
  @ApiOperation({ summary: '删除字典数据' })
  @RequirePermissions('system:dict:remove')
  removeData(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.removeData(id);
  }

  // ========== 切换状态 ==========
  @Put('type/:id/toggle-status')
  @ApiOperation({ summary: '切换字典类型状态' })
  @RequirePermissions('system:dict:edit')
  toggleTypeStatus(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.toggleTypeStatus(id);
  }

  @Put('data/:id/toggle-status')
  @ApiOperation({ summary: '切换字典数据状态' })
  @RequirePermissions('system:dict:edit')
  toggleDataStatus(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.toggleDataStatus(id);
  }
}
