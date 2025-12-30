import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCompletedTasksQuery } from '../../../queries/task/get-completed-tasks.query';
import { TaskService } from '../../../task/task.service';

@QueryHandler(GetCompletedTasksQuery)
export class GetCompletedTasksHandler implements IQueryHandler<GetCompletedTasksQuery> {
  constructor(private readonly taskService: TaskService) {}

  async execute(query: GetCompletedTasksQuery) {
    return this.taskService.findCompleted(query.userId, query.payload);
  }
}
