import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetJobQuery } from '../queries/get-job.query';
import { JobService } from '../job.service';

@QueryHandler(GetJobQuery)
export class GetJobHandler implements IQueryHandler<GetJobQuery> {
  constructor(private readonly jobService: JobService) {}

  execute(query: GetJobQuery) {
    return this.jobService.findOne(query.id);
  }
}
