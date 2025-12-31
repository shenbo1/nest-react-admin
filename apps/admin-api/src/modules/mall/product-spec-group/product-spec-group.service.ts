import { Injectable, BadRequestException } from '@nestjs/common';
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
    const where = {
      deleted: false,
      ...(productId && { productId }),
    };
    return this.prisma.productSpecGroup.findMany({
      where,
      include: {
        specValues: {
          where: { deleted: false },
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
    return this.prisma.productSpecGroup.findFirst({
      where: { id, deleted: false },
      include: {
        specValues: {
          where: { deleted: false },
        },
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
   * 删除规格组（软删除）
   */
  async remove(id: number) {
    // 1. 获取规格组信息（包含规格值）
    const specGroup = await this.prisma.productSpecGroup.findFirst({
      where: { id, deleted: false },
      include: {
        specValues: {
          where: { deleted: false },
        },
        product: true,
      },
    });

    if (!specGroup) {
      throw new BadRequestException('规格组不存在');
    }

    // 2. 检查是否有 SKU 使用了该规格组
    const skusUsingGroup = await this.prisma.productSKU.findMany({
      where: {
        productId: specGroup.productId,
        deleted: false,
      },
    });

    // 检查 SKU 的 specCombination 中是否包含该规格组名称
    const groupName = specGroup.name;
    const skuUsingThisGroup = skusUsingGroup.find((sku) => {
      const specCombination = sku.specCombination as Record<string, string>;
      return specCombination && groupName in specCombination;
    });

    if (skuUsingThisGroup) {
      throw new BadRequestException(
        `无法删除规格组「${groupName}」，已有 SKU 使用该规格。请先删除相关 SKU 后再操作。`,
      );
    }

    // 3. 软删除规格组及其规格值
    const now = new Date();
    await this.prisma.$transaction([
      // 软删除规格值
      this.prisma.productSpecValue.updateMany({
        where: { specGroupId: id, deleted: false },
        data: { deleted: true, deletedAt: now },
      }),
      // 软删除规格组
      this.prisma.productSpecGroup.update({
        where: { id },
        data: { deleted: true, deletedAt: now },
      }),
    ]);

    return { success: true };
  }
}
