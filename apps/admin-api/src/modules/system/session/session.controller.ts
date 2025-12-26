import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { RequirePermissions } from '@/common/decorators';

@ApiTags('在线用户管理')
@ApiBearerAuth()
@Controller('system/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('online')
  @ApiOperation({ summary: '获取在线用户列表' })
  @RequirePermissions('system:session:query')
  async getOnlineUsers() {
    const users = await this.sessionService.getOnlineUsers();
    return {
      count: users.length,
      users,
    };
  }

  @Get('count')
  @ApiOperation({ summary: '获取在线用户数量' })
  @RequirePermissions('system:session:query')
  async getOnlineCount() {
    const count = await this.sessionService.getOnlineCount();
    const blacklistCount = await this.sessionService.getBlacklistCount();
    return {
      onlineCount: count,
      blacklistCount,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户会话详情' })
  @RequirePermissions('system:session:query')
  async getUserSession(@Param('id', ParseIntPipe) id: number) {
    const session = await this.sessionService.getUserSessionInfo(id);
    if (!session) {
      return { message: '用户不在线或不存在' };
    }
    return session;
  }

  @Post(':id/kick')
  @ApiOperation({ summary: '踢出用户' })
  @RequirePermissions('system:session:kick')
  async kickUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    const count = await this.sessionService.kickUser(id, reason);
    return {
      message: `已踢出用户，成功使 ${count} 个会话失效`,
      kickedSessions: count,
    };
  }

  @Post('kick-batch')
  @ApiOperation({ summary: '批量踢出用户' })
  @RequirePermissions('system:session:kick')
  async kickUsers(
    @Body() body: { userIds: number[]; reason?: string },
  ) {
    const results = await this.sessionService.kickUsers(
      body.userIds,
      body.reason,
    );
    return {
      message: '批量踢出完成',
      results,
    };
  }

  @Get('user/:userId/kick-all')
  @ApiOperation({ summary: '踢出用户的所有会话（通过用户ID）' })
  @RequirePermissions('system:session:kick')
  async kickUserByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('reason') reason?: string,
  ) {
    const count = await this.sessionService.kickUser(userId, reason);
    return {
      message: `已踢出用户 ${userId}，成功使 ${count} 个会话失效`,
    };
  }
}
