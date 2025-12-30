/**
 * 任务通过事件
 */
export class TaskApprovedEvent {
  constructor(
    public readonly taskId: number,
    public readonly instanceId: number,
    public readonly nodeId: string,
    public readonly nodeName: string,
    public readonly approverId: number,
    public readonly approverName: string,
    public readonly comment?: string,
  ) {}
}
