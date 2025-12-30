export class CancelFlowCommand {
  constructor(
    public readonly instanceId: number,
    public readonly userId: number,
    public readonly comment?: string,
  ) {}
}
