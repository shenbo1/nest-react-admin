import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { WfFlowStatus, WfInstanceStatus, WfLogAction, Prisma } from '@prisma/client';
import { StartFlowDto, QueryFlowInstanceDto } from './dto';
import { EngineService } from '../engine/engine.service';

@Injectable()
export class FlowInstanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engineService: EngineService,
  ) {}

  /**
   * 生成实例编号
   */
  private generateInstanceNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `WF${dateStr}${random}`;
  }

  /**
   * 发起流程
   */
  async start(
    dto: StartFlowDto,
    initiator: { id: number; name: string; deptId?: number; deptName?: string },
  ) {
    // 获取流程定义
    const flowDef = await this.prisma.wfFlowDefinition.findFirst({
      where: {
        id: dto.flowDefinitionId,
        status: WfFlowStatus.PUBLISHED,
        deleted: false,
      },
      include: {
        nodeConfigs: { where: { deleted: false } },
      },
    });

    if (!flowDef) {
      throw new NotFoundException('流程定义不存在或未发布');
    }

    const instanceNo = this.generateInstanceNo();

    // 创建流程实例
    const instance = await this.prisma.$transaction(async (tx) => {
      const inst = await tx.wfFlowInstance.create({
        data: {
          instanceNo,
          flowDefinitionId: dto.flowDefinitionId,
          title: dto.title,
          businessId: dto.businessId,
          businessNo: dto.businessNo,
          businessTable: flowDef.businessTable,
          formDataSnapshot: dto.formData,
          status: WfInstanceStatus.RUNNING,
          initiatorId: initiator.id,
          initiatorName: initiator.name,
          initiatorDeptId: initiator.deptId,
          initiatorDeptName: initiator.deptName,
          remark: dto.remark,
        },
      });

      // 记录发起日志
      await tx.wfFlowLog.create({
        data: {
          flowInstanceId: inst.id,
          action: WfLogAction.START,
          toStatus: WfInstanceStatus.RUNNING,
          operatorId: initiator.id,
          operatorName: initiator.name,
          comment: '发起流程',
        },
      });

      return inst;
    });

    // 启动流程引擎，推进到第一个节点
    await this.engineService.startFlow(
      instance.id,
      (dto.formData || {}) as Record<string, unknown>,
    );

    return { instanceId: instance.id, instanceNo };
  }

  /**
   * 查询流程实例列表
   */
  async findAll(query: QueryFlowInstanceDto) {
    const {
      page = 1,
      pageSize = 10,
      instanceNo,
      title,
      flowDefinitionId,
      status,
      initiatorId,
      businessId,
    } = query;

    const where = {
      deleted: false,
      ...(instanceNo && { instanceNo: { contains: instanceNo } }),
      ...(title && { title: { contains: title } }),
      ...(flowDefinitionId && { flowDefinitionId }),
      ...(status && { status }),
      ...(initiatorId && { initiatorId }),
      ...(businessId && { businessId }),
    };

    const [rawList, total] = await Promise.all([
      this.prisma.wfFlowInstance.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          flowDefinition: {
            select: { id: true, code: true, name: true, version: true, category: true, flowData: true },
          },
          tasks: {
            where: { status: 'PENDING', deleted: false },
            select: { assigneeName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wfFlowInstance.count({ where }),
    ]);

    // 转换数据格式，添加发起人、当前节点名称和当前审批人
    const list = rawList.map((item) => {
      // 获取当前节点名称
      let currentNodeName: string | null = null;
      const currentNodeIds = item.currentNodeIds as string[] | null;
      if (currentNodeIds && currentNodeIds.length > 0) {
        const flowData = item.flowDefinition?.flowData as any;
        if (flowData?.nodes) {
          const currentNode = flowData.nodes.find((n: any) => n.id === currentNodeIds[0]);
          currentNodeName = currentNode?.data?.label || currentNode?.name || null;
        }
      }

      // 获取当前审批人（多人用顿号分隔）
      const currentAssignees = item.tasks
        ?.map((t) => t.assigneeName)
        .filter(Boolean)
        .join('、') || null;

      // 移除 tasks 字段避免返回过多数据
      const { tasks, ...rest } = item;

      return {
        ...rest,
        currentNodeName,
        currentAssignees,
        initiatorName: item.initiatorName,
        initiator: {
          id: item.initiatorId,
          name: item.initiatorName,
          deptId: item.initiatorDeptId,
          deptName: item.initiatorDeptName,
        },
      };
    });

    return { list, total, page, pageSize };
  }

  /**
   * 查询我发起的流程
   */
  async findMyInitiated(userId: number, query: QueryFlowInstanceDto) {
    query.initiatorId = userId;
    return this.findAll(query);
  }

  /**
   * 查询流程实例详情
   */
  async findOne(id: number) {
    const instance = await this.prisma.wfFlowInstance.findFirst({
      where: { id, deleted: false },
      include: {
        flowDefinition: {
          select: {
            id: true,
            code: true,
            name: true,
            version: true,
            category: true,
            flowData: true,
            formData: true,
          },
        },
        tasks: {
          where: { deleted: false },
          orderBy: { createdAt: 'asc' },
        },
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException(`流程实例 #${id} 不存在`);
    }

    // 获取当前节点名称
    let currentNodeName: string | null = null;
    const currentNodeIds = instance.currentNodeIds as string[] | null;
    if (currentNodeIds && currentNodeIds.length > 0) {
      const flowData = instance.flowDefinition?.flowData as any;
      if (flowData?.nodes) {
        const currentNode = flowData.nodes.find((n: any) => n.id === currentNodeIds[0]);
        currentNodeName = currentNode?.data?.label || currentNode?.name || null;
      }
    }

    return {
      ...instance,
      currentNodeName,
      initiator: {
        id: instance.initiatorId,
        name: instance.initiatorName,
        deptId: instance.initiatorDeptId,
        deptName: instance.initiatorDeptName,
      },
    };
  }

  /**
   * 撤回流程
   */
  async cancel(id: number, userId: number, comment?: string) {
    const instance = await this.findOne(id);

    if (instance.initiatorId !== userId) {
      throw new ForbiddenException('只能撤回自己发起的流程');
    }

    if (instance.status !== WfInstanceStatus.RUNNING) {
      throw new BadRequestException('只能撤回进行中的流程');
    }

    // 检查是否已有人审批
    const approvedCount = await this.prisma.wfTask.count({
      where: {
        flowInstanceId: id,
        status: 'COMPLETED',
        deleted: false,
      },
    });

    if (approvedCount > 0) {
      throw new BadRequestException('流程已有人审批，无法撤回');
    }

    return this.prisma.$transaction(async (tx) => {
      // 取消所有待处理任务
      await tx.wfTask.updateMany({
        where: { flowInstanceId: id, status: 'PENDING', deleted: false },
        data: { status: 'CANCELLED' },
      });

      // 更新流程状态
      const updated = await tx.wfFlowInstance.update({
        where: { id },
        data: {
          status: WfInstanceStatus.CANCELLED,
          endTime: new Date(),
          resultRemark: comment || '发起人撤回',
        },
      });

      // 记录日志
      await tx.wfFlowLog.create({
        data: {
          flowInstanceId: id,
          action: WfLogAction.CANCEL,
          fromStatus: WfInstanceStatus.RUNNING,
          toStatus: WfInstanceStatus.CANCELLED,
          operatorId: userId,
          comment: comment || '发起人撤回',
        },
      });

      return updated;
    });
  }

  /**
   * 终止流程（管理员）
   */
  async terminate(id: number, operatorId: number, operatorName: string, reason: string) {
    const instance = await this.findOne(id);

    if (instance.status !== WfInstanceStatus.RUNNING) {
      throw new BadRequestException('只能终止进行中的流程');
    }

    return this.prisma.$transaction(async (tx) => {
      // 取消所有待处理任务
      await tx.wfTask.updateMany({
        where: { flowInstanceId: id, status: 'PENDING', deleted: false },
        data: { status: 'CANCELLED' },
      });

      // 更新流程状态
      const updated = await tx.wfFlowInstance.update({
        where: { id },
        data: {
          status: WfInstanceStatus.TERMINATED,
          endTime: new Date(),
          resultRemark: reason,
        },
      });

      // 记录日志
      await tx.wfFlowLog.create({
        data: {
          flowInstanceId: id,
          action: WfLogAction.TERMINATE,
          fromStatus: WfInstanceStatus.RUNNING,
          toStatus: WfInstanceStatus.TERMINATED,
          operatorId,
          operatorName,
          comment: reason,
        },
      });

      return updated;
    });
  }
}
