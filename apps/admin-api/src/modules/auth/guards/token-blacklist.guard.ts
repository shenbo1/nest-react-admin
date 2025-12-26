import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenBlacklistService } from '@/common/redis/token-blacklist.service';

@Injectable()
export class TokenBlacklistGuard implements CanActivate {
  constructor(
    private readonly blacklistService: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      return true;
    }

    // 检查 token 是否在黑名单中
    const isBlacklisted = await this.blacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      const info = await this.blacklistService.getBlacklistInfo(token);
      throw new UnauthorizedException(
        `您的账号已被踢出${info?.reason ? `：${info.reason}` : ''}`,
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
