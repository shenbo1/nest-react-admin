import { Injectable, BadRequestException } from '@nestjs/common';
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
    const where = {
      deleted: false,
      ...(specGroupId && { specGroupId }),
      specGroup: {
        deleted: false,
      },
    };
    return this.prisma.productSpecValue.findMany({
      where,
      include: {
        specGroup: {
          select: {
            id: true,
            name: true,
            productId: true,
          },
        },
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
    return this.prisma.productSpecValue.findFirst({
      where: {
        id,
        deleted: false,
        specGroup: {
          deleted: false,
        },
      },
      include: {
        specGroup: {
          select: {
            id: true,
            name: true,
            productId: true,
          },
        },
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
   * 删除规格值（软删除）
   */
  async remove(id: number) {
    // 1. 获取规格值信息（包含规格组信息）
    const specValue = await this.prisma.productSpecValue.findFirst({
      where: { id, deleted: false },
      include: {
        specGroup: true,
      },
    });

    if (!specValue) {
      throw new BadRequestException('规格值不存在');
    }

    // 2. 获取该商品的所有 SKU（未删除的）
    const skusUsingValue = await this.prisma.productSKU.findMany({
      where: {
        productId: specValue.specGroup.productId,
        deleted: false,
      },
    });

    // 3. 检查 SKU 的 specCombination 中是否使用了该规格值
    const groupName = specValue.specGroup.name;
    const valueName = specValue.name;
    const skuUsingThisValue = skusUsingValue.find((sku) => {
      const specCombination = sku.specCombination as Record<string, string>;
      return (
        specCombination &&
        specCombination[groupName] === valueName
      );
    });

    if (skuUsingThisValue) {
      throw new BadRequestException(
        `无法删除规格值「${groupName}: ${valueName}」，已有 SKU 使用该规格值。请先删除相关 SKU 后再操作。`,
      );
    }

    // 4. 软删除规格值
    return this.prisma.productSpecValue.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * 批量删除规格值（软删除）
   */
  async bulkRemove(ids: number[]) {
    return this.prisma.productSpecValue.updateMany({
      where: {
        id: { in: ids },
        deleted: false,
      },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
