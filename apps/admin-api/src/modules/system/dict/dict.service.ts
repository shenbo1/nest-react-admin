import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateDictTypeDto, UpdateDictTypeDto, QueryDictTypeDto } from './dto';
import { CreateDictDataDto, UpdateDictDataDto, QueryDictDataDto } from './dto';
import { PaginatedResult } from '@/common/dto';

@Injectable()
export class DictService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== 字典类型 ==========
  async createType(dto: CreateDictTypeDto) {
    const existing = await this.prisma.sysDictType.findFirst({
      where: { type: dto.type, deleted: false },
    });
    if (existing) throw new BadRequestException('字典类型已存在');

    return this.prisma.sysDictType.create({ data: dto });
  }

  async findAllTypes(query: QueryDictTypeDto) {
    const { page = 1, pageSize = 10, name, type, status } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };
    if (name) where.name = { contains: name };
    if (type) where.type = { contains: type };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.sysDictType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysDictType.count({ where }),
    ]);

    return new PaginatedResult(data, total, page, pageSize);
  }

  async findOneType(id: number) {
    const dictType = await this.prisma.sysDictType.findFirst({
      where: { id, deleted: false },
    });
    if (!dictType) throw new NotFoundException('字典类型不存在');
    return dictType;
  }

  async updateType(id: number, dto: UpdateDictTypeDto) {
    const existing = await this.prisma.sysDictType.findFirst({
      where: { id, deleted: false },
    });
    if (!existing) throw new NotFoundException('字典类型不存在');

    return this.prisma.sysDictType.update({
      where: { id },
      data: dto,
    });
  }

  async removeType(id: number) {
    const existing = await this.prisma.sysDictType.findFirst({
      where: { id, deleted: false },
    });
    if (!existing) throw new NotFoundException('字典类型不存在');

    // 检查是否有字典数据
    const dataCount = await this.prisma.sysDictData.count({
      where: { dictType: existing.type, deleted: false },
    });
    if (dataCount > 0) {
      throw new BadRequestException('字典类型下存在数据，不能删除');
    }

    await this.prisma.sysDictType.delete({ where: { id } });
    return { message: '删除成功' };
  }

  // ========== 字典数据 ==========
  async createData(dto: CreateDictDataDto) {
    return this.prisma.sysDictData.create({ data: dto });
  }

  async findAllData(query: QueryDictDataDto) {
    const { page = 1, pageSize = 10, dictType, label, status } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };
    if (dictType) where.dictType = dictType;
    if (label) where.label = { contains: label };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.sysDictData.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sort: 'asc' },
      }),
      this.prisma.sysDictData.count({ where }),
    ]);

    return new PaginatedResult(data, total, page, pageSize);
  }

  async findDataByType(dictType: string) {
    return this.prisma.sysDictData.findMany({
      where: { dictType, deleted: false, status: 'ENABLED' },
      orderBy: { sort: 'asc' },
    });
  }

  async findOneData(id: number) {
    const dictData = await this.prisma.sysDictData.findFirst({
      where: { id, deleted: false },
    });
    if (!dictData) throw new NotFoundException('字典数据不存在');
    return dictData;
  }

  async updateData(id: number, dto: UpdateDictDataDto) {
    const existing = await this.prisma.sysDictData.findFirst({
      where: { id, deleted: false },
    });
    if (!existing) throw new NotFoundException('字典数据不存在');

    return this.prisma.sysDictData.update({
      where: { id },
      data: dto,
    });
  }

  async removeData(id: number) {
    const existing = await this.prisma.sysDictData.findFirst({
      where: { id, deleted: false },
    });
    if (!existing) throw new NotFoundException('字典数据不存在');

    await this.prisma.sysDictData.delete({ where: { id } });
    return { message: '删除成功' };
  }

  // ========== 切换状态 ==========
  async toggleTypeStatus(id: number) {
    const record = await this.findOneType(id);
    const newStatus = record.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    return this.prisma.sysDictType.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async toggleDataStatus(id: number) {
    const record = await this.findOneData(id);
    const newStatus = record.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    return this.prisma.sysDictData.update({
      where: { id },
      data: { status: newStatus },
    });
  }
}
