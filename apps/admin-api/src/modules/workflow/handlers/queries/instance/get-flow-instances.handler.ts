import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetFlowInstancesQuery } from '../../../queries/instance/get-flow-instances.query';
import { FlowInstanceService } from '../../../flow-instance/flow-instance.service';

@QueryHandler(GetFlowInstancesQuery)
export class GetFlowInstancesHandler implements IQueryHandler<GetFlowInstancesQuery> {
  constructor(private readonly flowInstanceService: FlowInstanceService) {}

  async execute(query: GetFlowInstancesQuery) {
    return this.flowInstanceService.findAll(query.payload);
  }
}
