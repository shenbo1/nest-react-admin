export class TerminateFlowCommand {
  constructor(
    public readonly instanceId: number,
    public readonly operatorId: number,
    public readonly operatorName: string,
    public readonly reason: string,
  ) {}
}
