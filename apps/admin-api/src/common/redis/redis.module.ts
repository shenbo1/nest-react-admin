import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [RedisService, TokenBlacklistService],
  exports: [RedisService, TokenBlacklistService],
})
export class RedisModule {}
