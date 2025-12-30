import { CountersignTaskDto } from '../../task/dto';

export class CountersignTaskCommand {
  constructor(
    public readonly taskId: number,
    public readonly userId: number,
    public readonly userName: string,
    public readonly dto: CountersignTaskDto,
  ) {}
}
