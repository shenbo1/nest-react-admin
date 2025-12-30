/**
 * 任务催办事件
 */
export class TaskUrgedEvent {
  constructor(
    public readonly taskId: number,
    public readonly instanceId: number,
    public readonly nodeId: string,
    public readonly nodeName: string,
    public readonly assigneeId: number,
    public readonly assigneeName: string,
    public readonly urgerId: number,
    public readonly urgerName: string,
    public readonly comment?: string,
  ) {}
}