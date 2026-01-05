import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QueryMemberBalanceLogDto } from './dto/query-member-balance-log.dto';
import { CreateMemberBalanceLogDto } from './dto/create-member-balance-log.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class MemberBalanceLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * 分页查询余额流水
   */
  async findAll(query: QueryMemberBalanceLogDto) {
    const {
      page = 1,
      pageSize = 10,
      memberId,
      type,
      startTime,
      endTime,
    } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deleted: false,
      ...(memberId && { memberId }),
      ...(type && { type }),
    };

    // 时间范围查询
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        where.createdAt.gte = new Date(startTime);
      }
      if (endTime) {
        where.createdAt.lte = new Date(endTime);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.memberBalanceLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          member: {
            select: {
              id: true,
              username: true,
              nickname: true,
              phone: true,
              avatar: true,
              balance: true,
            },
          },
        },
      }),
      this.prisma.memberBalanceLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取会员的余额流水
   */
  async findByMemberId(memberId: number) {
    return this.prisma.memberBalanceLog.findMany({
      where: { memberId, deleted: false },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * 创建余额变动记录（调整余额）
   */
  async create(dto: CreateMemberBalanceLogDto, userId: number) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, deleted: false },
    });

    if (!member) {
      throw new BadRequestException('会员不存在');
    }

    const beforeAmount = member.balance ?? new Decimal(0);
    const afterAmount = new Decimal(beforeAmount).plus(dto.amount);

    if (afterAmount.lessThan(0)) {
      throw new BadRequestException('余额不足');
    }

    // 使用事务同时更新会员余额和创建流水记录
    const [log] = await this.prisma.$transaction([
      this.prisma.memberBalanceLog.create({
        data: {
          memberId: dto.memberId,
          type: dto.type,
          amount: dto.amount,
          beforeAmount,
          afterAmount,
          orderId: dto.orderId,
          remark: dto.remark,
          createdBy: String(userId),
        },
      }),
      this.prisma.member.update({
        where: { id: dto.memberId },
        data: {
          balance: afterAmount,
          updatedBy: String(userId),
        },
      }),
    ]);

    return log;
  }
}
