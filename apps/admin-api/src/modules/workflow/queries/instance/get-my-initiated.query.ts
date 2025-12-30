import { QueryFlowInstanceDto } from '../../flow-instance/dto';

export class GetMyInitiatedQuery {
  constructor(
    public readonly userId: number,
    public readonly payload: QueryFlowInstanceDto,
  ) {}
}
