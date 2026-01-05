import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QueryGroupBuyOrderDto } from './dto/query-group-buy-order.dto';

@Injectable()
export class GroupBuyOrderService {
  constructor(private prisma: PrismaService) {}

  /**
   * 分页查询列表
   */
  async findAll(query: QueryGroupBuyOrderDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { groupNo, promotionId, productId, leaderId, status } = query;

    const where = {
      deleted: false,
      ...(groupNo && { groupNo: { contains: groupNo } }),
      ...(promotionId && { promotionId }),
      ...(productId && { productId }),
      ...(leaderId && { leaderId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.groupBuyOrder.findMany({
        where,
        include: {
          promotion: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          members: {
            where: { deleted: false },
            select: {
              id: true,
              memberId: true,
              isLeader: true,
              payStatus: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.groupBuyOrder.count({ where }),
    ]);

    // 计算剩余时间和进度
    const now = new Date();
    const list = data.map((item) => {
      const remainingTime =
        item.status === 'WAITING'
          ? Math.max(0, item.expireTime.getTime() - now.getTime())
          : 0;
      const progress = Math.round((item.currentCount / item.requiredCount) * 100);

      return {
        ...item,
        remainingTime,
        progress,
        paidCount: item.members.filter((m) => m.payStatus === 'PAID').length,
      };
    });

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
    const record = await this.prisma.groupBuyOrder.findFirst({
      where: { id, deleted: false },
      include: {
        promotion: true,
        members: {
          where: { deleted: false },
          orderBy: { joinTime: 'asc' },
        },
      },
    });
    if (!record) {
      throw new NotFoundException('拼团订单不存在');
    }
    return record;
  }

  /**
   * 取消拼团
   */
  async cancel(id: number, userId: number) {
    const record = await this.findOne(id);

    if (record.status !== 'WAITING') {
      throw new BadRequestException('只能取消待成团的拼团');
    }

    return this.prisma.groupBuyOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        failReason: '管理员取消',
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 手动成团
   */
  async manualFinish(id: number, userId: number) {
    const record = await this.findOne(id);

    if (record.status !== 'WAITING') {
      throw new BadRequestException('只能对待成团的拼团进行手动成团');
    }

    // 检查是否有已支付的成员
    const paidMembers = record.members.filter((m: any) => m.payStatus === 'PAID');
    if (paidMembers.length === 0) {
      throw new BadRequestException('没有已支付的成员，无法成团');
    }

    return this.prisma.groupBuyOrder.update({
      where: { id },
      data: {
        status: 'SUCCESS',
        successTime: new Date(),
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 获取统计数据
   */
  async getStats() {
    const [waiting, success, failed, cancelled] = await Promise.all([
      this.prisma.groupBuyOrder.count({ where: { deleted: false, status: 'WAITING' } }),
      this.prisma.groupBuyOrder.count({ where: { deleted: false, status: 'SUCCESS' } }),
      this.prisma.groupBuyOrder.count({ where: { deleted: false, status: 'FAILED' } }),
      this.prisma.groupBuyOrder.count({ where: { deleted: false, status: 'CANCELLED' } }),
    ]);

    return {
      waiting,
      success,
      failed,
      cancelled,
      total: waiting + success + failed + cancelled,
    };
  }

  /**
   * 处理过期拼团（定时任务调用）
   */
  async handleExpiredOrders() {
    const now = new Date();

    // 查找已过期但仍在等待的拼团
    const expiredOrders = await this.prisma.groupBuyOrder.findMany({
      where: {
        deleted: false,
        status: 'WAITING',
        expireTime: { lt: now },
      },
    });

    // 批量更新为失败状态
    if (expiredOrders.length > 0) {
      await this.prisma.groupBuyOrder.updateMany({
        where: {
          id: { in: expiredOrders.map((o) => o.id) },
        },
        data: {
          status: 'FAILED',
          failReason: '拼团超时未成团',
        },
      });
    }

    return { processed: expiredOrders.length };
  }
}
