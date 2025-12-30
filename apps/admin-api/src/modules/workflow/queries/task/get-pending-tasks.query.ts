import { QueryTaskDto } from '../../task/dto';

export class GetPendingTasksQuery {
  constructor(
    public readonly userId: number,
    public readonly payload: QueryTaskDto,
  ) {}
}
