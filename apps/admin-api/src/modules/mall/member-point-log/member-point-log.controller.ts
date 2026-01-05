import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MemberPointLogService } from './member-point-log.service';
import { QueryMemberPointLogDto } from './dto/query-member-point-log.dto';
import { CreateMemberPointLogDto } from './dto/create-member-point-log.dto';
import { RequirePermissions } from '@/common/decorators';

import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('会员积分流水')
@Controller('mall/member-point-log')
export class MemberPointLogController {
  constructor(private readonly memberPointLogService: MemberPointLogService) {}

  @ApiOperation({ summary: '分页查询积分流水' })
  @RequirePermissions('member:point-log:list')
  @Get()
  findAll(@Query() query: QueryMemberPointLogDto) {
    return this.memberPointLogService.findAll(query);
  }

  @ApiOperation({ summary: '获取会员的积分流水' })
  @RequirePermissions('member:point-log:list')
  @Get('member/:memberId')
  findByMemberId(@Param('memberId', ParseIntPipe) memberId: number) {
    return this.memberPointLogService.findByMemberId(memberId);
  }

  @ApiOperation({ summary: '调整会员积分' })
  @RequirePermissions('member:point-log:adjust')
  @Post()
  create(
    @Body() dto: CreateMemberPointLogDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.memberPointLogService.create(dto, userId);
  }
}
