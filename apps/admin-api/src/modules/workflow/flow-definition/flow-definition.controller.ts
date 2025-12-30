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
import { RequirePermissions } from '@/common/decorators';
import { FlowDefinitionService } from './flow-definition.service';
import {
  CreateFlowDefinitionDto,
  UpdateFlowDefinitionDto,
  QueryFlowDefinitionDto,
  SaveNodeConfigsDto,
} from './dto';

@ApiTags('流程定义')
@ApiBearerAuth()
@Controller('workflow/definition')
export class FlowDefinitionController {
  constructor(private readonly flowDefinitionService: FlowDefinitionService) {}

  @Post()
  @ApiOperation({ summary: '创建流程定义' })
  @RequirePermissions('workflow:definition:add')
  create(@Body() dto: CreateFlowDefinitionDto) {
    return this.flowDefinitionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询流程定义列表' })
  @RequirePermissions('workflow:definition:list')
  findAll(@Query() query: QueryFlowDefinitionDto) {
    return this.flowDefinitionService.findAll(query);
  }

  @Get('available')
  @ApiOperation({ summary: '获取可用流程列表' })
  @RequirePermissions('workflow:instance:start')
  findAvailable(@Query('categoryId') categoryId?: string) {
    return this.flowDefinitionService.findAvailable(
      categoryId ? parseInt(categoryId, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '查询流程定义详情' })
  @RequirePermissions('workflow:definition:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.flowDefinitionService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新流程定义' })
  @RequirePermissions('workflow:definition:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFlowDefinitionDto,
  ) {
    return this.flowDefinitionService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除流程定义' })
  @RequirePermissions('workflow:definition:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.flowDefinitionService.remove(id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布流程' })
  @RequirePermissions('workflow:definition:publish')
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.flowDefinitionService.publish(id);
  }

  @Post(':id/disable')
  @ApiOperation({ summary: '停用流程' })
  @RequirePermissions('workflow:definition:disable')
  disable(@Param('id', ParseIntPipe) id: number) {
    return this.flowDefinitionService.disable(id);
  }

  @Post(':id/node-configs')
  @ApiOperation({ summary: '保存节点配置' })
  @RequirePermissions('workflow:definition:edit')
  saveNodeConfigs(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveNodeConfigsDto,
  ) {
    return this.flowDefinitionService.saveNodeConfigs(id, dto.nodeConfigs);
  }

  @Post(':id/new-version')
  @ApiOperation({ summary: '创建新版本' })
  @RequirePermissions('workflow:definition:add')
  createNewVersion(@Param('id', ParseIntPipe) id: number) {
    return this.flowDefinitionService.createNewVersion(id);
  }
}
