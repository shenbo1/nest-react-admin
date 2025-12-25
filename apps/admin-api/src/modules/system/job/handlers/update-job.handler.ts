import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateJobCommand } from '../commands/update-job.command';
import { JobService } from '../job.service';

@CommandHandler(UpdateJobCommand)
export class UpdateJobHandler implements ICommandHandler<UpdateJobCommand> {
  constructor(private readonly jobService: JobService) {}

  execute(command: UpdateJobCommand) {
    return this.jobService.update(command.id, command.payload);
  }
}
