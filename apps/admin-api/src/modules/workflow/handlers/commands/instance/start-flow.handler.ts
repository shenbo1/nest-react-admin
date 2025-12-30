import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { StartFlowCommand } from '../../../commands/instance/start-flow.command';
import { FlowInstanceService } from '../../../flow-instance/flow-instance.service';

@CommandHandler(StartFlowCommand)
export class StartFlowHandler implements ICommandHandler<StartFlowCommand> {
  constructor(private readonly flowInstanceService: FlowInstanceService) {}

  async execute(command: StartFlowCommand) {
    return this.flowInstanceService.start(command.dto, command.initiator);
  }
}
