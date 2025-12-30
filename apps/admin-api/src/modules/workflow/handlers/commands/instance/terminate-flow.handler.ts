import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TerminateFlowCommand } from '../../../commands/instance/terminate-flow.command';
import { FlowInstanceService } from '../../../flow-instance/flow-instance.service';

@CommandHandler(TerminateFlowCommand)
export class TerminateFlowHandler implements ICommandHandler<TerminateFlowCommand> {
  constructor(private readonly flowInstanceService: FlowInstanceService) {}

  async execute(command: TerminateFlowCommand) {
    return this.flowInstanceService.terminate(
      command.instanceId,
      command.operatorId,
      command.operatorName,
      command.reason,
    );
  }
}
