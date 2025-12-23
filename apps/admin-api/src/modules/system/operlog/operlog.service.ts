import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QueryOperLogDto } from './dto/query-operlog.dto';
import { PaginatedResult } from '@/common/dto';

@Injectable()
export class OperLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryOperLogDto) {
    const { page = 1, pageSize = 10, operName, businessType, status, beginTime, endTime } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (operName) {
      where.operName = { contains: operName };
    }
    if (businessType !== undefined) {
      where.businessType = businessType;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (beginTime && endTime) {
      where.operTime = {
        gte: new Date(beginTime),
        lte: new Date(endTime),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.sysOperLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { operTime: 'desc' },
      }),
      this.prisma.sysOperLog.count({ where }),
    ]);

    return new PaginatedResult(data, total, page, pageSize);
  }

  async remove(ids: string) {
    if (!ids) {
      throw new BadRequestException('缺少要删除的日志ID');
    }

    const idList = ids.split(',').map((id) => parseInt(id));

    await this.prisma.sysOperLog.deleteMany({
      where: {
        id: {
          in: idList,
        },
      },
    });

    return { message: '删除成功' };
  }
}
