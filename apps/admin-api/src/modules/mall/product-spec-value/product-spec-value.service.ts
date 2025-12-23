import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateProductSpecValueDto } from './dto/create-product-spec-value.dto';
import { UpdateProductSpecValueDto } from './dto/update-product-spec-value.dto';

@Injectable()
export class ProductSpecValueService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建规格值
   */
  async create(createDto: CreateProductSpecValueDto) {
    return this.prisma.productSpecValue.create({
      data: createDto,
      include: {
        specGroup: true,
      },
    });
  }

  /**
   * 批量创建规格值
   */
  async bulkCreate(createDtos: CreateProductSpecValueDto[]) {
    return this.prisma.productSpecValue.createMany({
      data: createDtos,
    });
  }

  /**
   * 获取规格值列表
   */
  async findAll(specGroupId?: number) {
    const where = specGroupId ? { specGroupId } : {};
    return this.prisma.productSpecValue.findMany({
      where,
      include: {
        specGroup: true,
      },
      orderBy: {
        sort: 'asc',
      },
    });
  }

  /**
   * 获取单个规格值
   */
  async findOne(id: number) {
    return this.prisma.productSpecValue.findUnique({
      where: { id },
      include: {
        specGroup: true,
      },
    });
  }

  /**
   * 更新规格值
   */
  async update(id: number, updateDto: UpdateProductSpecValueDto) {
    return this.prisma.productSpecValue.update({
      where: { id },
      data: updateDto,
      include: {
        specGroup: true,
      },
    });
  }

  /**
   * 删除规格值
   */
  async remove(id: number) {
    return this.prisma.productSpecValue.delete({
      where: { id },
    });
  }

  /**
   * 批量删除规格值
   */
  async bulkRemove(ids: number[]) {
    return this.prisma.productSpecValue.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }
}
