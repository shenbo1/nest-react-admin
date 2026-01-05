import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建
   */
  async create(dto: CreateMemberDto, userId: number) {
    // 检查用户名是否已存在
    const existingByUsername = await this.prisma.member.findFirst({
      where: { username: dto.username, deleted: false },
    });
    if (existingByUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 检查手机号是否已存在
    if (dto.phone) {
      const existingByPhone = await this.prisma.member.findFirst({
        where: { phone: dto.phone, deleted: false },
      });
      if (existingByPhone) {
        throw new ConflictException('手机号已存在');
      }
    }

    // 检查邮箱是否已存在
    if (dto.email) {
      const existingByEmail = await this.prisma.member.findFirst({
        where: { email: dto.email, deleted: false },
      });
      if (existingByEmail) {
        throw new ConflictException('邮箱已存在');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.member.create({
      data: {
        ...dto,
        password: hashedPassword,
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
        omit: { password: true },
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
      omit: { password: true },
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

    // 检查用户名是否已被其他会员使用
    if (dto.username) {
      const existingByUsername = await this.prisma.member.findFirst({
        where: { username: dto.username, deleted: false, id: { not: id } },
      });
      if (existingByUsername) {
        throw new ConflictException('用户名已存在');
      }
    }

    // 检查手机号是否已被其他会员使用
    if (dto.phone) {
      const existingByPhone = await this.prisma.member.findFirst({
        where: { phone: dto.phone, deleted: false, id: { not: id } },
      });
      if (existingByPhone) {
        throw new ConflictException('手机号已存在');
      }
    }

    // 检查邮箱是否已被其他会员使用
    if (dto.email) {
      const existingByEmail = await this.prisma.member.findFirst({
        where: { email: dto.email, deleted: false, id: { not: id } },
      });
      if (existingByEmail) {
        throw new ConflictException('邮箱已存在');
      }
    }

    // 如果更新了密码，需要加密
    const updateData: any = { ...dto, updatedBy: String(userId) };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.member.update({
      where: { id },
      data: updateData,
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

  /**
   * 批量删除（软删除）
   */
  async batchRemove(ids: number[], userId: number) {
    return this.prisma.member.updateMany({
      where: {
        id: { in: ids },
        deleted: false,
      },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 切换状态
   */
  async toggleStatus(id: number, userId: number) {
    const member = await this.findOne(id);
    const newStatus = member.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';

    return this.prisma.member.update({
      where: { id },
      data: {
        status: newStatus,
        updatedBy: String(userId),
      },
    });
  }
}
