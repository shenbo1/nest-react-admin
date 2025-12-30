import { TransferTaskDto } from '../../task/dto';

export class TransferTaskCommand {
  constructor(
    public readonly taskId: number,
    public readonly userId: number,
    public readonly userName: string,
    public readonly dto: TransferTaskDto,
  ) {}
}
