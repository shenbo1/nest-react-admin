import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QuerySignInDto } from './dto/query-sign-in.dto';

@Injectable()
export class SignInService {
  constructor(private prisma: PrismaService) {}

  /**
   * 分页查询列表
   */
  async findAll(query: QuerySignInDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { memberId, startDate, endDate } = query;

    const where = {
      deleted: false,
      ...(memberId && { memberId }),
      ...(startDate && { signDate: { gte: startDate } }),
      ...(endDate && { signDate: { lte: endDate } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.memberSignIn.findMany({
        where,
        orderBy: [{ signDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.memberSignIn.count({ where }),
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
    const record = await this.prisma.memberSignIn.findFirst({
      where: { id, deleted: false },
    });
    if (!record) {
      throw new NotFoundException('签到记录不存在');
    }
    return record;
  }

  /**
   * 获取签到统计（按日期）
   */
  async getStatsByDate(startDate: Date, endDate: Date) {
    const stats = await this.prisma.memberSignIn.groupBy({
      by: ['signDate'],
      where: {
        deleted: false,
        signDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        points: true,
        basePoints: true,
        bonusPoints: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        signDate: 'asc',
      },
    });

    return stats.map((item) => ({
      date: item.signDate,
      signCount: item._count.id,
      totalPoints: item._sum.points || 0,
      basePoints: item._sum.basePoints || 0,
      bonusPoints: item._sum.bonusPoints || 0,
    }));
  }

  /**
   * 获取月度签到统计
   */
  async getMonthlyStats(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [totalSignIns, activeMembers, totalPoints, avgConsecutiveDays] = await Promise.all([
      this.prisma.memberSignIn.count({
        where: {
          deleted: false,
          signDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      this.prisma.memberSignIn.groupBy({
        by: ['memberId'],
        where: {
          deleted: false,
          signDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }).then(result => result.length),
      this.prisma.memberSignIn.aggregate({
        where: {
          deleted: false,
          signDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          points: true,
        },
      }),
      this.prisma.memberSignIn.aggregate({
        where: {
          deleted: false,
          signDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _avg: {
          consecutiveDays: true,
        },
      }),
    ]);

    return {
      year,
      month,
      totalSignIns,
      activeMembers,
      totalPoints: totalPoints._sum.points || 0,
      avgConsecutiveDays: Math.round(avgConsecutiveDays._avg.consecutiveDays || 0),
    };
  }

  /**
   * 获取会员签到排行（按连续签到天数）
   */
  async getMemberRanking(limit: number = 10) {
    // 获取每个会员的最新签到记录
    const latestSignIns = await this.prisma.memberSignIn.findMany({
      where: { deleted: false },
      select: {
        memberId: true,
        consecutiveDays: true,
        signDate: true,
      },
      orderBy: [
        { memberId: 'asc' },
        { signDate: 'desc' },
      ],
    });

    // 按会员分组，取最新的记录
    const memberMap = new Map();
    latestSignIns.forEach((signIn) => {
      if (!memberMap.has(signIn.memberId)) {
        memberMap.set(signIn.memberId, signIn);
      }
    });

    // 排序并取前 limit 名
    const ranking = Array.from(memberMap.values())
      .sort((a, b) => b.consecutiveDays - a.consecutiveDays)
      .slice(0, limit);

    // 获取会员信息
    const memberIds = ranking.map(r => r.memberId);
    const members = await this.prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: {
        id: true,
        username: true,
        nickname: true,
      },
    });

    const memberMapInfo = new Map(members.map(m => [m.id, m]));

    return ranking.map((item, index) => {
      const member = memberMapInfo.get(item.memberId);
      return {
        rank: index + 1,
        memberId: item.memberId,
        username: member?.username || '',
        realName: member?.nickname || '',
        consecutiveDays: item.consecutiveDays,
        lastSignDate: item.signDate,
      };
    });
  }
}