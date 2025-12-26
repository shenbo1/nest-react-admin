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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AlertService } from './alert.service';
import {
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
  HandleAlertDto,
  QueryAlertDto,
} from './dto';
import { CurrentUser, CurrentUserType } from '@/common/decorators';

@ApiTags('告警管理')
@ApiBearerAuth()
@Controller('monitor/alert')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  // ==================== 告警规则 ====================

  @Get('rules')
  @ApiOperation({ summary: '获取所有告警规则' })
  async getRules() {
    return this.alertService.getRules();
  }

  @Get('rules/:id')
  @ApiOperation({ summary: '获取告警规则详情' })
  async getRule(@Param('id', ParseIntPipe) id: number) {
    return this.alertService.getRule(id);
  }

  @Post('rules')
  @ApiOperation({ summary: '创建告警规则' })
  async createRule(@Body() dto: CreateAlertRuleDto) {
    return this.alertService.createRule(dto);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: '更新告警规则' })
  async updateRule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAlertRuleDto,
  ) {
    return this.alertService.updateRule(id, dto);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: '删除告警规则' })
  async deleteRule(@Param('id', ParseIntPipe) id: number) {
    return this.alertService.deleteRule(id);
  }

  @Put('rules/:id/toggle')
  @ApiOperation({ summary: '启用/禁用告警规则' })
  async toggleRule(
    @Param('id', ParseIntPipe) id: number,
    @Body('enabled') enabled: boolean,
  ) {
    return this.alertService.toggleRule(id, enabled);
  }

  // ==================== 告警事件 ====================

  @Get('events')
  @ApiOperation({ summary: '获取告警事件列表' })
  async getAlerts(@Query() query: QueryAlertDto) {
    return this.alertService.getAlerts(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取告警统计' })
  async getAlertStats() {
    return this.alertService.getAlertStats();
  }

  @Put('events/:id/handle')
  @ApiOperation({ summary: '处理告警事件' })
  async handleAlert(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HandleAlertDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.alertService.handleAlert(id, dto, user.username);
  }

  @Put('events/batch-handle')
  @ApiOperation({ summary: '批量处理告警事件' })
  async batchHandleAlerts(
    @Body('ids') ids: number[],
    @Body() dto: HandleAlertDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.alertService.batchHandleAlerts(ids, dto, user.username);
  }

  @Delete('events/:id')
  @ApiOperation({ summary: '删除告警事件' })
  async deleteAlert(@Param('id', ParseIntPipe) id: number) {
    return this.alertService.deleteAlert(id);
  }

  @Delete('events/cleanup')
  @ApiOperation({ summary: '清理过期告警' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: '保留天数，默认30天' })
  async cleanupAlerts(@Query('days') days?: number) {
    return this.alertService.cleanupAlerts(days || 30);
  }
}
