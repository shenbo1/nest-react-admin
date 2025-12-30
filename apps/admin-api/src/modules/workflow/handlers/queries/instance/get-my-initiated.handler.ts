import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMyInitiatedQuery } from '../../../queries/instance/get-my-initiated.query';
import { FlowInstanceService } from '../../../flow-instance/flow-instance.service';

@QueryHandler(GetMyInitiatedQuery)
export class GetMyInitiatedHandler implements IQueryHandler<GetMyInitiatedQuery> {
  constructor(private readonly flowInstanceService: FlowInstanceService) {}

  async execute(query: GetMyInitiatedQuery) {
    return this.flowInstanceService.findMyInitiated(query.userId, query.payload);
  }
}
