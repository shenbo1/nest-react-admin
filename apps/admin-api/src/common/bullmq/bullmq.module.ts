import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { BullConfigService } from './bullmq.service';
import { redisConfig, type RedisConfig } from '@/config';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [redisConfig.KEY],
      useFactory: (config: RedisConfig) => ({
        connection: {
          host: config.host ?? 'localhost',
          port: config.port ?? 6379,
          password: config.password,
        },
      }),
    }),
  ],
  providers: [BullConfigService],
  exports: [BullConfigService, BullModule],
})
export class BullmqModule {}
