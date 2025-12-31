import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateProductSkuDto } from './dto/create-product-sku.dto';
import { UpdateProductSkuDto } from './dto/update-product-sku.dto';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '@/common/dto';

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
   * 获取SKU列表（带分页）
   */
  async findAll(params: {
    productId?: number;
    page?: number;
    pageSize?: number;
    keyword?: string;
    lowStock?: boolean;
  }) {
    const {
      productId,
      page = 1,
      pageSize = 20,
      keyword,
      lowStock = false,
    } = params;

    const where: Prisma.ProductSKUWhereInput = {
      deleted: false,
      // 过滤已删除商品的SKU
      product: {
        deleted: false,
      },
      ...(productId && { productId }),
      ...(keyword && {
        OR: [
          { skuCode: { contains: keyword } },
          { product: { name: { contains: keyword } } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.productSKU.count({ where }),
      this.prisma.productSKU.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              code: true,
              mainImage: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 过滤低库存数据
    const filteredData = lowStock
      ? data.filter(item => item.stock < (item as any).lowStockAlert)
      : data;

    const totalCount = lowStock ? filteredData.length : total;
    return new PaginatedResult(filteredData, totalCount, page, pageSize);
  }

  /**
   * 获取单个SKU
   */
  async findOne(id: number) {
    return this.prisma.productSKU.findFirst({
      where: { id, deleted: false },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            mainImage: true,
            status: true,
          },
        },
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
   * 删除SKU（软删除）
   */
  async remove(id: number) {
    return this.prisma.productSKU.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * 批量删除SKU（软删除）
   */
  async bulkRemove(ids: number[]) {
    return this.prisma.productSKU.updateMany({
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

  /**
   * 更新库存
   */
  async updateStock(
    skuId: number,
    quantity: number,
    type: 'in' | 'out' | 'order' | 'refund' | 'manual',
    orderId?: string,
    remark?: string,
    createdBy?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 获取当前库存
      const sku = await tx.productSKU.findUnique({
        where: { id: skuId },
        select: { stock: true },
      });

      if (!sku) {
        throw new Error('SKU不存在');
      }

      const beforeStock = sku.stock;
      const afterStock = beforeStock + quantity;

      if (afterStock < 0) {
        throw new Error('库存不足');
      }

      // 更新库存
      await tx.productSKU.update({
        where: { id: skuId },
        data: { stock: afterStock },
      });

      // 记录库存日志
      await (tx as any).productStockLog.create({
        data: {
          skuId,
          type,
          quantity,
          beforeStock,
          afterStock,
          orderId,
          remark,
          createdBy,
        },
      });

      return { beforeStock, afterStock };
    });
  }

  /**
   * 获取低库存SKU列表
   */
  async getLowStockSkus() {
    const allSkus = await this.prisma.productSKU.findMany({
      where: {
        deleted: false,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        stock: 'asc',
      },
    });

    // 过滤出低库存的SKU
    return allSkus.filter(item => item.stock < (item as any).lowStockAlert);
  }

  /**
   * 获取库存日志
   */
  async getStockLogs(skuId: number, page: number = 1, pageSize: number = 20) {
    const [total, data] = await Promise.all([
      (this.prisma as any).productStockLog.count({
        where: { skuId },
      }),
      (this.prisma as any).productStockLog.findMany({
        where: { skuId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }
}
