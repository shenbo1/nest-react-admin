import { StartFlowDto } from '../../flow-instance/dto';

export class StartFlowCommand {
  constructor(
    public readonly dto: StartFlowDto,
    public readonly initiator: {
      id: number;
      name: string;
      deptId?: number;
      deptName?: string;
    },
  ) {}
}
