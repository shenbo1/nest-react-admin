import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateProductSkuDto } from './dto/create-product-sku.dto';
import { UpdateProductSkuDto } from './dto/update-product-sku.dto';

@Injectable()
export class ProductSkuService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建SKU
   */
  async create(createDto: CreateProductSkuDto) {
    return this.prisma.productSKU.create({
      data: createDto,
    });
  }

  /**
   * 批量创建SKU
   */
  async bulkCreate(createDtos: CreateProductSkuDto[]) {
    return this.prisma.productSKU.createMany({
      data: createDtos,
    });
  }

  /**
   * 获取SKU列表
   */
  async findAll(productId?: number) {
    const where = productId ? { productId } : {};
    return this.prisma.productSKU.findMany({
      where,
      include: {
        product: true,
      },
    });
  }

  /**
   * 获取单个SKU
   */
  async findOne(id: number) {
    return this.prisma.productSKU.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });
  }

  /**
   * 更新SKU
   */
  async update(id: number, updateDto: UpdateProductSkuDto) {
    return this.prisma.productSKU.update({
      where: { id },
      data: updateDto,
    });
  }

  /**
   * 删除SKU
   */
  async remove(id: number) {
    return this.prisma.productSKU.delete({
      where: { id },
    });
  }

  /**
   * 批量删除SKU
   */
  async bulkRemove(ids: number[]) {
    return this.prisma.productSKU.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }
}
