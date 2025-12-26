import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './redis.service';
import { REDIS_KEY_PREFIX, generateRedisKey } from '@/common/constants/redis-keys.constant';

@Injectable()
export class TokenBlacklistService {
  private readonly BLACKLIST_PREFIX = REDIS_KEY_PREFIX.TOKEN_BLACKLIST;

  constructor(
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 将 token 加入黑名单
   */
  async addToBlacklist(token: string, reason: string = '未知原因'): Promise<void> {
    try {
      const payload = this.jwtService.decode(token) as any;
      const ttl = payload?.exp ? payload.exp - Math.floor(Date.now() / 1000) : 86400;

      const blacklistKey = `${this.BLACKLIST_PREFIX}${token}`;
      await this.redis.hset(blacklistKey, 'reason', reason);
      await this.redis.hset(blacklistKey, 'timestamp', new Date().toISOString());
      await this.redis.expire(blacklistKey, Math.max(ttl, 86400));
    } catch (error) {
      console.error('添加 token 到黑名单失败:', error);
    }
  }

  /**
   * 检查 token 是否在黑名单中
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const blacklistKey = `${this.BLACKLIST_PREFIX}${token}`;
    return this.redis.exists(blacklistKey);
  }

  /**
   * 获取黑名单中的 token 信息
   */
  async getBlacklistInfo(token: string): Promise<{ reason: string; timestamp: string } | null> {
    const blacklistKey = `${this.BLACKLIST_PREFIX}${token}`;
    const info = await this.redis.hgetall(blacklistKey);
    if (!info || !info.reason) {
      return null;
    }
    return {
      reason: info.reason,
      timestamp: info.timestamp,
    };
  }

  /**
   * 批量将 token 加入黑名单
   */
  async addMultipleToBlacklist(tokens: string[], reason: string): Promise<number> {
    let count = 0;
    for (const token of tokens) {
      await this.addToBlacklist(token, reason);
      count++;
    }
    return count;
  }
}
