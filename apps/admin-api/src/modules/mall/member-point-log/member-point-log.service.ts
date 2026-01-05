import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QueryMemberPointLogDto } from './dto/query-member-point-log.dto';
import { CreateMemberPointLogDto } from './dto/create-member-point-log.dto';

@Injectable()
export class MemberPointLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * 分页查询积分流水
   */
  async findAll(query: QueryMemberPointLogDto) {
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
      this.prisma.memberPointLog.findMany({
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
              points: true,
            },
          },
        },
      }),
      this.prisma.memberPointLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取会员的积分流水
   */
  async findByMemberId(memberId: number) {
    return this.prisma.memberPointLog.findMany({
      where: { memberId, deleted: false },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * 创建积分变动记录（调整积分）
   */
  async create(dto: CreateMemberPointLogDto, userId: number) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, deleted: false },
    });

    if (!member) {
      throw new BadRequestException('会员不存在');
    }

    const beforePoints = member.points;
    const afterPoints = beforePoints + dto.points;

    if (afterPoints < 0) {
      throw new BadRequestException('积分不足');
    }

    // 使用事务同时更新会员积分和创建流水记录
    const [log] = await this.prisma.$transaction([
      this.prisma.memberPointLog.create({
        data: {
          memberId: dto.memberId,
          type: dto.type,
          points: dto.points,
          beforePoints,
          afterPoints,
          orderId: dto.orderId,
          remark: dto.remark,
          createdBy: String(userId),
        },
      }),
      this.prisma.member.update({
        where: { id: dto.memberId },
        data: {
          points: afterPoints,
          updatedBy: String(userId),
        },
      }),
    ]);

    return log;
  }
}
