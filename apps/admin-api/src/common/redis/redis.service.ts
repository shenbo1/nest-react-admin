import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { redisConfig, type RedisConfig } from '@/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly config: RedisConfig,
  ) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.config.host ?? 'localhost',
      port: this.config.port ?? 6379,
      password: this.config.password || undefined,
      db: 0,
    });

    this.client.on('error', (err) => {
      console.error('Redis 连接错误:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis 连接成功');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  // ==================== 基础操作 ====================

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    if (expireSeconds) {
      await this.client.setex(key, expireSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async keys(pattern: string = '*'): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async flushdb(): Promise<string> {
    return this.client.flushdb();
  }

  // ==================== Hash 操作 ====================

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  async hdel(key: string, field: string): Promise<number> {
    return this.client.hdel(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hkeys(key: string): Promise<string[]> {
    return this.client.hkeys(key);
  }

  async hvals(key: string): Promise<string[]> {
    return this.client.hvals(key);
  }

  // ==================== List 操作 ====================

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.client.rpush(key, ...values);
  }

  async lpop(key: string): Promise<string | null> {
    return this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return this.client.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return this.client.llen(key);
  }

  // ==================== Set 操作 ====================

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  async scard(key: string): Promise<number> {
    return this.client.scard(key);
  }

  // ==================== Sorted Set 操作 ====================

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.client.zadd(key, score, member);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    return this.client.zrem(key, ...members);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrange(key, start, stop);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrevrange(key, start, stop);
  }

  async zscore(key: string, member: string): Promise<string | null> {
    return this.client.zscore(key, member);
  }

  async zcard(key: string): Promise<number> {
    return this.client.zcard(key);
  }

  // ==================== 监控信息 ====================

  async getInfo(): Promise<Record<string, string>> {
    const info = await this.client.info('all');
    const result: Record<string, string> = {};

    for (const line of info.split('\r\n')) {
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          result[key] = valueParts.join(':');
        }
      }
    }

    return result;
  }

  async getMemoryUsage(): Promise<string> {
    const info = await this.client.info('memory');
    const lines = info.split('\r\n');
    for (const line of lines) {
      if (line.startsWith('used_memory_human:')) {
        return line.split(':')[1];
      }
    }
    return 'N/A';
  }

  async getConnectedClients(): Promise<number> {
    const info = await this.client.info('clients');
    const lines = info.split('\r\n');
    for (const line of lines) {
      if (line.startsWith('connected_clients:')) {
        return parseInt(line.split(':')[1], 10);
      }
    }
    return 0;
  }

  async getDbSize(): Promise<number> {
    return this.client.dbsize();
  }
}
