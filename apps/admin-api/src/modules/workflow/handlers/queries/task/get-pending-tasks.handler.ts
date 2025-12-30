import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPendingTasksQuery } from '../../../queries/task/get-pending-tasks.query';
import { TaskService } from '../../../task/task.service';

@QueryHandler(GetPendingTasksQuery)
export class GetPendingTasksHandler implements IQueryHandler<GetPendingTasksQuery> {
  constructor(private readonly taskService: TaskService) {}

  async execute(query: GetPendingTasksQuery) {
    return this.taskService.findPending(query.userId, query.payload);
  }
}
