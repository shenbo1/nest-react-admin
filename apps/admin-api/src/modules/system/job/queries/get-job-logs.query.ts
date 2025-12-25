import { QueryJobLogDto } from '../dto/query-job-log.dto';

export class GetJobLogsQuery {
  constructor(public readonly id: number, public readonly payload: QueryJobLogDto) {}
}
