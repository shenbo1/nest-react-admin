import { RejectTaskDto } from '../../task/dto';

export class RejectTaskCommand {
  constructor(
    public readonly taskId: number,
    public readonly userId: number,
    public readonly userName: string,
    public readonly dto: RejectTaskDto,
  ) {}
}
