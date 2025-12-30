import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  WfTaskStatus,
  WfTaskResult,
  WfLogAction,
  WfInstanceStatus,
  Prisma,
} from '@prisma/client';
import {
  ApproveTaskDto,
  RejectTaskDto,
  TransferTaskDto,
  CountersignTaskDto,
  QueryTaskDto,
} from './dto';
import { EngineService } from '../engine/engine.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engineService: EngineService,
  ) {}

  /**
   * 生成任务编号
   */
  private generateTaskNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TK${dateStr}${random}`;
  }

  /**
   * 获取待我审批的任务
   */
  async findPending(userId: number, query: QueryTaskDto) {
    const { page = 1, pageSize = 10, taskNo, nodeName, flowInstanceId } = query;

    const where = {
      assigneeId: userId,
      status: WfTaskStatus.PENDING,
      deleted: false,
      ...(taskNo && { taskNo: { contains: taskNo } }),
      ...(nodeName && { nodeName: { contains: nodeName } }),
      ...(flowInstanceId && { flowInstanceId }),
    };

    const [list, total] = await Promise.all([
      this.prisma.wfTask.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          flowInstance: {
            select: {
              instanceNo: true,
              title: true,
              initiatorName: true,
              startTime: true,
              flowDefinition: {
                select: { name: true, category: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wfTask.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  /**
   * 获取我已审批的任务
   */
  async findCompleted(userId: number, query: QueryTaskDto) {
    const { page = 1, pageSize = 10, taskNo, nodeName, result } = query;

    const where = {
      assigneeId: userId,
      status: WfTaskStatus.COMPLETED,
      deleted: false,
      ...(taskNo && { taskNo: { contains: taskNo } }),
      ...(nodeName && { nodeName: { contains: nodeName } }),
      ...(result && { result }),
    };

    const [list, total] = await Promise.all([
      this.prisma.wfTask.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          flowInstance: {
            select: {
              instanceNo: true,
              title: true,
              initiatorName: true,
              startTime: true,
              status: true,
              flowDefinition: {
                select: { name: true, category: true },
              },
            },
          },
        },
        orderBy: { completedTime: 'desc' },
      }),
      this.prisma.wfTask.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  /**
   * 获取任务详情
   */
  async findOne(id: number) {
    const task = await this.prisma.wfTask.findFirst({
      where: { id, deleted: false },
      include: {
        flowInstance: {
          include: {
            flowDefinition: {
              select: {
                id: true,
                code: true,
                name: true,
                flowData: true,
                formData: true,
              },
            },
            logs: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`任务 #${id} 不存在`);
    }

    return task;
  }

  /**
   * 通过审批
   */
  async approve(
    id: number,
    userId: number,
    userName: string,
    dto: ApproveTaskDto,
  ) {
    const task = await this.findOne(id);

    if (task.assigneeId !== userId) {
      throw new ForbiddenException('您不是该任务的审批人');
    }

    if (task.status !== WfTaskStatus.PENDING) {
      throw new BadRequestException('任务已处理');
    }

    const now = new Date();
    const duration = Math.floor(
      (now.getTime() - task.startTime.getTime()) / 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      // 更新任务状态
      await tx.wfTask.update({
        where: { id },
        data: {
          status: WfTaskStatus.COMPLETED,
          result: WfTaskResult.APPROVED,
          comment: dto.comment,
          formData: dto.formData as Prisma.InputJsonValue,
          completedTime: now,
          duration,
        },
      });

      // 记录日志
      await tx.wfFlowLog.create({
        data: {
          flowInstanceId: task.flowInstanceId,
          taskId: id,
          nodeId: task.nodeId,
          nodeName: task.nodeName,
          action: WfLogAction.APPROVE,
          fromStatus: WfTaskStatus.PENDING,
          toStatus: WfTaskStatus.COMPLETED,
          operatorId: userId,
          operatorName: userName,
          comment: dto.comment,
        },
      });
    });

    // 推进流程
    await this.engineService.advanceFlow(
      task.flowInstanceId,
      task.nodeId,
      'APPROVED',
    );

    return { success: true };
  }

  /**
   * 驳回审批
   */
  async reject(id: number, userId: number, userName: string, dto: RejectTaskDto) {
    const task = await this.findOne(id);

    if (task.assigneeId !== userId) {
      throw new ForbiddenException('您不是该任务的审批人');
    }

    if (task.status !== WfTaskStatus.PENDING) {
      throw new BadRequestException('任务已处理');
    }

    const now = new Date();
    const duration = Math.floor(
      (now.getTime() - task.startTime.getTime()) / 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      // 更新任务状态
      await tx.wfTask.update({
        where: { id },
        data: {
          status: WfTaskStatus.COMPLETED,
          result: WfTaskResult.REJECTED,
          comment: dto.comment,
          completedTime: now,
          duration,
        },
      });

      // 取消其他待处理任务（同一节点的会签任务）
      await tx.wfTask.updateMany({
        where: {
          flowInstanceId: task.flowInstanceId,
          nodeId: task.nodeId,
          status: WfTaskStatus.PENDING,
          id: { not: id },
        },
        data: { status: WfTaskStatus.CANCELLED },
      });

      // 更新流程实例状态
      await tx.wfFlowInstance.update({
        where: { id: task.flowInstanceId },
        data: {
          status: WfInstanceStatus.REJECTED,
          endTime: now,
          resultRemark: dto.comment || '审批驳回',
        },
      });

      // 记录日志
      await tx.wfFlowLog.create({
        data: {
          flowInstanceId: task.flowInstanceId,
          taskId: id,
          nodeId: task.nodeId,
          nodeName: task.nodeName,
          action: WfLogAction.REJECT,
          fromStatus: WfInstanceStatus.RUNNING,
          toStatus: WfInstanceStatus.REJECTED,
          operatorId: userId,
          operatorName: userName,
          comment: dto.comment,
        },
      });
    });

    return { success: true };
  }

  /**
   * 转办
   */
  async transfer(
    id: number,
    userId: number,
    userName: string,
    dto: TransferTaskDto,
  ) {
    const task = await this.findOne(id);

    if (task.assigneeId !== userId) {
      throw new ForbiddenException('您不是该任务的审批人');
    }

    if (task.status !== WfTaskStatus.PENDING) {
      throw new BadRequestException('任务已处理');
    }

    // 获取目标用户信息
    const targetUser = await this.prisma.sysUser.findFirst({
      where: { id: dto.targetUserId, deleted: false },
      include: { dept: true },
    });

    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // 更新原任务状态
      await tx.wfTask.update({
        where: { id },
        data: {
          status: WfTaskStatus.TRANSFERRED,
          result: WfTaskResult.TRANSFERRED,
          comment: dto.comment,
          completedTime: now,
        },
      });

      // 创建新任务
      await tx.wfTask.create({
        data: {
          taskNo: this.generateTaskNo(),
          flowInstanceId: task.flowInstanceId,
          nodeId: task.nodeId,
          nodeName: task.nodeName,
          nodeType: task.nodeType,
          status: WfTaskStatus.PENDING,
          assigneeId: dto.targetUserId,
          assigneeName: targetUser.nickname || targetUser.username,
          assigneeDeptId: targetUser.deptId,
          assigneeDeptName: targetUser.dept?.name,
          sourceTaskId: id,
        },
      });

      // 记录日志
      await tx.wfFlowLog.create({
        data: {
          flowInstanceId: task.flowInstanceId,
          taskId: id,
          nodeId: task.nodeId,
          nodeName: task.nodeName,
          action: WfLogAction.TRANSFER,
          operatorId: userId,
          operatorName: userName,
          comment: `转办给 ${targetUser.nickname || targetUser.username}：${dto.comment || ''}`,
        },
      });
    });

    return { success: true };
  }

  /**
   * 加签
   */
  async countersign(
    id: number,
    userId: number,
    userName: string,
    dto: CountersignTaskDto,
  ) {
    const task = await this.findOne(id);

    if (task.assigneeId !== userId) {
      throw new ForbiddenException('您不是该任务的审批人');
    }

    if (task.status !== WfTaskStatus.PENDING) {
      throw new BadRequestException('任务已处理');
    }

    // 获取加签用户信息
    const users = await this.prisma.sysUser.findMany({
      where: { id: { in: dto.userIds }, deleted: false },
      include: { dept: true },
    });

    if (users.length !== dto.userIds.length) {
      throw new BadRequestException('部分用户不存在');
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // 更新原任务状态
      await tx.wfTask.update({
        where: { id },
        data: {
          status: WfTaskStatus.COUNTERSIGNED,
          result: WfTaskResult.COUNTERSIGNED,
          comment: dto.comment,
          completedTime: now,
        },
      });

      // 创建加签任务
      for (const user of users) {
        await tx.wfTask.create({
          data: {
            taskNo: this.generateTaskNo(),
            flowInstanceId: task.flowInstanceId,
            nodeId: task.nodeId,
            nodeName: task.nodeName,
            nodeType: task.nodeType,
            status: WfTaskStatus.PENDING,
            assigneeId: user.id,
            assigneeName: user.nickname || user.username,
            assigneeDeptId: user.deptId,
            assigneeDeptName: user.dept?.name,
            sourceTaskId: id,
          },
        });
      }

      // 记录日志
      const targetNames = users
        .map((u) => u.nickname || u.username)
        .join('、');
      await tx.wfFlowLog.create({
        data: {
          flowInstanceId: task.flowInstanceId,
          taskId: id,
          nodeId: task.nodeId,
          nodeName: task.nodeName,
          action: WfLogAction.COUNTERSIGN,
          operatorId: userId,
          operatorName: userName,
          comment: `加签给 ${targetNames}：${dto.comment || ''}`,
        },
      });
    });

    return { success: true };
  }

  /**
   * 催办
   */
  async urge(id: number, userId: number, userName: string, comment?: string) {
    const task = await this.findOne(id);

    // 只有发起人可以催办
    if (task.flowInstance.initiatorId !== userId) {
      throw new ForbiddenException('只有发起人可以催办');
    }

    if (task.status !== WfTaskStatus.PENDING) {
      throw new BadRequestException('任务已处理');
    }

    // 记录催办日志
    await this.prisma.wfFlowLog.create({
      data: {
        flowInstanceId: task.flowInstanceId,
        taskId: id,
        nodeId: task.nodeId,
        nodeName: task.nodeName,
        action: WfLogAction.URGE,
        operatorId: userId,
        operatorName: userName,
        comment: comment || '催办任务',
      },
    });

    // TODO: 发送催办通知

    return { success: true };
  }
}
