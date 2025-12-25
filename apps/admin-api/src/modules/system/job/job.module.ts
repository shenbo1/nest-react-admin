import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CqrsModule } from '@nestjs/cqrs';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobProcessor } from './job.processor';
import { BullmqModule } from '@/common/bullmq/bullmq.module';
import { BullConfigService } from '@/common/bullmq/bullmq.service';
import { CreateJobHandler } from './handlers/create-job.handler';
import { UpdateJobHandler } from './handlers/update-job.handler';
import { UpdateJobStatusHandler } from './handlers/update-job-status.handler';
import { RunJobHandler } from './handlers/run-job.handler';
import { RemoveJobHandler } from './handlers/remove-job.handler';
import { GetJobsHandler } from './handlers/get-jobs.handler';
import { GetJobHandler } from './handlers/get-job.handler';
import { GetJobLogsHandler } from './handlers/get-job-logs.handler';
import { SYSTEM_JOB_QUEUE } from '@/common/constants/queues';

@Module({
  imports: [
    BullmqModule,
    BullModule.registerQueueAsync({
      name: SYSTEM_JOB_QUEUE,
      imports: [BullmqModule],
      inject: [BullConfigService],
      useFactory: (bullConfigService: BullConfigService) => ({
        connection: bullConfigService.getConnection(),
      }),
    }),
    CqrsModule,
  ],
  controllers: [JobController],
  providers: [
    JobService,
    JobProcessor,
    CreateJobHandler,
    UpdateJobHandler,
    UpdateJobStatusHandler,
    RunJobHandler,
    RemoveJobHandler,
    GetJobsHandler,
    GetJobHandler,
    GetJobLogsHandler,
  ],
})
export class JobModule {}
