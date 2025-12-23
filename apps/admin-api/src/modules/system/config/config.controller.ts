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
import { ConfigService } from './config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { RequirePermissions } from '@/common/decorators';

@ApiTags('参数设置')
@ApiBearerAuth()
@Controller('system/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Post()
  @ApiOperation({ summary: '创建配置' })
  @RequirePermissions('system:config:add')
  create(@Body() createConfigDto: CreateConfigDto) {
    return this.configService.create(createConfigDto);
  }

  @Get()
  @ApiOperation({ summary: '配置列表' })
  @RequirePermissions('system:config:list')
  findAll(@Query() query: QueryConfigDto) {
    return this.configService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '配置详情' })
  @RequirePermissions('system:config:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.configService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新配置' })
  @RequirePermissions('system:config:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConfigDto: UpdateConfigDto,
  ) {
    return this.configService.update(id, updateConfigDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除配置' })
  @RequirePermissions('system:config:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.configService.remove(id);
  }
}
