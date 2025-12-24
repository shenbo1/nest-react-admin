import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建
   */
  async create(dto: CreateArticleDto, userId: number) {
    return this.prisma.article.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });
  }

  /**
   * 分页查询
   */
  async findAll(query: QueryArticleDto) {
    const { page = 1, pageSize = 10, name, status } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      deleted: false,
      ...(name && { name: { contains: name } }),
      ...(status && { status }),
    };

    const [list, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取详情
   */
  async findOne(id: number) {
    const record = await this.prisma.article.findFirst({
      where: { id, deleted: false },
    });
    if (!record) {
      throw new NotFoundException('记录不存在');
    }
    return record;
  }

  /**
   * 更新
   */
  async update(id: number, dto: UpdateArticleDto, userId: number) {
    await this.findOne(id);

    return this.prisma.article.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  /**
   * 删除（软删除）
   */
  async remove(id: number, userId: number) {
    await this.findOne(id);

    return this.prisma.article.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  /**
   * 切换状态
   */
  async toggleStatus(id: number, userId: number) {
    const record = await this.findOne(id);

    const newStatus = record.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';

    return this.prisma.article.update({
      where: { id },
      data: {
        status: newStatus,
        updatedBy: userId,
      },
    });
  }
}
