import { QueryCopyRecordDto } from '../../copy-record/dto';

export class GetCopyRecordsQuery {
  constructor(
    public readonly userId: number,
    public readonly payload: QueryCopyRecordDto,
  ) {}
}
