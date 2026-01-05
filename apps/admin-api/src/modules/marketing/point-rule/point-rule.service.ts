import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreatePointRuleDto } from './dto/create-point-rule.dto';
import { UpdatePointRuleDto } from './dto/update-point-rule.dto';
import { QueryPointRuleDto } from './dto/query-point-rule.dto';

@Injectable()
export class PointRuleService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建积分规则
   */
  async create(dto: CreatePointRuleDto, userId: number) {
    // 检查编码唯一性
    const existing = await this.prisma.pointRule.findFirst({
      where: { code: dto.code, deleted: false },
    });
    if (existing) {
      throw new ConflictException(`规则编码 ${dto.code} 已存在`);
    }

    // 验证消费类型必须有消费单位
    if (dto.type === 'CONSUME' && !dto.consumeUnit) {
      throw new BadRequestException('消费类型规则必须设置消费金额单位');
    }

    return this.prisma.pointRule.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type,
        points: dto.points,
        consumeUnit: dto.consumeUnit,
        extraRules: dto.extraRules ? JSON.parse(dto.extraRules) : undefined,
        dailyLimit: dto.dailyLimit ?? 0,
        totalLimit: dto.totalLimit ?? 0,
        validDays: dto.validDays ?? 0,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        status: dto.status ?? 'ENABLED',
        description: dto.description,
        createdBy: String(userId),
      },
    });
  }

  /**
   * 分页查询列表
   */
  async findAll(query: QueryPointRuleDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { name, type, status } = query;

    const where = {
      deleted: false,
      ...(name && { name: { contains: name } }),
      ...(type && { type }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.pointRule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.pointRule.count({ where }),
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
    const record = await this.prisma.pointRule.findFirst({
      where: { id, deleted: false },
    });
    if (!record) {
      throw new NotFoundException('积分规则不存在');
    }
    return record;
  }

  /**
   * 更新
   */
  async update(id: number, dto: UpdatePointRuleDto, userId: number) {
    await this.findOne(id);

    // 检查编码唯一性
    if (dto.code) {
      const existing = await this.prisma.pointRule.findFirst({
        where: { code: dto.code, deleted: false, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`规则编码 ${dto.code} 已存在`);
      }
    }

    // 验证消费类型必须有消费单位
    if (dto.type === 'CONSUME' && dto.consumeUnit === undefined) {
      const current = await this.findOne(id);
      if (!current.consumeUnit) {
        throw new BadRequestException('消费类型规则必须设置消费金额单位');
      }
    }

    return this.prisma.pointRule.update({
      where: { id },
      data: {
        ...dto,
        extraRules: dto.extraRules ? JSON.parse(dto.extraRules) : undefined,
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

    return this.prisma.pointRule.update({
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

    const newStatus = record.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';

    return this.prisma.pointRule.update({
      where: { id },
      data: {
        status: newStatus,
        updatedBy: String(userId),
      },
    });
  }
}
