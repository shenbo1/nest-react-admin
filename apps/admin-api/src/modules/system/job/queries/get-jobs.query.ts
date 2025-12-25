import { QueryJobDto } from '../dto/query-job.dto';

export class GetJobsQuery {
  constructor(public readonly payload: QueryJobDto) {}
}
