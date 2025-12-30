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
import { StartFlowDto, QueryFlowInstanceDto } from './dto';
import { StartFlowCommand } from '../commands/instance/start-flow.command';
import { CancelFlowCommand } from '../commands/instance/cancel-flow.command';
import { TerminateFlowCommand } from '../commands/instance/terminate-flow.command';
import { GetFlowInstancesQuery } from '../queries/instance/get-flow-instances.query';
import { GetMyInitiatedQuery } from '../queries/instance/get-my-initiated.query';
import { GetFlowInstanceQuery } from '../queries/instance/get-flow-instance.query';
import { GetFlowProgressQuery } from '../queries/instance/get-flow-progress.query';

@ApiTags('流程实例')
@ApiBearerAuth()
@Controller('workflow/instance')
export class FlowInstanceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly cls: ClsService,
  ) {}

  @Post('start')
  @ApiOperation({ summary: '发起流程' })
  async start(@Body() dto: StartFlowDto) {
    const user = this.cls.get('user');
    return this.commandBus.execute(
      new StartFlowCommand(dto, {
        id: user.id,
        name: user.nickname || user.username,
        deptId: user.deptId,
        deptName: user.deptName,
      }),
    );
  }

  @Get()
  @ApiOperation({ summary: '查询流程实例列表' })
  @RequirePermissions('workflow:instance:list')
  findAll(@Query() query: QueryFlowInstanceDto) {
    return this.queryBus.execute(new GetFlowInstancesQuery(query));
  }

  @Get('my-initiated')
  @ApiOperation({ summary: '我发起的流程' })
  findMyInitiated(@Query() query: QueryFlowInstanceDto) {
    const user = this.cls.get('user');
    return this.queryBus.execute(new GetMyInitiatedQuery(user.id, query));
  }

  @Get(':id')
  @ApiOperation({ summary: '查询流程实例详情' })
  @RequirePermissions('workflow:instance:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.queryBus.execute(new GetFlowInstanceQuery(id));
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '撤回流程' })
  @RequirePermissions('workflow:instance:query')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body('comment') comment?: string,
  ) {
    const user = this.cls.get('user');
    return this.commandBus.execute(new CancelFlowCommand(id, user.id, comment));
  }

  @Post(':id/terminate')
  @ApiOperation({ summary: '终止流程（管理员）' })
  @RequirePermissions('workflow:instance:terminate')
  async terminate(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
  ) {
    const user = this.cls.get('user');
    return this.commandBus.execute(
      new TerminateFlowCommand(id, user.id, user.nickname || user.username, reason),
    );
  }

  @Get(':id/progress')
  @ApiOperation({ summary: '获取流程进度' })
  @RequirePermissions('workflow:instance:query')
  getProgress(@Param('id', ParseIntPipe) id: number) {
    return this.queryBus.execute(new GetFlowProgressQuery(id));
  }
}
