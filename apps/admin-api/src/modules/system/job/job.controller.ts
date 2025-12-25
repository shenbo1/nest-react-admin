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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ClsService } from 'nestjs-cls';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { QueryJobLogDto } from './dto/query-job-log.dto';
import { RequirePermissions } from '@/common/decorators';
import { CreateJobCommand } from './commands/create-job.command';
import { UpdateJobCommand } from './commands/update-job.command';
import { UpdateJobStatusCommand } from './commands/update-job-status.command';
import { RunJobCommand } from './commands/run-job.command';
import { RemoveJobCommand } from './commands/remove-job.command';
import { GetJobsQuery } from './queries/get-jobs.query';
import { GetJobQuery } from './queries/get-job.query';
import { GetJobLogsQuery } from './queries/get-job-logs.query';

@ApiTags('定时任务')
@ApiBearerAuth()
@Controller('system/job')
export class JobController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly cls: ClsService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建任务' })
  @RequirePermissions('system:job:add')
  create(@Body() createJobDto: CreateJobDto) {
    return this.commandBus.execute(new CreateJobCommand(createJobDto));
  }

  @Get()
  @ApiOperation({ summary: '任务列表' })
  @RequirePermissions('system:job:list')
  findAll(@Query() query: QueryJobDto) {
    return this.queryBus.execute(new GetJobsQuery(query));
  }

  @Get(':id')
  @ApiOperation({ summary: '任务详情' })
  @RequirePermissions('system:job:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.queryBus.execute(new GetJobQuery(id));
  }

  @Put(':id')
  @ApiOperation({ summary: '更新任务' })
  @RequirePermissions('system:job:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.commandBus.execute(new UpdateJobCommand(id, updateJobDto));
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新任务状态' })
  @RequirePermissions('system:job:edit')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateJobStatusDto,
  ) {
    return this.commandBus.execute(
      new UpdateJobStatusCommand(id, body.status),
    );
  }

  @Post(':id/run')
  @ApiOperation({ summary: '立即执行任务' })
  @RequirePermissions('system:job:run')
  run(@Param('id', ParseIntPipe) id: number) {
    const user = this.cls.get('user');
    const operator =
      user?.username ?? (user?.id ? String(user.id) : undefined);
    return this.commandBus.execute(new RunJobCommand(id, operator));
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除任务' })
  @RequirePermissions('system:job:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commandBus.execute(new RemoveJobCommand(id));
  }

  @Get(':id/logs')
  @ApiOperation({ summary: '任务执行日志' })
  @RequirePermissions('system:job:log')
  logs(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryJobLogDto,
  ) {
    return this.queryBus.execute(new GetJobLogsQuery(id, query));
  }
}
