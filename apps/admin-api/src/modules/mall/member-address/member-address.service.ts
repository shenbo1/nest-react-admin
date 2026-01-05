import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateMemberAddressDto } from './dto/create-member-address.dto';
import { UpdateMemberAddressDto } from './dto/update-member-address.dto';
import { QueryMemberAddressDto } from './dto/query-member-address.dto';

@Injectable()
export class MemberAddressService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建收货地址
   */
  async create(dto: CreateMemberAddressDto, userId: number) {
    // 如果设置为默认地址，先取消该会员其他默认地址
    if (dto.isDefault) {
      await this.prisma.memberAddress.updateMany({
        where: { memberId: dto.memberId, deleted: false },
        data: { isDefault: false },
      });
    }

    return this.prisma.memberAddress.create({
      data: {
        ...dto,
        createdBy: String(userId),
      },
    });
  }

  /**
   * 分页查询
   */
  async findAll(query: QueryMemberAddressDto) {
    const { page = 1, pageSize = 10, memberId, receiver, phone } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      deleted: false,
      ...(memberId && { memberId }),
      ...(receiver && { receiver: { contains: receiver } }),
      ...(phone && { phone: { contains: phone } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.memberAddress.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        include: {
          member: {
            select: {
              id: true,
              username: true,
              nickname: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.memberAddress.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取会员的所有收货地址
   */
  async findByMemberId(memberId: number) {
    return this.prisma.memberAddress.findMany({
      where: { memberId, deleted: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * 获取详情
   */
  async findOne(id: number) {
    const record = await this.prisma.memberAddress.findFirst({
      where: { id, deleted: false },
      include: {
        member: {
          select: {
            id: true,
            username: true,
            nickname: true,
          },
        },
      },
    });
    if (!record) {
      throw new NotFoundException('收货地址不存在');
    }
    return record;
  }

  /**
   * 更新
   */
  async update(id: number, dto: UpdateMemberAddressDto, userId: number) {
    const record = await this.findOne(id);

    // 如果设置为默认地址，先取消该会员其他默认地址
    if (dto.isDefault) {
      await this.prisma.memberAddress.updateMany({
        where: {
          memberId: record.memberId,
          id: { not: id },
          deleted: false,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.memberAddress.update({
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

    return this.prisma.memberAddress.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 设置默认地址
   */
  async setDefault(id: number, userId: number) {
    const record = await this.findOne(id);

    // 取消该会员其他默认地址
    await this.prisma.memberAddress.updateMany({
      where: {
        memberId: record.memberId,
        id: { not: id },
        deleted: false,
      },
      data: { isDefault: false },
    });

    // 设置当前地址为默认
    return this.prisma.memberAddress.update({
      where: { id },
      data: {
        isDefault: true,
        updatedBy: String(userId),
      },
    });
  }
}
