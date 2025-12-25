export class RunJobCommand {
  constructor(
    public readonly id: number,
    public readonly operator?: string,
  ) {}
}
