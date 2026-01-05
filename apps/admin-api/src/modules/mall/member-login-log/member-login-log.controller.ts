import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MemberLoginLogService } from './member-login-log.service';
import { QueryMemberLoginLogDto } from './dto/query-member-login-log.dto';
import { RequirePermissions } from '@/common/decorators';

import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('会员登录日志')
@Controller('mall/member-login-log')
export class MemberLoginLogController {
  constructor(private readonly memberLoginLogService: MemberLoginLogService) {}

  @ApiOperation({ summary: '分页查询登录日志' })
  @RequirePermissions('member:login-log:list')
  @Get()
  findAll(@Query() query: QueryMemberLoginLogDto) {
    return this.memberLoginLogService.findAll(query);
  }

  @ApiOperation({ summary: '获取会员的登录日志' })
  @RequirePermissions('member:login-log:list')
  @Get('member/:memberId')
  findByMemberId(@Param('memberId', ParseIntPipe) memberId: number) {
    return this.memberLoginLogService.findByMemberId(memberId);
  }

  @ApiOperation({ summary: '删除登录日志' })
  @RequirePermissions('member:login-log:remove')
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.memberLoginLogService.remove(id, userId);
  }

  @ApiOperation({ summary: '批量删除登录日志' })
  @RequirePermissions('member:login-log:remove')
  @Delete('batch')
  batchRemove(@Body('ids') ids: number[], @CurrentUser('id') userId: number) {
    return this.memberLoginLogService.batchRemove(ids, userId);
  }

  @ApiOperation({ summary: '清空登录日志' })
  @RequirePermissions('member:login-log:remove')
  @Delete('clear/all')
  clear(@CurrentUser('id') userId: number) {
    return this.memberLoginLogService.clear(userId);
  }
}
