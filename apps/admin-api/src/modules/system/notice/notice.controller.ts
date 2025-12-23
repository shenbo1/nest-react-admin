import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NoticeService } from './notice.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { QueryNoticeDto } from './dto/query-notice.dto';
import { RequirePermissions } from '@/common/decorators';

@ApiTags('通知公告')
@ApiBearerAuth()
@Controller('system/notice')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Post()
  @ApiOperation({ summary: '创建公告' })
  @RequirePermissions('system:notice:add')
  create(@Body() createNoticeDto: CreateNoticeDto) {
    return this.noticeService.create(createNoticeDto);
  }

  @Get()
  @ApiOperation({ summary: '公告列表' })
  @RequirePermissions('system:notice:list')
  findAll(@Query() query: QueryNoticeDto) {
    return this.noticeService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '公告详情' })
  @RequirePermissions('system:notice:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.noticeService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新公告' })
  @RequirePermissions('system:notice:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoticeDto: UpdateNoticeDto,
  ) {
    return this.noticeService.update(id, updateNoticeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除公告' })
  @RequirePermissions('system:notice:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.noticeService.remove(id);
  }
}
