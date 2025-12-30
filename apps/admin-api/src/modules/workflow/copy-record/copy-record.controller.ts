import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import { ClsService } from 'nestjs-cls';
import { RequirePermissions } from '@/common/decorators';
import { CopyRecordService } from './copy-record.service';
import { QueryCopyRecordDto } from './dto';
import { GetCopyRecordsQuery } from '../queries/copy/get-copy-records.query';

@ApiTags('抄送记录')
@ApiBearerAuth()
@Controller('workflow/copy')
export class CopyRecordController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly copyRecordService: CopyRecordService,
    private readonly cls: ClsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '抄送给我的记录' })
  @RequirePermissions('workflow:copy:list')
  findMyCopies(@Query() query: QueryCopyRecordDto) {
    const user = this.cls.get('user');
    return this.queryBus.execute(new GetCopyRecordsQuery(user.id, query));
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读数量' })
  @RequirePermissions('workflow:copy:list')
  getUnreadCount() {
    const user = this.cls.get('user');
    return this.copyRecordService.getUnreadCount(user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: '标记为已读' })
  @RequirePermissions('workflow:copy:query')
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    const user = this.cls.get('user');
    return this.copyRecordService.markAsRead(id, user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: '全部标记为已读' })
  @RequirePermissions('workflow:copy:query')
  markAllAsRead() {
    const user = this.cls.get('user');
    return this.copyRecordService.markAllAsRead(user.id);
  }
}
