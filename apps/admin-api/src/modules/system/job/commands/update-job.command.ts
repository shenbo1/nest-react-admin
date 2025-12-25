import { UpdateJobDto } from '../dto/update-job.dto';

export class UpdateJobCommand {
  constructor(
    public readonly id: number,
    public readonly payload: UpdateJobDto,
  ) {}
}
