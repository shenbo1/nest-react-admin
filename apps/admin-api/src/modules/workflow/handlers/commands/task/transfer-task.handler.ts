import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransferTaskCommand } from '../../../commands/task/transfer-task.command';
import { TaskService } from '../../../task/task.service';

@CommandHandler(TransferTaskCommand)
export class TransferTaskHandler implements ICommandHandler<TransferTaskCommand> {
  constructor(private readonly taskService: TaskService) {}

  async execute(command: TransferTaskCommand) {
    return this.taskService.transfer(
      command.taskId,
      command.userId,
      command.userName,
      command.dto,
    );
  }
}
