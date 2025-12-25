import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetJobLogsQuery } from '../queries/get-job-logs.query';
import { JobService } from '../job.service';

@QueryHandler(GetJobLogsQuery)
export class GetJobLogsHandler implements IQueryHandler<GetJobLogsQuery> {
  constructor(private readonly jobService: JobService) {}

  execute(query: GetJobLogsQuery) {
    return this.jobService.findLogs(query.id, query.payload);
  }
}
