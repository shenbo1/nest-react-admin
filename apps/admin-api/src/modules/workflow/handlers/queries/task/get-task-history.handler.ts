import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTaskHistoryQuery } from '../../../queries/task/get-task-history.query';
import { FlowInstanceService } from '../../../flow-instance/flow-instance.service';

@QueryHandler(GetTaskHistoryQuery)
export class GetTaskHistoryHandler implements IQueryHandler<GetTaskHistoryQuery> {
  constructor(private readonly flowInstanceService: FlowInstanceService) {}

  async execute(query: GetTaskHistoryQuery) {
    const instance = await this.flowInstanceService.findOne(query.instanceId);
    return instance.logs || [];
  }
}
