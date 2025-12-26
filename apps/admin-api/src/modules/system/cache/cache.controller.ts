import {
  Controller,
  Get,
  Delete,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CacheService } from './cache.service';
import { RequirePermissions } from '@/common/decorators';

@ApiTags('缓存管理')
@ApiBearerAuth()
@Controller('system/cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Get('info')
  @ApiOperation({ summary: '获取 Redis 缓存信息' })
  @RequirePermissions('system:cache:query')
  getInfo() {
    return this.cacheService.getInfo();
  }

  @Get('keys')
  @ApiOperation({ summary: '获取缓存键列表' })
  @RequirePermissions('system:cache:query')
  getKeys(@Query('pattern') pattern?: string) {
    return this.cacheService.getKeys(pattern);
  }

  @Get('key-info')
  @ApiOperation({ summary: '获取缓存键详细信息' })
  @RequirePermissions('system:cache:query')
  async getKeyInfo(@Query('key') key: string) {
    return this.cacheService.getKeyInfo(key);
  }

  @Get('protected-prefixes')
  @ApiOperation({ summary: '获取受保护的缓存键前缀列表' })
  @RequirePermissions('system:cache:query')
  getProtectedPrefixes() {
    return this.cacheService.getProtectedKeyPrefixes();
  }

  @Get('key-type')
  @ApiOperation({ summary: '获取缓存键类型' })
  @RequirePermissions('system:cache:query')
  async getKeyType(@Query('key') key: string) {
    const type = await this.cacheService.getKeyType(key);
    return { key, type };
  }

  @Get('value')
  @ApiOperation({ summary: '获取缓存键值' })
  @RequirePermissions('system:cache:query')
  async getValue(@Query('key') key: string) {
    const value = await this.cacheService.getValue(key);
    return { key, value };
  }

  @Post('value')
  @ApiOperation({ summary: '设置缓存键值' })
  @RequirePermissions('system:cache:edit')
  async setValue(
    @Body() body: { key: string; value: string; expireSeconds?: number },
  ) {
    await this.cacheService.setValue(body.key, body.value, body.expireSeconds);
    return { message: '设置成功' };
  }

  @Delete('key')
  @ApiOperation({ summary: '删除缓存键' })
  @RequirePermissions('system:cache:remove')
  async deleteKey(@Query('key') key: string) {
    const result = await this.cacheService.deleteKey(key);
    return { message: result ? '删除成功' : '键不存在' };
  }

  @Delete('keys')
  @ApiOperation({ summary: '批量删除缓存键' })
  @RequirePermissions('system:cache:remove')
  async deleteKeys(@Body() body: { keys: string[] }) {
    const count = await this.cacheService.deleteKeys(body.keys);
    return { message: `成功删除 ${count} 个键` };
  }

  @Delete('flush')
  @ApiOperation({ summary: '清空所有缓存' })
  @RequirePermissions('system:cache:remove')
  async flushAll() {
    await this.cacheService.flushAll();
    return { message: '缓存已清空' };
  }
}
