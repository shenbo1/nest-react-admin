import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateCouponTemplateDto } from './dto/create-coupon-template.dto';
import { UpdateCouponTemplateDto } from './dto/update-coupon-template.dto';
import { QueryCouponTemplateDto } from './dto/query-coupon-template.dto';
import { CouponSource, MemberCouponStatus } from '@prisma/client';

@Injectable()
export class CouponTemplateService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建优惠券模板
   */
  async create(dto: CreateCouponTemplateDto, userId: number) {
    // 生成优惠码
    const code = this.generateCouponCode();

    // 验证有效期逻辑
    if (dto.validType === 'DAYS' && !dto.validDays) {
      throw new BadRequestException('相对有效期必须指定有效天数');
    }
    if (dto.validType === 'FIXED' && (!dto.validStartTime || !dto.validEndTime)) {
      throw new BadRequestException('绝对有效期必须指定起止时间');
    }

    return this.prisma.couponTemplate.create({
      data: {
        name: dto.name,
        code,
        type: dto.type,
        value: dto.value,
        minAmount: dto.minAmount ?? 0,
        maxDiscount: dto.maxDiscount,
        totalCount: dto.totalCount ?? -1,
        perLimitCount: dto.perLimitCount ?? 1,
        receiveStartTime: dto.receiveStartTime,
        receiveEndTime: dto.receiveEndTime,
        validType: dto.validType,
        validStartTime: dto.validStartTime,
        validEndTime: dto.validEndTime,
        validDays: dto.validDays,
        scopeType: dto.scopeType ?? 'ALL',
        scopeIds: dto.scopeIds ? JSON.parse(dto.scopeIds) : undefined,
        stackable: dto.stackable ?? false,
        status: dto.status ?? 'ENABLED',
        description: dto.description,
        createdBy: String(userId),
      },
    });
  }

  /**
   * 分页查询列表
   */
  async findAll(query: QueryCouponTemplateDto) {
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
      this.prisma.couponTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.couponTemplate.count({ where }),
    ]);

    // 统计已发放数量
    const templateIds = data.map((t) => t.id);
    const stats = await this.prisma.memberCoupon.groupBy({
      by: ['templateId'],
      where: { templateId: { in: templateIds } },
      _count: true,
    });

    const statsMap = new Map(stats.map((s) => [s.templateId, s._count]));

    const list = data.map((t) => ({
      ...t,
      distributedCount: statsMap.get(t.id) || 0,
      remainingCount: t.totalCount ? t.totalCount - (statsMap.get(t.id) || 0) : null,
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
    const record = await this.prisma.couponTemplate.findFirst({
      where: { id, deleted: false },
    });
    if (!record) {
      throw new NotFoundException('优惠券模板不存在');
    }

    // 统计已发放数量
    const distributedCount = await this.prisma.memberCoupon.count({
      where: { templateId: id },
    });

    return {
      ...record,
      distributedCount,
      remainingCount: record.totalCount
        ? record.totalCount - distributedCount
        : null,
    };
  }

  /**
   * 更新
   */
  async update(id: number, dto: UpdateCouponTemplateDto, userId: number) {
    const current = await this.findOne(id);

    // 如果已有发放记录，不能修改核心参数
    const distributedCount = await this.prisma.memberCoupon.count({
      where: { templateId: id },
    });

    if (distributedCount > 0) {
      const restrictedFields = ['type', 'value', 'minAmount', 'maxDiscount', 'totalCount'];
      const attemptedRestricted = restrictedFields.filter(
        (f) => dto[f as keyof UpdateCouponTemplateDto] !== undefined,
      );
      if (attemptedRestricted.length > 0) {
        throw new ConflictException(
          `该模板已有发放记录，无法修改以下字段: ${attemptedRestricted.join(', ')}`,
        );
      }
    }

    return this.prisma.couponTemplate.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 删除（软删除）
   */
  async remove(id: number, userId: number) {
    await this.findOne(id);

    // 检查是否有已发放的优惠券
    const distributedCount = await this.prisma.memberCoupon.count({
      where: { templateId: id, status: { not: 'EXPIRED' } },
    });

    if (distributedCount > 0) {
      throw new ConflictException('该模板已有用户领取优惠券，无法删除');
    }

    return this.prisma.couponTemplate.update({
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

    return this.prisma.couponTemplate.update({
      where: { id },
      data: {
        status: newStatus,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 发放优惠券给用户
   */
  async grant(
    templateId: number,
    memberIds: number[],
    operatorId: number,
    grantBy?: string,
  ) {
    const template = await this.findOne(templateId);

    if (template.status !== 'ENABLED') {
      throw new BadRequestException('该优惠券模板已停用，无法发放');
    }

    // 检查领取时间
    const now = new Date();
    if (template.receiveStartTime && now < template.receiveStartTime) {
      throw new BadRequestException('未到优惠券领取时间');
    }
    if (template.receiveEndTime && now > template.receiveEndTime) {
      throw new BadRequestException('优惠券领取时间已过');
    }

    // 检查库存
    if (template.totalCount) {
      const distributedCount = await this.prisma.memberCoupon.count({
        where: { templateId },
      });
      if (distributedCount + memberIds.length > template.totalCount) {
        throw new BadRequestException('优惠券库存不足');
      }
    }

    // 批量创建用户优惠券
    const memberCoupons = await Promise.all(
      memberIds.map(async (memberId) => {
        // 检查是否超出个人限领数量
        if (template.perLimitCount) {
          const memberCount = await this.prisma.memberCoupon.count({
            where: { templateId, memberId },
          });
          if (memberCount >= template.perLimitCount) {
            return null; // 跳过此用户
          }
        }

        // 计算有效期
        const validStartTime: Date =
          template.validType === 'FIXED' && template.validStartTime
            ? template.validStartTime
            : now;
        let validEndTime: Date = now;

        if (template.validType === 'FIXED' && template.validEndTime) {
          validEndTime = template.validEndTime;
        } else if (template.validType === 'DAYS' && template.validDays) {
          validEndTime = new Date(now.getTime() + template.validDays * 24 * 60 * 60 * 1000);
        }

        return this.prisma.memberCoupon.create({
          data: {
            memberId,
            templateId,
            couponCode: this.generateCouponCode(),
            source: CouponSource.SYSTEM_GRANT,
            grantBy: operatorId,
            status: MemberCouponStatus.UNUSED,
            receiveTime: now,
            validStartTime,
            validEndTime,
          },
        });
      }),
    );

    const successCount = memberCoupons.filter(Boolean).length;

    return {
      successCount,
      totalCount: memberIds.length,
      message: `成功发放 ${successCount} 张优惠券`,
    };
  }

  /**
   * 生成优惠码
   */
  private generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
