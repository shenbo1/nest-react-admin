import { Inject, Injectable } from '@nestjs/common';
import { ConnectionOptions } from 'bullmq';
import { redisConfig, type RedisConfig } from '@/config';

@Injectable()
export class BullConfigService {
  constructor(
    @Inject(redisConfig.KEY)
    private readonly redis: RedisConfig,
  ) {}

  getConnection(): ConnectionOptions {
    return {
      host: this.redis.host ?? 'localhost',
      port: this.redis.port ?? 6379,
      password: this.redis.password,
    };
  }
}
