import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RunJobCommand } from '../commands/run-job.command';
import { JobService } from '../job.service';

@CommandHandler(RunJobCommand)
export class RunJobHandler implements ICommandHandler<RunJobCommand> {
  constructor(private readonly jobService: JobService) {}

  execute(command: RunJobCommand) {
    return this.jobService.runOnce(command.id, command.operator);
  }
}
