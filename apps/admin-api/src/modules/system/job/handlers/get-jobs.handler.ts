import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetJobsQuery } from '../queries/get-jobs.query';
import { JobService } from '../job.service';

@QueryHandler(GetJobsQuery)
export class GetJobsHandler implements IQueryHandler<GetJobsQuery> {
  constructor(private readonly jobService: JobService) {}

  execute(query: GetJobsQuery) {
    return this.jobService.findAll(query.payload);
  }
}
