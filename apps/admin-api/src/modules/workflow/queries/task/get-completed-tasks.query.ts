import { QueryTaskDto } from '../../task/dto';

export class GetCompletedTasksQuery {
  constructor(
    public readonly userId: number,
    public readonly payload: QueryTaskDto,
  ) {}
}
