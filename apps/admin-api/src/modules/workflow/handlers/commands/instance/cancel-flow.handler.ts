import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CancelFlowCommand } from '../../../commands/instance/cancel-flow.command';
import { FlowInstanceService } from '../../../flow-instance/flow-instance.service';

@CommandHandler(CancelFlowCommand)
export class CancelFlowHandler implements ICommandHandler<CancelFlowCommand> {
  constructor(private readonly flowInstanceService: FlowInstanceService) {}

  async execute(command: CancelFlowCommand) {
    return this.flowInstanceService.cancel(
      command.instanceId,
      command.userId,
      command.comment,
    );
  }
}
