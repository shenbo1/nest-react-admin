import { Injectable } from '@nestjs/common';
import { RedisService } from '@/common/redis/redis.service';
import { TokenBlacklistService } from '@/common/redis/token-blacklist.service';
import { PrismaService } from '@/common/prisma/prisma.service';
import { REDIS_KEY_PREFIX, generateRedisKey, getBlacklistRedisKeys } from '@/common/constants/redis-keys.constant';

@Injectable()
export class SessionService {
  // Redis key 前缀
  private readonly SESSION_PREFIX = REDIS_KEY_PREFIX.USER_SESSION;
  private readonly ONLINE_USERS_KEY = generateRedisKey(REDIS_KEY_PREFIX.ONLINE_USER, 'list');
  private readonly USER_SESSIONS_PREFIX = generateRedisKey(REDIS_KEY_PREFIX.USER, 'sessions');

  constructor(
    private readonly redis: RedisService,
    private readonly blacklistService: TokenBlacklistService,
    private readonly prisma: PrismaService,
  ) {}

  // ==================== 会话管理 ====================

  /**
   * 创建会话（用户登录时调用）
   */
  async createSession(
    userId: number,
    username: string,
    token: string,
    ip: string,
    device: string = 'Unknown',
  ): Promise<void> {
    const now = new Date().toISOString();
    const sessionKey = generateRedisKey(this.SESSION_PREFIX, userId);
    const userSessionsKey = generateRedisKey(this.USER_SESSIONS_PREFIX, userId);

    // 存储会话信息
    await this.redis.hset(sessionKey, 'token', token);
    await this.redis.hset(sessionKey, 'userId', userId.toString());
    await this.redis.hset(sessionKey, 'username', username);
    await this.redis.hset(sessionKey, 'loginTime', now);
    await this.redis.hset(sessionKey, 'ip', ip);
    await this.redis.hset(sessionKey, 'device', device);

    // 设置会话过期时间（与 JWT 过期时间一致，7天）
    await this.redis.expire(sessionKey, 7 * 24 * 60 * 60);

    // 添加到用户的会话列表
    await this.redis.sadd(userSessionsKey, token);
    await this.redis.expire(userSessionsKey, 7 * 24 * 60 * 60);

    // 添加到在线用户集合
    await this.redis.sadd(this.ONLINE_USERS_KEY, userId.toString());
  }

  /**
   * 获取所有在线用户
   */
  async getOnlineUsers(): Promise<any[]> {
    const userIds = await this.redis.smembers(this.ONLINE_USERS_KEY);
    const users: any[] = [];

    for (const userId of userIds) {
      const user = await this.getUserSessionInfo(parseInt(userId, 10));
      if (user) {
        users.push(user);
      }
    }

    return users;
  }

  /**
   * 获取单个用户的会话信息
   */
  async getUserSessionInfo(userId: number): Promise<any | null> {
    const sessionKey = `${this.SESSION_PREFIX}${userId}`;
    const session = await this.redis.hgetall(sessionKey);

    if (!session || !session.userId) {
      return null;
    }

    // 获取用户信息
    const user = await this.prisma.sysUser.findFirst({
      where: { id: userId, deleted: false },
      include: { dept: true },
    });

    if (!user) {
      return null;
    }

    // 获取该用户的会话数量
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionCount = await this.redis.scard(userSessionsKey);

    return {
      userId: parseInt(session.userId, 10),
      username: session.username,
      nickname: user.nickname,
      deptName: user.dept?.name || '未知部门',
      loginTime: session.loginTime,
      ip: session.ip,
      device: session.device,
      sessionCount,
    };
  }

  /**
   * 移除会话（用户登出时调用）
   */
  async removeSession(userId: number, token: string): Promise<void> {
    const sessionKey = generateRedisKey(this.SESSION_PREFIX, userId);
    const userSessionsKey = generateRedisKey(this.USER_SESSIONS_PREFIX, userId);

    // 删除会话信息
    await this.redis.del(sessionKey);

    // 从用户会话列表中移除
    await this.redis.srem(userSessionsKey, token);

    // 如果该用户没有其他会话，从在线用户集合中移除
    const remainingSessions = await this.redis.scard(userSessionsKey);
    if (remainingSessions === 0) {
      await this.redis.srem(this.ONLINE_USERS_KEY, userId.toString());
      await this.redis.del(userSessionsKey);
    }
  }

  /**
   * 踢出用户的所有会话
   */
  async kickUser(userId: number, reason?: string): Promise<number> {
    const userSessionsKey = generateRedisKey(this.USER_SESSIONS_PREFIX, userId);
    const tokens = await this.redis.smembers(userSessionsKey);

    // 将所有 token 加入黑名单
    for (const token of tokens) {
      await this.blacklistService.addToBlacklist(token, reason || '被管理员踢出');
    }

    // 删除会话信息
    const sessionKey = generateRedisKey(this.SESSION_PREFIX, userId);
    await this.redis.del(sessionKey);
    await this.redis.del(userSessionsKey);

    // 从在线用户集合中移除
    await this.redis.srem(this.ONLINE_USERS_KEY, userId.toString());

    return tokens.length;
  }

  /**
   * 踢出指定会话（单个设备）
   */
  async kickSession(userId: number, token: string): Promise<boolean> {
    const userSessionsKey = generateRedisKey(this.USER_SESSIONS_PREFIX, userId);
    const isMember = await this.redis.sismember(
      userSessionsKey,
      token,
    );

    if (!isMember) {
      return false;
    }

    // 将 token 加入黑名单
    await this.blacklistService.addToBlacklist(token, '被管理员踢出');

    // 移除该会话
    await this.removeSession(userId, token);

    return true;
  }

  /**
   * 批量踢出用户
   */
  async kickUsers(userIds: number[], reason?: string): Promise<Record<number, number>> {
    const results: Record<number, number> = {};

    for (const userId of userIds) {
      results[userId] = await this.kickUser(userId, reason);
    }

    return results;
  }

  // ==================== Token 黑名单代理方法 ====================

  /**
   * 检查 token 是否在黑名单中
   */
  async isBlacklisted(token: string): Promise<boolean> {
    return this.blacklistService.isBlacklisted(token);
  }

  /**
   * 获取黑名单中的 token 数量
   */
  async getBlacklistCount(): Promise<number> {
    // 近似计算
    const blacklistKeys = getBlacklistRedisKeys();
    const count = await this.redis.scard(blacklistKeys.blacklistTokens);
    return count;
  }

  /**
   * 检查用户是否在线
   */
  async isUserOnline(userId: number): Promise<boolean> {
    return this.redis.sismember(this.ONLINE_USERS_KEY, userId.toString());
  }

  /**
   * 获取在线用户数量
   */
  async getOnlineCount(): Promise<number> {
    return this.redis.scard(this.ONLINE_USERS_KEY);
  }
}
