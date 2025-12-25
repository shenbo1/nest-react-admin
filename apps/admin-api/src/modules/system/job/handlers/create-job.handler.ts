import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateJobCommand } from '../commands/create-job.command';
import { JobService } from '../job.service';

@CommandHandler(CreateJobCommand)
export class CreateJobHandler implements ICommandHandler<CreateJobCommand> {
  constructor(private readonly jobService: JobService) {}

  execute(command: CreateJobCommand) {
    return this.jobService.create(command.payload);
  }
}
