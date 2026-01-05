import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QueryMemberCouponDto } from './dto/query-member-coupon.dto';
import { MemberCouponStatus } from '@prisma/client';

@Injectable()
export class MemberCouponService {
  constructor(private prisma: PrismaService) {}

  /**
   * 分页查询列表
   */
  async findAll(query: QueryMemberCouponDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { memberId, templateId, status } = query;

    const where = {
      ...(memberId && { memberId: Number(memberId) }),
      ...(templateId && { templateId: Number(templateId) }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.memberCoupon.findMany({
        where,
        orderBy: { receiveTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              type: true,
              value: true,
              minAmount: true,
            },
          },
        },
      }),
      this.prisma.memberCoupon.count({ where }),
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
    const record = await this.prisma.memberCoupon.findFirst({
      where: { id },
      include: {
        template: true,
      },
    });
    if (!record) {
      throw new NotFoundException('用户优惠券不存在');
    }
    return record;
  }

  /**
   * 禁用/作废优惠券
   */
  async disable(id: number) {
    const record = await this.findOne(id);

    if (record.status !== MemberCouponStatus.UNUSED) {
      throw new BadRequestException('只能禁用未使用的优惠券');
    }

    return this.prisma.memberCoupon.update({
      where: { id },
      data: {
        status: MemberCouponStatus.FROZEN,
      },
    });
  }

  /**
   * 核销优惠券
   */
  async use(
    id: number,
    orderId?: number,
    orderNo?: string,
    discountAmount?: number,
  ) {
    const record = await this.findOne(id);

    if (record.status !== MemberCouponStatus.UNUSED) {
      throw new BadRequestException('该优惠券已使用或已过期');
    }

    // 检查是否过期
    if (record.validEndTime && new Date() > record.validEndTime) {
      await this.prisma.memberCoupon.update({
        where: { id },
        data: { status: MemberCouponStatus.EXPIRED },
      });
      throw new BadRequestException('该优惠券已过期');
    }

    return this.prisma.memberCoupon.update({
      where: { id },
      data: {
        status: MemberCouponStatus.USED,
        useTime: new Date(),
        orderId: orderId ?? null,
        orderNo: orderNo ?? null,
        discountAmount: discountAmount ?? null,
      },
    });
  }

  /**
   * 获取用户可用优惠券
   */
  async findAvailableByMemberId(memberId: number) {
    const now = new Date();

    return this.prisma.memberCoupon.findMany({
      where: {
        memberId,
        status: 'UNUSED',
        validEndTime: { gte: now },
      },
      include: {
        template: true,
      },
      orderBy: { validEndTime: 'asc' },
    });
  }
}
