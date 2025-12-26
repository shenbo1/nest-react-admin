import { Injectable } from '@nestjs/common';
import { RedisService } from '@/common/redis/redis.service';
import { PROTECTED_KEY_PREFIXES, isProtectedKey } from '@/common/constants/redis-keys.constant';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  /**
   * 获取受保护的缓存键前缀列表
   */
  getProtectedKeyPrefixes(): string[] {
    return [...PROTECTED_KEY_PREFIXES];
  }

  async getInfo(): Promise<Record<string, any>> {
    const [info, memory, clients, dbSize] = await Promise.all([
      this.redis.getInfo(),
      this.redis.getMemoryUsage(),
      this.redis.getConnectedClients(),
      this.redis.getDbSize(),
    ]);

    return {
      version: info.redis_version || 'Unknown',
      mode: info.redis_mode || 'Unknown',
      os: info.os || 'Unknown',
      architecture: info.arch_bits ? `${info.arch_bits}bit` : 'Unknown',
      tcpPort: info.tcp_port || 'Unknown',
      uptime: info.uptime_in_days ? `${info.uptime_in_days}天` : 'Unknown',
      memory: memory,
      connectedClients: clients,
      dbSize,
    };
  }

  async getKeys(pattern: string = '*'): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async getKeyInfo(key: string): Promise<Record<string, any>> {
    const type = await this.getKeyType(key);
    let value: any;
    let size = 0;

    switch (type) {
      case 'string':
        value = await this.redis.get(key);
        size = value ? Buffer.byteLength(value, 'utf8') : 0;
        break;
      case 'hash':
        value = await this.redis.hgetall(key);
        size = Object.values(value as Record<string, string>).reduce(
          (acc: number, v: string) => acc + Buffer.byteLength(v, 'utf8'),
          0,
        );
        break;
      case 'list':
        value = await this.redis.lrange(key, 0, -1);
        size = (value as string[]).reduce(
          (acc: number, v: string) => acc + Buffer.byteLength(v, 'utf8'),
          0,
        );
        break;
      case 'set':
        value = await this.redis.smembers(key);
        size = (value as string[]).reduce(
          (acc: number, v: string) => acc + Buffer.byteLength(v, 'utf8'),
          0,
        );
        break;
      case 'zset':
        value = await this.redis.zrange(key, 0, -1);
        size = (value as string[]).reduce(
          (acc: number, v: string) => acc + Buffer.byteLength(v, 'utf8'),
          0,
        );
        break;
      default:
        value = 'Unknown type';
    }

    const ttl = await this.redis.ttl(key);

    return {
      key,
      type,
      value: type === 'string' ? this.truncateValue(value) : value,
      ttl: ttl === -1 ? '永久' : `${ttl}秒`,
      size: this.formatSize(size),
    };
  }

  async getKeyType(key: string): Promise<string> {
    const exists = await this.redis.exists(key);
    if (!exists) {
      return 'none';
    }

    const type = await this.redis.getClient().type(key);
    return type || 'string';
  }

  async deleteKey(key: string): Promise<boolean> {
    // 检查是否是受保护的键
    if (isProtectedKey(key)) {
      throw new Error(`缓存键 "${key}" 是系统关键缓存，不能删除`);
    }
    const result = await this.redis.del(key);
    return result > 0;
  }

  async deleteKeys(keys: string[]): Promise<number> {
    if (!keys.length) return 0;
    let count = 0;
    const errors: string[] = [];

    for (const key of keys) {
      try {
        // 检查是否是受保护的键
        if (isProtectedKey(key)) {
          errors.push(`缓存键 "${key}" 是系统关键缓存，不能删除`);
          continue;
        }
        count += await this.redis.del(key);
      } catch (error) {
        errors.push(`删除缓存键 "${key}" 失败: ${error.message}`);
      }
    }

    // 如果有错误，抛出异常
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    return count;
  }

  async flushAll(): Promise<string> {
    // 获取所有键
    const allKeys = await this.redis.keys('*');

    // 筛选出非保护键
    const deletableKeys = allKeys.filter((key) => !isProtectedKey(key));

    if (deletableKeys.length === 0) {
      throw new Error('没有可删除的缓存键，所有键都是系统关键缓存');
    }

    // 删除所有非保护键
    let deletedCount = 0;
    for (const key of deletableKeys) {
      deletedCount += await this.redis.del(key);
    }

    return `成功清空 ${deletedCount} 个缓存键（跳过了 ${allKeys.length - deletableKeys.length} 个系统关键缓存）`;
  }

  async getValue(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async setValue(
    key: string,
    value: string,
    expireSeconds?: number,
  ): Promise<void> {
    await this.redis.set(key, value, expireSeconds);
  }

  private truncateValue(value: string, maxLength: number = 200): string {
    if (!value) return '';
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength) + '...';
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
