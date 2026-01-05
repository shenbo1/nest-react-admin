import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { SignInService } from './sign-in.service';
import { QuerySignInDto } from './dto/query-sign-in.dto';

@ApiTags('签到记录管理')
@Controller('marketing/sign-in')
export class SignInController {
  constructor(private readonly signInService: SignInService) {}

  @ApiOperation({ summary: '获取签到记录列表' })
  @RequirePermissions('marketing:sign-in:list')
  @Get()
  findAll(@Query() query: QuerySignInDto) {
    return this.signInService.findAll(query);
  }

  @ApiOperation({ summary: '获取签到记录详情' })
  @RequirePermissions('marketing:sign-in:query')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.signInService.findOne(id);
  }

  @ApiOperation({ summary: '获取按日期统计的签到数据' })
  @RequirePermissions('marketing:sign-in:list')
  @Get('stats/by-date')
  getStatsByDate(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.signInService.getStatsByDate(new Date(startDate), new Date(endDate));
  }

  @ApiOperation({ summary: '获取月度签到统计' })
  @RequirePermissions('marketing:sign-in:list')
  @Get('stats/monthly')
  getMonthlyStats(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.signInService.getMonthlyStats(year, month);
  }

  @ApiOperation({ summary: '获取会员签到排行榜' })
  @RequirePermissions('marketing:sign-in:list')
  @Get('stats/ranking')
  getMemberRanking(
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.signInService.getMemberRanking(limit);
  }
}