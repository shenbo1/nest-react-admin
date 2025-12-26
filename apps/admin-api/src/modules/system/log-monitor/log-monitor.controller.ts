import { Controller, Get, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LogMonitorService } from './log-monitor.service';

@ApiTags('日志监控')
@ApiBearerAuth()
@Controller('system/log-monitor')
export class LogMonitorController {
  constructor(private readonly logMonitorService: LogMonitorService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取日志统计概览' })
  async getOverview() {
    return this.logMonitorService.getLogOverview();
  }

  @Get('login-trend')
  @ApiOperation({ summary: '获取登录日志趋势(30天)' })
  async getLoginTrend() {
    return this.logMonitorService.getLoginLogTrend();
  }

  @Get('oper-trend')
  @ApiOperation({ summary: '获取操作日志趋势(30天)' })
  async getOperTrend() {
    return this.logMonitorService.getOperLogTrend();
  }

  @Get('login-status-distribution')
  @ApiOperation({ summary: '获取登录状态分布' })
  async getLoginStatusDistribution() {
    return this.logMonitorService.getLoginStatusDistribution();
  }

  @Get('oper-type-distribution')
  @ApiOperation({ summary: '获取操作类型分布' })
  async getOperTypeDistribution() {
    return this.logMonitorService.getOperTypeDistribution();
  }

  @Get('oper-status-distribution')
  @ApiOperation({ summary: '获取操作状态分布' })
  async getOperStatusDistribution() {
    return this.logMonitorService.getOperStatusDistribution();
  }

  @Get('login-location-distribution')
  @ApiOperation({ summary: '获取登录地点分布' })
  async getLoginLocationDistribution() {
    return this.logMonitorService.getLoginLocationDistribution();
  }

  @Get('browser-distribution')
  @ApiOperation({ summary: '获取浏览器分布' })
  async getBrowserDistribution() {
    return this.logMonitorService.getBrowserDistribution();
  }

  @Get('os-distribution')
  @ApiOperation({ summary: '获取操作系统分布' })
  async getOsDistribution() {
    return this.logMonitorService.getOsDistribution();
  }

  @Get('top-operators')
  @ApiOperation({ summary: '获取操作用户排行' })
  async getTopOperators() {
    return this.logMonitorService.getTopOperators();
  }

  @Get('recent-errors')
  @ApiOperation({ summary: '获取最近错误日志' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentErrors(@Query('limit') limit?: number) {
    return this.logMonitorService.getRecentErrors(limit || 50);
  }

  @Delete('cleanup')
  @ApiOperation({ summary: '清理过期日志' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: '保留天数，默认90天' })
  async cleanupLogs(@Query('days') days?: number) {
    return this.logMonitorService.cleanupLogs(days || 90);
  }
}
