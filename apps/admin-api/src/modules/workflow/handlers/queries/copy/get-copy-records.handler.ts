import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCopyRecordsQuery } from '../../../queries/copy/get-copy-records.query';
import { CopyRecordService } from '../../../copy-record/copy-record.service';

@QueryHandler(GetCopyRecordsQuery)
export class GetCopyRecordsHandler implements IQueryHandler<GetCopyRecordsQuery> {
  constructor(private readonly copyRecordService: CopyRecordService) {}

  async execute(query: GetCopyRecordsQuery) {
    return this.copyRecordService.findMyCopies(query.userId, query.payload);
  }
}
