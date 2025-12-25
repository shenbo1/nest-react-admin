import { Status } from '@prisma/client';

export class UpdateJobStatusCommand {
  constructor(public readonly id: number, public readonly status: Status) {}
}
