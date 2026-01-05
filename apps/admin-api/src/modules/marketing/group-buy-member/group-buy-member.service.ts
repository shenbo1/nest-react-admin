import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QueryGroupBuyMemberDto } from './dto/query-group-buy-member.dto';

@Injectable()
export class GroupBuyMemberService {
  constructor(private prisma: PrismaService) {}

  /**
   * 分页查询列表
   */
  async findAll(query: QueryGroupBuyMemberDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { groupOrderId, memberId, isLeader, payStatus } = query;

    const where = {
      deleted: false,
      ...(groupOrderId && { groupOrderId }),
      ...(memberId && { memberId }),
      ...(isLeader !== undefined && { isLeader }),
      ...(payStatus && { payStatus }),
    };

    const [data, total] = await Promise.all([
      this.prisma.groupBuyMember.findMany({
        where,
        include: {
          groupOrder: {
            select: {
              id: true,
              groupNo: true,
              status: true,
              requiredCount: true,
              currentCount: true,
              groupPrice: true,
            },
          },
        },
        orderBy: { joinTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.groupBuyMember.count({ where }),
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
    const record = await this.prisma.groupBuyMember.findFirst({
      where: { id, deleted: false },
      include: {
        groupOrder: {
          include: {
            promotion: true,
          },
        },
      },
    });
    if (!record) {
      throw new NotFoundException('拼团成员不存在');
    }
    return record;
  }

  /**
   * 获取统计数据
   */
  async getStats() {
    const [unpaid, paid, refunded] = await Promise.all([
      this.prisma.groupBuyMember.count({ where: { deleted: false, payStatus: 'UNPAID' } }),
      this.prisma.groupBuyMember.count({ where: { deleted: false, payStatus: 'PAID' } }),
      this.prisma.groupBuyMember.count({ where: { deleted: false, payStatus: 'REFUNDED' } }),
    ]);

    const leaders = await this.prisma.groupBuyMember.count({
      where: { deleted: false, isLeader: true },
    });

    return {
      unpaid,
      paid,
      refunded,
      leaders,
      total: unpaid + paid + refunded,
    };
  }

  /**
   * 获取指定团单的成员列表
   */
  async findByGroupOrder(groupOrderId: number) {
    return this.prisma.groupBuyMember.findMany({
      where: {
        groupOrderId,
        deleted: false,
      },
      orderBy: [{ isLeader: 'desc' }, { joinTime: 'asc' }],
    });
  }
}
