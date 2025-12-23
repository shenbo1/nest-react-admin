import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateProductSpecGroupDto } from './dto/create-product-spec-group.dto';
import { UpdateProductSpecGroupDto } from './dto/update-product-spec-group.dto';

@Injectable()
export class ProductSpecGroupService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建规格组
   */
  async create(createDto: CreateProductSpecGroupDto) {
    return this.prisma.productSpecGroup.create({
      data: createDto,
      include: {
        specValues: true,
      },
    });
  }

  /**
   * 获取所有规格组（带规格值）
   */
  async findAll(productId?: number) {
    const where = productId ? { productId } : {};
    return this.prisma.productSpecGroup.findMany({
      where,
      include: {
        specValues: {
          orderBy: {
            sort: 'asc',
          },
        },
      },
      orderBy: {
        sort: 'asc',
      },
    });
  }

  /**
   * 获取单个规格组（带规格值）
   */
  async findOne(id: number) {
    return this.prisma.productSpecGroup.findUnique({
      where: { id },
      include: {
        specValues: true,
      },
    });
  }

  /**
   * 更新规格组
   */
  async update(id: number, updateDto: UpdateProductSpecGroupDto) {
    return this.prisma.productSpecGroup.update({
      where: { id },
      data: updateDto,
      include: {
        specValues: true,
      },
    });
  }

  /**
   * 删除规格组
   */
  async remove(id: number) {
    return this.prisma.productSpecGroup.delete({
      where: { id },
    });
  }
}
