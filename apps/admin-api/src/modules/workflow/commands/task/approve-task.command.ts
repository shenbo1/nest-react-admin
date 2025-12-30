import { ApproveTaskDto } from '../../task/dto';

export class ApproveTaskCommand {
  constructor(
    public readonly taskId: number,
    public readonly userId: number,
    public readonly userName: string,
    public readonly dto: ApproveTaskDto,
  ) {}
}
