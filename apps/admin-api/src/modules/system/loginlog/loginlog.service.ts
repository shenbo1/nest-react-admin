import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QueryLoginLogDto } from './dto/query-loginlog.dto';
import { PaginatedResult } from '@/common/dto';

@Injectable()
export class LoginLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryLoginLogDto) {
    const { page = 1, pageSize = 10, username, status, beginTime, endTime } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (username) {
      where.username = { contains: username };
    }
    if (status) {
      where.status = status;
    }
    if (beginTime && endTime) {
      where.loginTime = {
        gte: new Date(beginTime),
        lte: new Date(endTime),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.sysLoginLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { loginTime: 'desc' },
      }),
      this.prisma.sysLoginLog.count({ where }),
    ]);

    return new PaginatedResult(data, total, page, pageSize);
  }

  async remove(ids: string) {
    if (!ids) {
      throw new BadRequestException('缺少要删除的日志ID');
    }

    const idList = ids.split(',').map((id) => parseInt(id));

    await this.prisma.sysLoginLog.deleteMany({
      where: {
        id: {
          in: idList,
        },
      },
    });

    return { message: '删除成功' };
  }
}
