import { QueryFlowInstanceDto } from '../../flow-instance/dto';

export class GetFlowInstancesQuery {
  constructor(public readonly payload: QueryFlowInstanceDto) {}
}
