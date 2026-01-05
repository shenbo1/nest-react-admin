import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateFullReductionDto } from './dto/create-full-reduction.dto';
import { UpdateFullReductionDto } from './dto/update-full-reduction.dto';
import { QueryFullReductionDto } from './dto/query-full-reduction.dto';

@Injectable()
export class FullReductionService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建满减活动
   */
  async create(dto: CreateFullReductionDto, userId: number) {
    // 检查编码唯一性
    const existing = await this.prisma.fullReductionActivity.findFirst({
      where: { code: dto.code, deleted: false },
    });
    if (existing) {
      throw new ConflictException(`活动编码 ${dto.code} 已存在`);
    }

    // 验证规则：满减金额应递增
    const sortedRules = [...dto.rules].sort((a, b) => a.minAmount - b.minAmount);
    for (let i = 1; i < sortedRules.length; i++) {
      if (sortedRules[i].reduceAmount <= sortedRules[i - 1].reduceAmount) {
        throw new ConflictException('满减规则的优惠金额应随门槛递增');
      }
    }

    return this.prisma.fullReductionActivity.create({
      data: {
        name: dto.name,
        code: dto.code,
        rules: sortedRules as any,
        stackable: dto.stackable ?? false,
        priority: dto.priority ?? 0,
        exclusive: dto.exclusive ?? true,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        scopeType: dto.scopeType,
        scopeIds: dto.scopeIds,
        memberLevelIds: dto.memberLevelIds,
        limitPerMember: dto.limitPerMember ?? 0,
        firstOrderOnly: dto.firstOrderOnly ?? false,
        status: 'NOT_STARTED',
        description: dto.description,
        createdBy: String(userId),
      },
    });
  }

  /**
   * 分页查询列表
   */
  async findAll(query: QueryFullReductionDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { name, code, status, scopeType } = query;

    const where = {
      deleted: false,
      ...(name && { name: { contains: name } }),
      ...(code && { code: { contains: code } }),
      ...(status && { status }),
      ...(scopeType && { scopeType }),
    };

    const [data, total] = await Promise.all([
      this.prisma.fullReductionActivity.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fullReductionActivity.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取详情
   */
  async findOne(id: number) {
    const record = await this.prisma.fullReductionActivity.findFirst({
      where: { id, deleted: false },
    });
    if (!record) {
      throw new NotFoundException('满减活动不存在');
    }
    return record;
  }

  /**
   * 更新
   */
  async update(id: number, dto: UpdateFullReductionDto, userId: number) {
    await this.findOne(id);

    // 检查编码唯一性
    if (dto.code) {
      const existing = await this.prisma.fullReductionActivity.findFirst({
        where: { code: dto.code, deleted: false, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`活动编码 ${dto.code} 已存在`);
      }
    }

    // 验证规则
    if (dto.rules && dto.rules.length > 0) {
      const sortedRules = [...dto.rules].sort((a, b) => a.minAmount - b.minAmount);
      for (let i = 1; i < sortedRules.length; i++) {
        if (sortedRules[i].reduceAmount <= sortedRules[i - 1].reduceAmount) {
          throw new ConflictException('满减规则的优惠金额应随门槛递增');
        }
      }
      dto.rules = sortedRules;
    }

    const { rules, ...restDto } = dto;
    return this.prisma.fullReductionActivity.update({
      where: { id },
      data: {
        ...restDto,
        ...(rules && { rules: rules as any }),
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 删除（软删除）
   */
  async remove(id: number, userId: number) {
    await this.findOne(id);

    return this.prisma.fullReductionActivity.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 切换状态
   */
  async toggleStatus(id: number, userId: number) {
    const record = await this.findOne(id);

    // 根据当前状态切换
    let newStatus: 'NOT_STARTED' | 'RUNNING' | 'ENDED' | 'DISABLED';
    if (record.status === 'DISABLED') {
      // 禁用状态恢复为未开始
      newStatus = 'NOT_STARTED';
    } else {
      // 其他状态切换为禁用
      newStatus = 'DISABLED';
    }

    return this.prisma.fullReductionActivity.update({
      where: { id },
      data: {
        status: newStatus,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 更新活动状态（定时任务调用）
   */
  async updateActivityStatus() {
    const now = new Date();

    // 更新未开始 -> 进行中
    await this.prisma.fullReductionActivity.updateMany({
      where: {
        deleted: false,
        status: 'NOT_STARTED',
        startTime: { lte: now },
        endTime: { gt: now },
      },
      data: { status: 'RUNNING' },
    });

    // 更新进行中 -> 已结束
    await this.prisma.fullReductionActivity.updateMany({
      where: {
        deleted: false,
        status: 'RUNNING',
        endTime: { lte: now },
      },
      data: { status: 'ENDED' },
    });
  }
}
