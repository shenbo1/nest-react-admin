import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { GroupBuyMemberService } from './group-buy-member.service';
import { QueryGroupBuyMemberDto } from './dto/query-group-buy-member.dto';

@ApiTags('拼团成员管理')
@Controller('marketing/group-buy-member')
export class GroupBuyMemberController {
  constructor(private readonly groupBuyMemberService: GroupBuyMemberService) {}

  @ApiOperation({ summary: '获取拼团成员列表' })
  @RequirePermissions('marketing:group-buy-member:list')
  @Get()
  findAll(@Query() query: QueryGroupBuyMemberDto) {
    return this.groupBuyMemberService.findAll(query);
  }

  @ApiOperation({ summary: '获取统计数据' })
  @RequirePermissions('marketing:group-buy-member:list')
  @Get('stats')
  getStats() {
    return this.groupBuyMemberService.getStats();
  }

  @ApiOperation({ summary: '获取拼团成员详情' })
  @RequirePermissions('marketing:group-buy-member:query')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupBuyMemberService.findOne(id);
  }

  @ApiOperation({ summary: '获取指定团单的成员' })
  @RequirePermissions('marketing:group-buy-member:list')
  @Get('by-order/:groupOrderId')
  findByGroupOrder(@Param('groupOrderId', ParseIntPipe) groupOrderId: number) {
    return this.groupBuyMemberService.findByGroupOrder(groupOrderId);
  }
}
