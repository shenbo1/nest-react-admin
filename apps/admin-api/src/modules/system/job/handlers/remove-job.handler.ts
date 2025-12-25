import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RemoveJobCommand } from '../commands/remove-job.command';
import { JobService } from '../job.service';

@CommandHandler(RemoveJobCommand)
export class RemoveJobHandler implements ICommandHandler<RemoveJobCommand> {
  constructor(private readonly jobService: JobService) {}

  execute(command: RemoveJobCommand) {
    return this.jobService.remove(command.id);
  }
}
