import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetFlowInstanceQuery } from '../../../queries/instance/get-flow-instance.query';
import { FlowInstanceService } from '../../../flow-instance/flow-instance.service';

@QueryHandler(GetFlowInstanceQuery)
export class GetFlowInstanceHandler implements IQueryHandler<GetFlowInstanceQuery> {
  constructor(private readonly flowInstanceService: FlowInstanceService) {}

  async execute(query: GetFlowInstanceQuery) {
    return this.flowInstanceService.findOne(query.instanceId);
  }
}
