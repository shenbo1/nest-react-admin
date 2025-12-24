import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建
   */
  async create(dto: CreateMemberDto, userId: number) {
    return this.prisma.member.create({
      data: {
        ...dto,
        createdBy: String(userId),
      },
    });
  }

  /**
   * 分页查询
   */
  async findAll(query: QueryMemberDto) {
    const { page = 1, pageSize = 10, username, phone, status } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      deleted: false,
      ...(username && { username: { contains: username } }),
      ...(phone && { phone: { contains: phone } }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.member.count({ where }),
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
    const record = await this.prisma.member.findFirst({
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
  async update(id: number, dto: UpdateMemberDto, userId: number) {
    await this.findOne(id);

    return this.prisma.member.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 删除（软删除）
   */
  async remove(id: number, userId: number) {
    await this.findOne(id);

    return this.prisma.member.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });
  }
}
