import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RejectTaskCommand } from '../../../commands/task/reject-task.command';
import { TaskService } from '../../../task/task.service';

@CommandHandler(RejectTaskCommand)
export class RejectTaskHandler implements ICommandHandler<RejectTaskCommand> {
  constructor(private readonly taskService: TaskService) {}

  async execute(command: RejectTaskCommand) {
    return this.taskService.reject(
      command.taskId,
      command.userId,
      command.userName,
      command.dto,
    );
  }
}
