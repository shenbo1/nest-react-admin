/**
 * 催办任务命令
 */
export class UrgeTaskCommand {
  constructor(
    public readonly taskId: number,
    public readonly userId: number,
    public readonly userName: string,
    public readonly comment?: string,
  ) {}
}