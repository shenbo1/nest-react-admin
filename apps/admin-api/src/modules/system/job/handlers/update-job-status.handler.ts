import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateJobStatusCommand } from '../commands/update-job-status.command';
import { JobService } from '../job.service';

@CommandHandler(UpdateJobStatusCommand)
export class UpdateJobStatusHandler implements ICommandHandler<UpdateJobStatusCommand> {
  constructor(private readonly jobService: JobService) {}

  execute(command: UpdateJobStatusCommand) {
    return this.jobService.updateStatus(command.id, command.status);
  }
}
