import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';

// Category
import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';

// Flow Definition
import { FlowDefinitionController } from './flow-definition/flow-definition.controller';
import { FlowDefinitionService } from './flow-definition/flow-definition.service';

// Flow Instance
import { FlowInstanceController } from './flow-instance/flow-instance.controller';
import { FlowInstanceService } from './flow-instance/flow-instance.service';

// Task
import { TaskController } from './task/task.controller';
import { TaskService } from './task/task.service';

// Copy Record
import { CopyRecordController } from './copy-record/copy-record.controller';
import { CopyRecordService } from './copy-record/copy-record.service';

// Engine
import { EngineService } from './engine/engine.service';
import { AssigneeResolverService } from './engine/assignee-resolver.service';
import { ConditionEvaluatorService } from './engine/condition-evaluator.service';

// Services
import { TimeoutSchedulerService } from './services/timeout-scheduler.service';

// Jobs
import { TimeoutTaskProcessor } from './jobs/timeout-task.processor';

// Command Handlers
import { StartFlowHandler } from './handlers/commands/instance/start-flow.handler';
import { CancelFlowHandler } from './handlers/commands/instance/cancel-flow.handler';
import { TerminateFlowHandler } from './handlers/commands/instance/terminate-flow.handler';
import { ApproveTaskHandler } from './handlers/commands/task/approve-task.handler';
import { RejectTaskHandler } from './handlers/commands/task/reject-task.handler';
import { TransferTaskHandler } from './handlers/commands/task/transfer-task.handler';
import { CountersignTaskHandler } from './handlers/commands/task/countersign-task.handler';
import { UrgeTaskHandler } from './handlers/commands/task/urge-task.handler';

// Query Handlers
import { GetFlowInstancesHandler } from './handlers/queries/instance/get-flow-instances.handler';
import { GetMyInitiatedHandler } from './handlers/queries/instance/get-my-initiated.handler';
import { GetFlowInstanceHandler } from './handlers/queries/instance/get-flow-instance.handler';
import { GetFlowProgressHandler } from './handlers/queries/instance/get-flow-progress.handler';
import { GetPendingTasksHandler } from './handlers/queries/task/get-pending-tasks.handler';
import { GetCompletedTasksHandler } from './handlers/queries/task/get-completed-tasks.handler';
import { GetTaskHistoryHandler } from './handlers/queries/task/get-task-history.handler';
import { GetCopyRecordsHandler } from './handlers/queries/copy/get-copy-records.handler';

// Event Handlers
import { TaskApprovedHandler } from './handlers/events/task-approved.handler';
import { TaskRejectedHandler } from './handlers/events/task-rejected.handler';
import { FlowCompletedHandler } from './handlers/events/flow-completed.handler';
import { FlowStartedHandler } from './handlers/events/flow-started.handler';
import { TaskUrgedHandler } from './handlers/events/task-urged.handler';

// Export all handlers for module registration
const CommandHandlers = [
  StartFlowHandler,
  CancelFlowHandler,
  TerminateFlowHandler,
  ApproveTaskHandler,
  RejectTaskHandler,
  TransferTaskHandler,
  CountersignTaskHandler,
  UrgeTaskHandler,
];

const QueryHandlers = [
  GetFlowInstancesHandler,
  GetMyInitiatedHandler,
  GetFlowInstanceHandler,
  GetFlowProgressHandler,
  GetPendingTasksHandler,
  GetCompletedTasksHandler,
  GetTaskHistoryHandler,
  GetCopyRecordsHandler,
];

const EventHandlers = [
  TaskApprovedHandler,
  TaskRejectedHandler,
  FlowCompletedHandler,
  FlowStartedHandler,
  TaskUrgedHandler,
];

@Module({
  imports: [
    CqrsModule,
    BullModule.registerQueue({
      name: 'workflow-timeout',
    }),
  ],
  controllers: [
    CategoryController,
    FlowDefinitionController,
    FlowInstanceController,
    TaskController,
    CopyRecordController,
  ],
  providers: [
    // Services
    CategoryService,
    FlowDefinitionService,
    FlowInstanceService,
    TaskService,
    CopyRecordService,

    // Engine
    EngineService,
    AssigneeResolverService,
    ConditionEvaluatorService,

    // Services
    TimeoutSchedulerService,

    // Jobs
    TimeoutTaskProcessor,

    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [
    CategoryService,
    FlowDefinitionService,
    FlowInstanceService,
    TaskService,
    EngineService,
    TimeoutSchedulerService,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
})
export class WorkflowModule {}
