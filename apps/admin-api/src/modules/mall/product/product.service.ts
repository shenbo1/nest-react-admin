import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建商品
   */
  async create(dto: CreateProductDto, userId: number) {
    // Prisma 自动处理 Json 类型，无需手动 stringify
    const data: any = {
      ...dto,
      createdBy: String(userId),
    };

    return this.prisma.product.create({
      data,
    });
  }

  /**
   * 分页查询商品列表
   */
  async findAll(query: QueryProductDto) {
    const { page = 1, pageSize = 10, name, status, categoryId, code } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      deleted: false,
      ...(name && { name: { contains: name } }),
      ...(code && { code: { contains: code } }),
      ...(status !== undefined && { status }),
      ...(categoryId && { categoryId }),
    };

    const [list, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          /// 关联的规格组（包含规格值）
          specGroups: {
            where: { deleted: false },
            include: {
              specValues: {
                where: { deleted: false },
                orderBy: { sort: 'asc' },
              },
            },
            orderBy: { sort: 'asc' },
          },
          /// 关联的 SKU 列表
          skus: {
            where: { deleted: false },
            select: {
              id: true,
              skuCode: true,
              specCombination: true,
              price: true,
              costPrice: true,
              stock: true,
              sales: true,
              weight: true,
              images: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    // 处理JSON字段 - Prisma自动处理Json类型，无需手动解析
    const processedList = list.map(item => ({
      ...item,
      mainImage: item.mainImage || null,
      images: item.images || [],
      specs: item.specs || null,
    }));

    return {
      data: processedList,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取商品详情
   */
  async findOne(id: number) {
    const record = await this.prisma.product.findFirst({
      where: { id, deleted: false },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        /// 关联的 SKU 列表
        skus: {
          where: { deleted: false },
          orderBy: { createdAt: 'asc' },
        },
        /// 关联的规格组
        specGroups: {
          where: { deleted: false },
          include: {
            specValues: {
              where: { deleted: false },
              orderBy: { sort: 'asc' },
            },
          },
          orderBy: { sort: 'asc' },
        },
      },
    });
    if (!record) {
      throw new NotFoundException('商品不存在');
    }

    // 处理 JSON 字段 - Prisma自动处理Json类型，无需手动解析
    return {
      ...record,
      mainImage: record.mainImage || null,
      images: record.images || [],
      specs: record.specs || null,
      /// 处理 SKU 中的 JSON 字段
      skus: record.skus.map(sku => ({
        ...sku,
        specCombination: sku.specCombination || {},
        images: sku.images || [],
      })),
    };
  }

  /**
   * 更新商品
   */
  async update(id: number, dto: UpdateProductDto, userId: number) {
    const product = await this.findOne(id);

    // 上架商品只允许修改状态（下架操作）
    if (product.status === 'ON_SHELF') {
      // 如果只是修改状态，允许操作（用于下架）
      const isStatusChangeOnly = Object.keys(dto).length === 1 && dto.status !== undefined;
      if (!isStatusChangeOnly) {
        throw new BadRequestException('上架中的商品不能编辑，请先下架');
      }
    }

    // Prisma 自动处理 Json 类型，无需手动 stringify
    const data: any = {
      ...dto,
      updatedBy: String(userId),
    };

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除商品（软删除）
   */
  async remove(id: number, userId: number) {
    const product = await this.findOne(id);

    // 上架商品不能删除
    if (product.status === 'ON_SHELF') {
      throw new BadRequestException('上架中的商品不能删除，请先下架');
    }

    // 软删除商品及其关联的规格组、规格值、SKU
    const now = new Date();
    await this.prisma.$transaction([
      // 软删除 SKU
      this.prisma.productSKU.updateMany({
        where: { productId: id, deleted: false },
        data: { deleted: true, deletedAt: now },
      }),
      // 软删除规格值
      this.prisma.productSpecValue.updateMany({
        where: {
          specGroup: { productId: id },
          deleted: false,
        },
        data: { deleted: true, deletedAt: now },
      }),
      // 软删除规格组
      this.prisma.productSpecGroup.updateMany({
        where: { productId: id, deleted: false },
        data: { deleted: true, deletedAt: now },
      }),
      // 软删除商品
      this.prisma.product.update({
        where: { id },
        data: {
          deleted: true,
          deletedAt: now,
          updatedBy: String(userId),
        },
      }),
    ]);

    return { success: true };
  }

  /**
   * 更新库存
   */
  async updateStock(id: number, stock: number, userId: number) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        defaultStock: stock,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 增加销量
   */
  async increaseSales(id: number, quantity: number) {
    return this.prisma.product.update({
      where: { id },
      data: {
        sales: {
          increment: quantity,
        },
      },
    });
  }

  /**
   * 切换商品状态
   */
  async toggleStatus(id: number, userId: number) {
    const product = await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        status: product.status === 'ON_SHELF' ? 'OFF_SHELF' : 'ON_SHELF',
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 批量切换商品状态
   */
  async batchToggleStatus(ids: number[], userId: number) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, deleted: false },
      select: { id: true, status: true },
    });

    const updates = products.map((product) =>
      this.prisma.product.update({
        where: { id: product.id },
        data: {
          status: product.status === 'ON_SHELF' ? 'OFF_SHELF' : 'ON_SHELF',
          updatedBy: String(userId),
        },
      }),
    );

    return Promise.all(updates);
  }

  /**
   * 复制商品
   */
  async duplicate(id: number, userId: number) {
    const original = await this.findOne(id);

    // 生成新的编码
    const newCode = `${original.code || 'PRODUCT'}-COPY-${Date.now()}`;

    // 构建新商品数据
    const newProduct = await this.prisma.product.create({
      data: {
        name: `${original.name} (副本)`,
        code: newCode,
        categoryId: original.categoryId,
        content: original.content,
        mainImage: original.mainImage,
        images: original.images || Prisma.DbNull,
        originalPrice: original.originalPrice,
        defaultPrice: original.defaultPrice,
        defaultStock: original.defaultStock,
        sales: 0,
        unit: original.unit,
        defaultWeight: original.defaultWeight,
        specs: original.specs || Prisma.DbNull,
        sort: original.sort,
        status: 'DRAFT', // 副本默认是草稿状态
        remark: original.remark,
        createdBy: String(userId),
        updatedBy: String(userId),
      } as any,
    });

    // 复制规格组和规格值
    if (original.specGroups && original.specGroups.length > 0) {
      for (const group of original.specGroups) {
        const newGroup = await this.prisma.productSpecGroup.create({
          data: {
            productId: newProduct.id,
            name: group.name,
            sort: group.sort,
          },
        });

        // 复制规格值
        if (group.specValues && group.specValues.length > 0) {
          await this.prisma.productSpecValue.createMany({
            data: group.specValues.map((value) => ({
              specGroupId: newGroup.id,
              name: value.name,
              sort: value.sort,
            })),
          });
        }
      }
    }

    // 复制 SKU（需要先获取新的规格组信息）
    if (original.skus && original.skus.length > 0) {
      // 获取新创建的规格组
      const newSpecGroups = await this.prisma.productSpecGroup.findMany({
        where: { productId: newProduct.id },
        include: { specValues: true },
      });

      // 创建规格组名称到新规格值的映射
      const specValueMap: Record<string, Record<string, number>> = {};
      for (const group of newSpecGroups) {
        specValueMap[group.name] = {};
        for (const value of group.specValues || []) {
          specValueMap[group.name][value.name] = value.id;
        }
      }

      // 使用 createMany 批量创建 SKU，性能更好
      // Prisma 自动处理 Json 类型，无需手动 stringify
      const skuData = original.skus.map((sku, index) => {
        // 构建新的规格组合
        let newSpecCombination: Record<string, string> = {};
        if (sku.specCombination) {
          for (const [key, value] of Object.entries(sku.specCombination)) {
            // 使用规格值名称作为 key（SKU表中存储的是名称）
            newSpecCombination[key] = value as string;
          }
        }

        return {
          productId: newProduct.id,
          skuCode: `${newCode}-SKU-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
          specCombination: newSpecCombination,
          price: sku.price,
          stock: sku.stock,
          sales: 0,
          weight: sku.weight,
          images: sku.images || Prisma.DbNull,
          lowStockAlert: sku.lowStockAlert || 10, // 使用原有的低库存预警值
          costPrice: sku.costPrice, // 复制成本价
        };
      });

      // 批量创建 SKU
      await this.prisma.productSKU.createMany({
        data: skuData,
      });
    }

    return newProduct;
  }
}
