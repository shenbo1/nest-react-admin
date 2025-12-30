import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { WfFlowStatus } from '@prisma/client';
import {
  CreateFlowDefinitionDto,
  UpdateFlowDefinitionDto,
  QueryFlowDefinitionDto,
  NodeConfigDto,
} from './dto';

@Injectable()
export class FlowDefinitionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建流程定义
   */
  async create(dto: CreateFlowDefinitionDto) {
    // 检查编码是否已存在
    const existing = await this.prisma.wfFlowDefinition.findFirst({
      where: { code: dto.code, deleted: false },
    });

    if (existing) {
      throw new BadRequestException(`流程编码 ${dto.code} 已存在`);
    }

    return this.prisma.wfFlowDefinition.create({
      data: {
        code: dto.code,
        name: dto.name,
        categoryId: dto.categoryId,
        flowData: dto.flowData,
        formData: dto.formData,
        businessTable: dto.businessTable,
        description: dto.description,
        remark: dto.remark,
        version: 1,
        status: WfFlowStatus.DRAFT,
        isMain: true,
      },
    });
  }

  /**
   * 查询流程定义列表
   */
  async findAll(query: QueryFlowDefinitionDto) {
    const { page = 1, pageSize = 10, code, name, categoryId, status } = query;

    const where = {
      deleted: false,
      ...(code && { code: { contains: code } }),
      ...(name && { name: { contains: name } }),
      ...(categoryId && { categoryId }),
      ...(status && { status }),
    };

    const [list, total] = await Promise.all([
      this.prisma.wfFlowDefinition.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          code: true,
          name: true,
          categoryId: true,
          version: true,
          status: true,
          isMain: true,
          businessTable: true,
          description: true,
          remark: true,
          createdBy: true,
          createdAt: true,
          updatedBy: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              code: true,
              name: true,
              color: true,
              parentId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wfFlowDefinition.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  /**
   * 查询流程定义详情
   */
  async findOne(id: number) {
    const flow = await this.prisma.wfFlowDefinition.findFirst({
      where: { id, deleted: false },
      include: {
        category: {
          select: { id: true, code: true, name: true, color: true },
        },
        nodeConfigs: {
          where: { deleted: false },
        },
      },
    });

    if (!flow) {
      throw new NotFoundException(`流程定义 #${id} 不存在`);
    }

    return flow;
  }

  /**
   * 更新流程定义
   */
  async update(id: number, dto: UpdateFlowDefinitionDto) {
    const flow = await this.findOne(id);

    if (flow.status === WfFlowStatus.PUBLISHED) {
      throw new BadRequestException('已发布的流程不能直接修改，请创建新版本');
    }

    return this.prisma.wfFlowDefinition.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        categoryId: dto.categoryId,
        flowData: dto.flowData,
        formData: dto.formData,
        businessTable: dto.businessTable,
        description: dto.description,
        remark: dto.remark,
      },
    });
  }

  /**
   * 删除流程定义（软删除）
   */
  async remove(id: number) {
    const flow = await this.findOne(id);

    if (flow.status === WfFlowStatus.PUBLISHED) {
      throw new BadRequestException('已发布的流程不能删除，请先停用');
    }

    // 检查是否有运行中的实例
    const runningCount = await this.prisma.wfFlowInstance.count({
      where: {
        flowDefinitionId: id,
        status: 'RUNNING',
        deleted: false,
      },
    });

    if (runningCount > 0) {
      throw new BadRequestException(`存在 ${runningCount} 个运行中的流程实例，无法删除`);
    }

    return this.prisma.wfFlowDefinition.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
  }

  /**
   * 发布流程
   */
  async publish(id: number) {
    const flow = await this.findOne(id);

    if (flow.status === WfFlowStatus.PUBLISHED) {
      throw new BadRequestException('流程已发布');
    }

    if (!flow.flowData) {
      throw new BadRequestException('请先设计流程图');
    }

    return this.prisma.wfFlowDefinition.update({
      where: { id },
      data: { status: WfFlowStatus.PUBLISHED },
    });
  }

  /**
   * 停用流程
   */
  async disable(id: number) {
    const flow = await this.findOne(id);

    if (flow.status !== WfFlowStatus.PUBLISHED) {
      throw new BadRequestException('只能停用已发布的流程');
    }

    return this.prisma.wfFlowDefinition.update({
      where: { id },
      data: { status: WfFlowStatus.DISABLED },
    });
  }

  /**
   * 创建新版本（基于已发布的流程）
   */
  async createNewVersion(id: number) {
    const flow = await this.findOne(id);

    if (flow.status !== WfFlowStatus.PUBLISHED && flow.status !== WfFlowStatus.DISABLED) {
      throw new BadRequestException('只能从已发布或已停用的流程创建新版本');
    }

    // 获取该流程编码的最大版本号
    const maxVersion = await this.prisma.wfFlowDefinition.aggregate({
      where: { code: flow.code, deleted: false },
      _max: { version: true },
    });

    const newVersion = (maxVersion._max.version || 0) + 1;

    // 创建新版本
    const newFlow = await this.prisma.$transaction(async (tx) => {
      // 将旧版本的 isMain 设为 false
      await tx.wfFlowDefinition.updateMany({
        where: { code: flow.code, deleted: false },
        data: { isMain: false },
      });

      // 创建新版本
      const created = await tx.wfFlowDefinition.create({
        data: {
          code: flow.code,
          name: flow.name,
          categoryId: flow.categoryId,
          flowData: flow.flowData || undefined,
          formData: flow.formData || undefined,
          businessTable: flow.businessTable,
          description: flow.description,
          remark: flow.remark,
          version: newVersion,
          status: WfFlowStatus.DRAFT,
          isMain: true,
        },
      });

      // 复制节点配置
      const nodeConfigs = await tx.wfNodeConfig.findMany({
        where: { flowDefinitionId: id, deleted: false },
      });

      if (nodeConfigs.length > 0) {
        await tx.wfNodeConfig.createMany({
          data: nodeConfigs.map((config) => ({
            flowDefinitionId: created.id,
            nodeId: config.nodeId,
            nodeType: config.nodeType,
            nodeName: config.nodeName,
            approvalType: config.approvalType,
            assigneeType: config.assigneeType,
            assigneeConfig: config.assigneeConfig || undefined,
            emptyAssigneeAction: config.emptyAssigneeAction,
            conditionExpr: config.conditionExpr || undefined,
            formPerms: config.formPerms || undefined,
            timeLimit: config.timeLimit,
            timeoutAction: config.timeoutAction,
            ccConfig: config.ccConfig || undefined,
            remark: config.remark,
            createdBy: config.createdBy,
          })),
        });
      }

      return created;
    });

    return newFlow;
  }

  /**
   * 保存节点配置
   */
  async saveNodeConfigs(id: number, nodeConfigs: NodeConfigDto[]) {
    const flow = await this.findOne(id);

    if (flow.status === WfFlowStatus.PUBLISHED) {
      throw new BadRequestException('已发布的流程不能修改节点配置');
    }

    // 使用事务处理
    return this.prisma.$transaction(async (tx) => {
      // 软删除旧的节点配置
      await tx.wfNodeConfig.updateMany({
        where: { flowDefinitionId: id, deleted: false },
        data: { deleted: true, deletedAt: new Date() },
      });

      // 创建新的节点配置
      const configs = await Promise.all(
        nodeConfigs.map((config) =>
          tx.wfNodeConfig.create({
            data: {
              flowDefinitionId: id,
              nodeId: config.nodeId,
              nodeType: config.nodeType,
              nodeName: config.nodeName,
              approvalType: config.approvalType,
              assigneeType: config.assigneeType,
              assigneeConfig: config.assigneeConfig,
              emptyAssigneeAction: config.emptyAssigneeAction,
              conditionExpr: config.conditionExpr,
              formPerms: config.formPerms,
              timeLimit: config.timeLimit,
              timeoutAction: config.timeoutAction,
              ccConfig: config.ccConfig,
            },
          }),
        ),
      );

      return configs;
    });
  }

  /**
   * 获取可用的流程列表（已发布）
   * 对于每个流程编码，返回最新的已发布版本
   */
  async findAvailable(categoryId?: number) {
    // 先获取所有已发布的流程
    const allPublished = await this.prisma.wfFlowDefinition.findMany({
      where: {
        status: WfFlowStatus.PUBLISHED,
        deleted: false,
        ...(categoryId && { categoryId }),
      },
      select: {
        id: true,
        code: true,
        name: true,
        version: true,
        categoryId: true,
        category: {
          select: { id: true, code: true, name: true, color: true },
        },
        description: true,
      },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    });

    // 对于每个 code，只保留版本最高的记录
    const codeMap = new Map<string, (typeof allPublished)[0]>();
    for (const flow of allPublished) {
      if (!codeMap.has(flow.code) || codeMap.get(flow.code)!.version < flow.version) {
        codeMap.set(flow.code, flow);
      }
    }

    const list = Array.from(codeMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return { list };
  }
}
