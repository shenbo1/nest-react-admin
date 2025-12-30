import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApproveTaskCommand } from '../../../commands/task/approve-task.command';
import { TaskService } from '../../../task/task.service';

@CommandHandler(ApproveTaskCommand)
export class ApproveTaskHandler implements ICommandHandler<ApproveTaskCommand> {
  constructor(private readonly taskService: TaskService) {}

  async execute(command: ApproveTaskCommand) {
    return this.taskService.approve(
      command.taskId,
      command.userId,
      command.userName,
      command.dto,
    );
  }
}
