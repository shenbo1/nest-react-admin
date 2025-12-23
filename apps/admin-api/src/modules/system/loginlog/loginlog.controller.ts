import {
  Controller,
  Get,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoginLogService } from './loginlog.service';
import { QueryLoginLogDto } from './dto/query-loginlog.dto';
import { RequirePermissions } from '@/common/decorators';

@ApiTags('登录日志')
@ApiBearerAuth()
@Controller('system/loginlog')
export class LoginLogController {
  constructor(private readonly loginLogService: LoginLogService) {}

  @Get()
  @ApiOperation({ summary: '登录日志列表' })
  @RequirePermissions('system:loginlog:list')
  findAll(@Query() query: QueryLoginLogDto) {
    return this.loginLogService.findAll(query);
  }

  @Delete()
  @ApiOperation({ summary: '删除登录日志' })
  @RequirePermissions('system:loginlog:remove')
  remove(@Query('ids') ids: string) {
    return this.loginLogService.remove(ids);
  }
}
