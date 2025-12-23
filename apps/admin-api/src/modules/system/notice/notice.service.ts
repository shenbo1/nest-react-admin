import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { QueryNoticeDto } from './dto/query-notice.dto';
import { PaginatedResult } from '@/common/dto';
import { Status } from '@prisma/client';

@Injectable()
export class NoticeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNoticeDto: CreateNoticeDto) {
    const notice = await this.prisma.sysNotice.create({
      data: {
        ...createNoticeDto,
        status: createNoticeDto.status as Status || 'ENABLED',
      },
    });

    return notice;
  }

  async findAll(query: QueryNoticeDto) {
    const { page = 1, pageSize = 10, title, noticeType, status } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };

    if (title) {
      where.title = { contains: title };
    }
    if (noticeType) {
      where.noticeType = noticeType;
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.sysNotice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysNotice.count({ where }),
    ]);

    return new PaginatedResult(data, total, page, pageSize);
  }

  async findOne(id: number) {
    const notice = await this.prisma.sysNotice.findFirst({
      where: { id, deleted: false },
    });

    if (!notice) {
      throw new NotFoundException('公告不存在');
    }

    return notice;
  }

  async update(id: number, updateNoticeDto: UpdateNoticeDto) {
    const existing = await this.prisma.sysNotice.findFirst({
      where: { id, deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('公告不存在');
    }

    const notice = await this.prisma.sysNotice.update({
      where: { id },
      data: {
        ...updateNoticeDto,
        status: updateNoticeDto.status as Status,
      },
    });

    return notice;
  }

  async remove(id: number) {
    const existing = await this.prisma.sysNotice.findFirst({
      where: { id, deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('公告不存在');
    }

    await this.prisma.sysNotice.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });

    return { message: '删除成功' };
  }
}
