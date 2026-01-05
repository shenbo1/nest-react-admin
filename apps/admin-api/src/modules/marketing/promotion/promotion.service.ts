import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { QueryPromotionDto } from './dto/query-promotion.dto';

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建促销活动
   */
  async create(dto: CreatePromotionDto, userId: number) {
    // 检查编码唯一性
    const existing = await this.prisma.promotion.findFirst({
      where: { code: dto.code, deleted: false },
    });
    if (existing) {
      throw new ConflictException(`活动编码 ${dto.code} 已存在`);
    }

    // 拼团活动必须配置成团人数
    if (dto.type === 'GROUP_BUY') {
      if (!dto.ruleConfig?.requiredCount || dto.ruleConfig.requiredCount < 2) {
        throw new BadRequestException('拼团活动必须设置成团人数（至少2人）');
      }
    }

    return this.prisma.promotion.create({
      data: {
        name: dto.name,
        code: dto.code,
        type: dto.type,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        coverImage: dto.coverImage,
        ruleConfig: dto.ruleConfig,
        warmUpTime: dto.warmUpTime ? new Date(dto.warmUpTime) : undefined,
        showCountdown: dto.showCountdown ?? true,
        memberLevelIds: dto.memberLevelIds,
        limitPerMember: dto.limitPerMember ?? 0,
        priority: dto.priority ?? 0,
        status: 'NOT_STARTED',
        description: dto.description,
        createdBy: String(userId),
      },
    });
  }

  /**
   * 分页查询列表
   */
  async findAll(query: QueryPromotionDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { name, code, type, status } = query;

    const where = {
      deleted: false,
      ...(name && { name: { contains: name } }),
      ...(code && { code: { contains: code } }),
      ...(type && { type }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        include: {
          _count: {
            select: { promotionProducts: { where: { deleted: false } } },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.promotion.count({ where }),
    ]);

    // 转换数据格式
    const list = data.map((item) => ({
      ...item,
      productCount: item._count.promotionProducts,
      _count: undefined,
    }));

    return {
      data: list,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取详情
   */
  async findOne(id: number) {
    const record = await this.prisma.promotion.findFirst({
      where: { id, deleted: false },
      include: {
        promotionProducts: {
          where: { deleted: false },
          orderBy: { sort: 'asc' },
        },
      },
    });
    if (!record) {
      throw new NotFoundException('促销活动不存在');
    }
    return record;
  }

  /**
   * 更新
   */
  async update(id: number, dto: UpdatePromotionDto, userId: number) {
    const record = await this.findOne(id);

    // 进行中的活动限制修改
    if (record.status === 'RUNNING') {
      // 只允许修改结束时间、描述等
      const allowedFields = ['endTime', 'description', 'coverImage'];
      const attemptedFields = Object.keys(dto);
      const disallowedFields = attemptedFields.filter(
        (f) => !allowedFields.includes(f) && (dto as Record<string, any>)[f] !== undefined
      );
      if (disallowedFields.length > 0) {
        throw new BadRequestException(
          `进行中的活动不能修改：${disallowedFields.join(', ')}`
        );
      }
    }

    // 检查编码唯一性
    if (dto.code) {
      const existing = await this.prisma.promotion.findFirst({
        where: { code: dto.code, deleted: false, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`活动编码 ${dto.code} 已存在`);
      }
    }

    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        warmUpTime: dto.warmUpTime ? new Date(dto.warmUpTime) : undefined,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 删除（软删除）
   */
  async remove(id: number, userId: number) {
    const record = await this.findOne(id);

    if (record.status === 'RUNNING') {
      throw new BadRequestException('进行中的活动不能删除');
    }

    return this.prisma.promotion.update({
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

    let newStatus: 'NOT_STARTED' | 'RUNNING' | 'ENDED' | 'DISABLED';
    if (record.status === 'DISABLED') {
      newStatus = 'NOT_STARTED';
    } else {
      newStatus = 'DISABLED';
    }

    return this.prisma.promotion.update({
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
    await this.prisma.promotion.updateMany({
      where: {
        deleted: false,
        status: 'NOT_STARTED',
        startTime: { lte: now },
        endTime: { gt: now },
      },
      data: { status: 'RUNNING' },
    });

    // 更新进行中 -> 已结束
    await this.prisma.promotion.updateMany({
      where: {
        deleted: false,
        status: 'RUNNING',
        endTime: { lte: now },
      },
      data: { status: 'ENDED' },
    });
  }
}
