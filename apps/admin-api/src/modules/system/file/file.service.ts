import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QueryFileDto } from './dto/query-file.dto';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService) {}

  /**
   * 分页查询文件列表
   */
  async findAll(query: QueryFileDto) {
    const { page = 1, pageSize = 10, originalName, fileType } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      deleted: false,
      ...(originalName && { originalName: { contains: originalName } }),
      ...(fileType && { fileType }),
    };

    const [data, total] = await Promise.all([
      this.prisma.sysFile.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              nickname: true,
            },
          },
        },
      }),
      this.prisma.sysFile.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取文件详情
   */
  async findOne(id: number) {
    const file = await this.prisma.sysFile.findFirst({
      where: { id, deleted: false },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            nickname: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    return file;
  }

  /**
   * 删除文件（软删除 + 删除物理文件）
   */
  async remove(id: number, userId: number) {
    const file = await this.findOne(id);

    // 删除物理文件
    try {
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      const filePath =
        file.fileType === 'image'
          ? join(uploadDir, file.filename)
          : join(uploadDir, 'files', file.filename);

      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      // 物理文件删除失败不影响数据库记录删除
      console.error('删除物理文件失败:', error);
    }

    // 软删除数据库记录
    return this.prisma.sysFile.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * 创建文件记录
   */
  async create(data: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    fileType: string;
    uploadedBy?: number;
  }) {
    return this.prisma.sysFile.create({
      data,
    });
  }
}
