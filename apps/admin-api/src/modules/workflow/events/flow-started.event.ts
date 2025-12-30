/**
 * 流程启动事件
 */
export class FlowStartedEvent {
  constructor(
    public readonly instanceId: number,
    public readonly initiatorId: number,
    public readonly initiatorName: string,
    public readonly flowDefinitionId: number,
    public readonly flowDefinitionName: string,
  ) {}
}
