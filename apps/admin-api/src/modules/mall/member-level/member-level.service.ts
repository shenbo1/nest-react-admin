import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateMemberLevelDto } from './dto/create-member-level.dto';
import { UpdateMemberLevelDto } from './dto/update-member-level.dto';
import { QueryMemberLevelDto } from './dto/query-member-level.dto';

@Injectable()
export class MemberLevelService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建会员等级
   */
  async create(dto: CreateMemberLevelDto, userId: number) {
    // 检查编码是否已存在
    const existingByCode = await this.prisma.memberLevelRule.findFirst({
      where: { code: dto.code, deleted: false },
    });
    if (existingByCode) {
      throw new ConflictException('等级编码已存在');
    }

    // 检查等级序号是否已存在
    const existingByLevel = await this.prisma.memberLevelRule.findFirst({
      where: { level: dto.level, deleted: false },
    });
    if (existingByLevel) {
      throw new ConflictException('等级序号已存在');
    }

    return this.prisma.memberLevelRule.create({
      data: {
        ...dto,
        createdBy: String(userId),
      },
    });
  }

  /**
   * 分页查询
   */
  async findAll(query: QueryMemberLevelDto) {
    const { page = 1, pageSize = 10, name, code, status } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      deleted: false,
      ...(name && { name: { contains: name } }),
      ...(code && { code: { contains: code } }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.memberLevelRule.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { level: 'asc' },
      }),
      this.prisma.memberLevelRule.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取所有启用的会员等级（用于下拉选择）
   */
  async findOptions() {
    return this.prisma.memberLevelRule.findMany({
      where: { deleted: false, status: 'ENABLED' },
      orderBy: { level: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        level: true,
      },
    });
  }

  /**
   * 获取详情
   */
  async findOne(id: number) {
    const record = await this.prisma.memberLevelRule.findFirst({
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
  async update(id: number, dto: UpdateMemberLevelDto, userId: number) {
    const record = await this.findOne(id);

    // 启用状态不允许编辑
    if (record.status === 'ENABLED') {
      throw new ConflictException('启用状态的会员等级不允许编辑，请先禁用');
    }

    // 检查编码是否已被其他记录使用
    if (dto.code) {
      const existingByCode = await this.prisma.memberLevelRule.findFirst({
        where: { code: dto.code, deleted: false, id: { not: id } },
      });
      if (existingByCode) {
        throw new ConflictException('等级编码已存在');
      }
    }

    // 检查等级序号是否已被其他记录使用
    if (dto.level) {
      const existingByLevel = await this.prisma.memberLevelRule.findFirst({
        where: { level: dto.level, deleted: false, id: { not: id } },
      });
      if (existingByLevel) {
        throw new ConflictException('等级序号已存在');
      }
    }

    return this.prisma.memberLevelRule.update({
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
    const record = await this.findOne(id);

    // 启用状态不允许删除
    if (record.status === 'ENABLED') {
      throw new ConflictException('启用状态的会员等级不允许删除，请先禁用');
    }

    // 检查是否有会员使用该等级
    const memberCount = await this.prisma.member.count({
      where: { memberLevelId: id, deleted: false },
    });
    if (memberCount > 0) {
      throw new ConflictException(`该等级下有 ${memberCount} 个会员，无法删除`);
    }

    return this.prisma.memberLevelRule.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });
  }
}
