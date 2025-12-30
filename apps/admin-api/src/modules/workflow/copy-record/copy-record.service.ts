import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QueryCopyRecordDto } from './dto';

@Injectable()
export class CopyRecordService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 查询抄送给我的记录
   */
  async findMyCopies(userId: number, query: QueryCopyRecordDto) {
    const { page = 1, pageSize = 10, isRead } = query;

    const where = {
      userId,
      ...(isRead !== undefined && { isRead }),
    };

    const [list, total] = await Promise.all([
      this.prisma.wfCopyRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          flowInstance: {
            select: {
              instanceNo: true,
              title: true,
              initiatorName: true,
              status: true,
              startTime: true,
              flowDefinition: {
                select: { name: true, category: true },
              },
            },
          },
          task: {
            select: {
              nodeName: true,
              assigneeName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wfCopyRecord.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  /**
   * 标记为已读
   */
  async markAsRead(id: number, userId: number) {
    const record = await this.prisma.wfCopyRecord.findFirst({
      where: { id, userId },
    });

    if (!record) {
      throw new NotFoundException('抄送记录不存在');
    }

    if (record.isRead) {
      return record;
    }

    return this.prisma.wfCopyRecord.update({
      where: { id },
      data: {
        isRead: true,
        readTime: new Date(),
      },
    });
  }

  /**
   * 批量标记为已读
   */
  async markAllAsRead(userId: number) {
    return this.prisma.wfCopyRecord.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readTime: new Date(),
      },
    });
  }

  /**
   * 获取未读数量
   */
  async getUnreadCount(userId: number) {
    const count = await this.prisma.wfCopyRecord.count({
      where: { userId, isRead: false },
    });
    return { count };
  }
}
