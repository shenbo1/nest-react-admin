import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenBlacklistGuard } from './guards/token-blacklist.guard';
import { APP_GUARD } from '@nestjs/core';
import { authConfig, type AuthConfig } from '@/config';
import { SessionModule } from '@/modules/system/session/session.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: AuthConfig) => ({
        secret: config.jwtSecret!,
        signOptions: {
          expiresIn: (config.jwtExpiresIn ?? '7d') as StringValue,
        },
      }),
      inject: [authConfig.KEY],
    }),
    SessionModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Token 黑名单检查（先执行）
    {
      provide: APP_GUARD,
      useClass: TokenBlacklistGuard,
    },
    // 全局启用 JWT 认证
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
