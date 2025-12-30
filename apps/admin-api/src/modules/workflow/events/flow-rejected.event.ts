/**
 * 流程驳回事件
 */
export class FlowRejectedEvent {
  constructor(
    public readonly instanceId: number,
    public readonly nodeId: string,
    public readonly nodeName: string,
    public readonly rejectorId: number,
    public readonly rejectorName: string,
    public readonly comment?: string,
  ) {}
}
