import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UrgeTaskCommand } from '../../../commands/task/urge-task.command';
import { TaskService } from '../../../task/task.service';

@CommandHandler(UrgeTaskCommand)
export class UrgeTaskHandler implements ICommandHandler<UrgeTaskCommand> {
  constructor(private readonly taskService: TaskService) {}

  async execute(command: UrgeTaskCommand) {
    const { taskId, userId, userName, comment } = command;
    return this.taskService.urge(taskId, userId, userName, comment);
  }
}
