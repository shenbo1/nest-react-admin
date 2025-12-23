import {
  Controller,
  Get,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OperLogService } from './operlog.service';
import { QueryOperLogDto } from './dto/query-operlog.dto';
import { RequirePermissions } from '@/common/decorators';

@ApiTags('操作日志')
@ApiBearerAuth()
@Controller('system/operlog')
export class OperLogController {
  constructor(private readonly operLogService: OperLogService) {}

  @Get()
  @ApiOperation({ summary: '操作日志列表' })
  @RequirePermissions('system:operlog:list')
  findAll(@Query() query: QueryOperLogDto) {
    return this.operLogService.findAll(query);
  }

  @Delete()
  @ApiOperation({ summary: '删除操作日志' })
  @RequirePermissions('system:operlog:remove')
  remove(@Query('ids') ids: string) {
    return this.operLogService.remove(ids);
  }
}
