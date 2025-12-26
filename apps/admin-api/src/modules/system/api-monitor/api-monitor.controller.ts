import { Controller, Get, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApiMonitorService } from './api-monitor.service';

@ApiTags('API监控')
@ApiBearerAuth()
@Controller('monitor/api')
export class ApiMonitorController {
  constructor(private readonly apiMonitorService: ApiMonitorService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取API统计概览' })
  async getOverview() {
    return this.apiMonitorService.getApiOverview();
  }

  @Get('metrics')
  @ApiOperation({ summary: '获取所有API指标' })
  async getMetrics() {
    return this.apiMonitorService.getApiMetrics();
  }

  @Get('recent-calls')
  @ApiOperation({ summary: '获取最近API调用' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentCalls(@Query('limit') limit?: number) {
    return this.apiMonitorService.getRecentCalls(limit || 100);
  }

  @Get('recent-errors')
  @ApiOperation({ summary: '获取最近错误' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentErrors(@Query('limit') limit?: number) {
    return this.apiMonitorService.getRecentErrors(limit || 100);
  }

  @Get('slow-apis')
  @ApiOperation({ summary: '获取慢接口列表' })
  @ApiQuery({ name: 'threshold', required: false, type: Number, description: '响应时间阈值(ms)' })
  async getSlowApis(@Query('threshold') threshold?: number) {
    return this.apiMonitorService.getSlowApis(threshold || 1000);
  }

  @Get('high-error-rate')
  @ApiOperation({ summary: '获取高错误率接口' })
  @ApiQuery({ name: 'threshold', required: false, type: Number, description: '错误率阈值(%)' })
  async getHighErrorRateApis(@Query('threshold') threshold?: number) {
    return this.apiMonitorService.getHighErrorRateApis(threshold || 5);
  }

  @Get('trend')
  @ApiOperation({ summary: '获取API调用趋势(24小时)' })
  async getTrend() {
    return this.apiMonitorService.getApiTrend();
  }

  @Get('status-distribution')
  @ApiOperation({ summary: '获取状态码分布' })
  async getStatusDistribution() {
    return this.apiMonitorService.getStatusCodeDistribution();
  }

  @Delete('metrics')
  @ApiOperation({ summary: '清除API统计数据' })
  async clearMetrics() {
    return this.apiMonitorService.clearMetrics();
  }
}
