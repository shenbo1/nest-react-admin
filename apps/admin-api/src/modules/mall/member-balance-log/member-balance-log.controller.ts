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
import { MemberBalanceLogService } from './member-balance-log.service';
import { QueryMemberBalanceLogDto } from './dto/query-member-balance-log.dto';
import { CreateMemberBalanceLogDto } from './dto/create-member-balance-log.dto';
import { RequirePermissions, CurrentUser } from '@/common/decorators';

@ApiTags('会员余额流水')
@Controller('mall/member-balance-log')
export class MemberBalanceLogController {
  constructor(
    private readonly memberBalanceLogService: MemberBalanceLogService,
  ) {}

  @ApiOperation({ summary: '分页查询余额流水' })
  @RequirePermissions('member:balance-log:list')
  @Get()
  findAll(@Query() query: QueryMemberBalanceLogDto) {
    return this.memberBalanceLogService.findAll(query);
  }

  @ApiOperation({ summary: '获取会员的余额流水' })
  @RequirePermissions('member:balance-log:list')
  @Get('member/:memberId')
  findByMemberId(@Param('memberId', ParseIntPipe) memberId: number) {
    return this.memberBalanceLogService.findByMemberId(memberId);
  }

  @ApiOperation({ summary: '调整会员余额' })
  @RequirePermissions('member:balance-log:adjust')
  @Post()
  create(
    @Body() dto: CreateMemberBalanceLogDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.memberBalanceLogService.create(dto, userId);
  }
}
