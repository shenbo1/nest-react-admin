import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CountersignTaskCommand } from '../../../commands/task/countersign-task.command';
import { TaskService } from '../../../task/task.service';

@CommandHandler(CountersignTaskCommand)
export class CountersignTaskHandler implements ICommandHandler<CountersignTaskCommand> {
  constructor(private readonly taskService: TaskService) {}

  async execute(command: CountersignTaskCommand) {
    return this.taskService.countersign(
      command.taskId,
      command.userId,
      command.userName,
      command.dto,
    );
  }
}
