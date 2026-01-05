import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QueryMemberLoginLogDto } from './dto/query-member-login-log.dto';

@Injectable()
export class MemberLoginLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * 分页查询登录日志
   */
  async findAll(query: QueryMemberLoginLogDto) {
    const {
      page = 1,
      pageSize = 10,
      memberId,
      ipaddr,
      status,
      startTime,
      endTime,
    } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deleted: false,
      ...(memberId && { memberId }),
      ...(ipaddr && { ipaddr: { contains: ipaddr } }),
      ...(status && { status }),
    };

    // 时间范围查询
    if (startTime || endTime) {
      where.loginTime = {};
      if (startTime) {
        where.loginTime.gte = new Date(startTime);
      }
      if (endTime) {
        where.loginTime.lte = new Date(endTime);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.memberLoginLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { loginTime: 'desc' },
        include: {
          member: {
            select: {
              id: true,
              username: true,
              nickname: true,
              phone: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.memberLoginLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取会员的登录日志
   */
  async findByMemberId(memberId: number) {
    return this.prisma.memberLoginLog.findMany({
      where: { memberId, deleted: false },
      orderBy: { loginTime: 'desc' },
      take: 100,
    });
  }

  /**
   * 删除登录日志（软删除）
   */
  async remove(id: number, userId: number) {
    return this.prisma.memberLoginLog.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 批量删除登录日志
   */
  async batchRemove(ids: number[], userId: number) {
    return this.prisma.memberLoginLog.updateMany({
      where: { id: { in: ids } },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 清空登录日志
   */
  async clear(userId: number) {
    return this.prisma.memberLoginLog.updateMany({
      where: { deleted: false },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });
  }
}
