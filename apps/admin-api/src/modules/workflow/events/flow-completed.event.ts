/**
 * 流程完成事件
 */
export class FlowCompletedEvent {
  constructor(
    public readonly instanceId: number,
    public readonly initiatorId: number,
    public readonly duration: number, // 流程持续时间（秒）
  ) {}
}
