import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ClsService } from 'nestjs-cls';
import { RequirePermissions } from '@/common/decorators';
import { TaskService } from './task.service';
import {
  ApproveTaskDto,
  RejectTaskDto,
  TransferTaskDto,
  CountersignTaskDto,
  QueryTaskDto,
} from './dto';
import { ApproveTaskCommand } from '../commands/task/approve-task.command';
import { RejectTaskCommand } from '../commands/task/reject-task.command';
import { TransferTaskCommand } from '../commands/task/transfer-task.command';
import { CountersignTaskCommand } from '../commands/task/countersign-task.command';
import { UrgeTaskCommand } from '../commands/task/urge-task.command';
import { GetPendingTasksQuery } from '../queries/task/get-pending-tasks.query';
import { GetCompletedTasksQuery } from '../queries/task/get-completed-tasks.query';

@ApiTags('审批任务')
@ApiBearerAuth()
@Controller('workflow/task')
export class TaskController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly taskService: TaskService,
    private readonly cls: ClsService,
  ) {}

  @Get('pending')
  @ApiOperation({ summary: '待我审批的任务' })
  @RequirePermissions('workflow:task:list')
  findPending(@Query() query: QueryTaskDto) {
    const user = this.cls.get('user');
    return this.queryBus.execute(new GetPendingTasksQuery(user.id, query));
  }

  @Get('completed')
  @ApiOperation({ summary: '我已审批的任务' })
  @RequirePermissions('workflow:task:list')
  findCompleted(@Query() query: QueryTaskDto) {
    const user = this.cls.get('user');
    return this.queryBus.execute(new GetCompletedTasksQuery(user.id, query));
  }

  @Get(':id')
  @ApiOperation({ summary: '任务详情' })
  @RequirePermissions('workflow:task:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '通过审批' })
  @RequirePermissions('workflow:task:approve')
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveTaskDto,
  ) {
    const user = this.cls.get('user');
    return this.commandBus.execute(
      new ApproveTaskCommand(id, user.id, user.nickname || user.username, dto),
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '驳回审批' })
  @RequirePermissions('workflow:task:reject')
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectTaskDto,
  ) {
    const user = this.cls.get('user');
    return this.commandBus.execute(
      new RejectTaskCommand(id, user.id, user.nickname || user.username, dto),
    );
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: '转办' })
  @RequirePermissions('workflow:task:transfer')
  async transfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferTaskDto,
  ) {
    const user = this.cls.get('user');
    return this.commandBus.execute(
      new TransferTaskCommand(id, user.id, user.nickname || user.username, dto),
    );
  }

  @Post(':id/countersign')
  @ApiOperation({ summary: '加签' })
  @RequirePermissions('workflow:task:countersign')
  async countersign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CountersignTaskDto,
  ) {
    const user = this.cls.get('user');
    return this.commandBus.execute(
      new CountersignTaskCommand(id, user.id, user.nickname || user.username, dto),
    );
  }

  @Post(':id/urge')
  @ApiOperation({ summary: '催办' })
  @RequirePermissions('workflow:task:query')
  async urge(
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment?: string,
  ) {
    const user = this.cls.get('user');
    return this.commandBus.execute(
      new UrgeTaskCommand(
        id,
        user.id,
        user.nickname || user.username,
        comment,
      ),
    );
  }
}
