import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateMemberInvoiceDto } from './dto/create-member-invoice.dto';
import { UpdateMemberInvoiceDto } from './dto/update-member-invoice.dto';
import { QueryMemberInvoiceDto } from './dto/query-member-invoice.dto';

@Injectable()
export class MemberInvoiceService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建发票信息
   */
  async create(dto: CreateMemberInvoiceDto, userId: number) {
    // 如果设置为默认，先取消该会员其他默认发票信息
    if (dto.isDefault) {
      await this.prisma.memberInvoiceInfo.updateMany({
        where: { memberId: dto.memberId, deleted: false },
        data: { isDefault: false },
      });
    }

    return this.prisma.memberInvoiceInfo.create({
      data: {
        ...dto,
        createdBy: String(userId),
      },
    });
  }

  /**
   * 分页查询
   */
  async findAll(query: QueryMemberInvoiceDto) {
    const {
      page = 1,
      pageSize = 10,
      memberId,
      invoiceTitle,
      invoiceTaxNo,
      invoiceType,
      invoiceTitleType,
    } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      deleted: false,
      ...(memberId && { memberId }),
      ...(invoiceTitle && { invoiceTitle: { contains: invoiceTitle } }),
      ...(invoiceTaxNo && { invoiceTaxNo: { contains: invoiceTaxNo } }),
      ...(invoiceType && { invoiceType }),
      ...(invoiceTitleType && { invoiceTitleType }),
    };

    const [data, total] = await Promise.all([
      this.prisma.memberInvoiceInfo.findMany({
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
      this.prisma.memberInvoiceInfo.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取会员的所有发票信息
   */
  async findByMemberId(memberId: number) {
    return this.prisma.memberInvoiceInfo.findMany({
      where: { memberId, deleted: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * 获取详情
   */
  async findOne(id: number) {
    const record = await this.prisma.memberInvoiceInfo.findFirst({
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
      throw new NotFoundException('发票信息不存在');
    }
    return record;
  }

  /**
   * 更新
   */
  async update(id: number, dto: UpdateMemberInvoiceDto, userId: number) {
    const record = await this.findOne(id);

    // 如果设置为默认，先取消该会员其他默认发票信息
    if (dto.isDefault) {
      await this.prisma.memberInvoiceInfo.updateMany({
        where: {
          memberId: record.memberId,
          id: { not: id },
          deleted: false,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.memberInvoiceInfo.update({
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

    return this.prisma.memberInvoiceInfo.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 设置默认发票信息
   */
  async setDefault(id: number, userId: number) {
    const record = await this.findOne(id);

    // 取消该会员其他默认发票信息
    await this.prisma.memberInvoiceInfo.updateMany({
      where: {
        memberId: record.memberId,
        id: { not: id },
        deleted: false,
      },
      data: { isDefault: false },
    });

    // 设置当前为默认
    return this.prisma.memberInvoiceInfo.update({
      where: { id },
      data: {
        isDefault: true,
        updatedBy: String(userId),
      },
    });
  }
}
