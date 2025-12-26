import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DatabaseMonitorService } from './database-monitor.service';

@ApiTags('数据库监控')
@ApiBearerAuth()
@Controller('monitor/database')
export class DatabaseMonitorController {
  constructor(private readonly databaseMonitorService: DatabaseMonitorService) {}

  @Get('info')
  @ApiOperation({ summary: '获取数据库基本信息' })
  async getDatabaseInfo() {
    return this.databaseMonitorService.getDatabaseInfo();
  }

  @Get('tables')
  @ApiOperation({ summary: '获取表信息' })
  async getTableInfo() {
    return this.databaseMonitorService.getTableInfo();
  }

  @Get('connections')
  @ApiOperation({ summary: '获取当前连接列表' })
  async getConnections() {
    return this.databaseMonitorService.getConnections();
  }

  @Get('connection-pool')
  @ApiOperation({ summary: '获取连接池状态' })
  async getConnectionPoolStatus() {
    return this.databaseMonitorService.getConnectionPoolStatus();
  }

  @Get('slow-queries')
  @ApiOperation({ summary: '获取慢查询列表' })
  async getSlowQueries() {
    return this.databaseMonitorService.getSlowQueries();
  }

  @Get('indexes')
  @ApiOperation({ summary: '获取索引使用情况' })
  async getIndexUsage() {
    return this.databaseMonitorService.getIndexUsage();
  }

  @Get('unused-indexes')
  @ApiOperation({ summary: '获取未使用的索引' })
  async getUnusedIndexes() {
    return this.databaseMonitorService.getUnusedIndexes();
  }

  @Get('locks')
  @ApiOperation({ summary: '获取锁信息' })
  async getLocks() {
    return this.databaseMonitorService.getLocks();
  }

  @Post('connections/:pid/terminate')
  @ApiOperation({ summary: '终止指定连接' })
  async terminateConnection(@Param('pid', ParseIntPipe) pid: number) {
    return this.databaseMonitorService.terminateConnection(pid);
  }

  @Get('table/:name/columns')
  @ApiOperation({ summary: '获取表列信息' })
  async getTableColumns(@Param('name') name: string) {
    return this.databaseMonitorService.getTableColumns(name);
  }
}
