import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreatePromotionProductDto } from './dto/create-promotion-product.dto';
import { UpdatePromotionProductDto } from './dto/update-promotion-product.dto';
import { QueryPromotionProductDto } from './dto/query-promotion-product.dto';

@Injectable()
export class PromotionProductService {
  constructor(private prisma: PrismaService) {}

  /**
   * 添加促销商品
   */
  async create(dto: CreatePromotionProductDto, userId: number) {
    // 检查促销活动是否存在
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: dto.promotionId, deleted: false },
    });
    if (!promotion) {
      throw new NotFoundException('促销活动不存在');
    }

    // 检查活动状态
    if (promotion.status === 'ENDED') {
      throw new BadRequestException('已结束的活动不能添加商品');
    }

    // 检查商品是否已添加
    const existing = await this.prisma.promotionProduct.findFirst({
      where: {
        promotionId: dto.promotionId,
        productId: dto.productId,
        skuId: dto.skuId ?? null,
        deleted: false,
      },
    });
    if (existing) {
      throw new ConflictException('该商品已添加到此活动');
    }

    // 验证活动价不能高于原价
    if (dto.activityPrice >= dto.originalPrice) {
      throw new BadRequestException('活动价必须低于原价');
    }

    return this.prisma.promotionProduct.create({
      data: {
        promotionId: dto.promotionId,
        productId: dto.productId,
        skuId: dto.skuId,
        originalPrice: dto.originalPrice,
        activityPrice: dto.activityPrice,
        activityStock: dto.activityStock,
        limitCount: dto.limitCount ?? 0,
        sort: dto.sort ?? 0,
        status: dto.status ?? 'ENABLED',
        createdBy: String(userId),
      },
    });
  }

  /**
   * 批量添加促销商品
   */
  async batchCreate(promotionId: number, products: Omit<CreatePromotionProductDto, 'promotionId'>[], userId: number) {
    // 检查促销活动是否存在
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: promotionId, deleted: false },
    });
    if (!promotion) {
      throw new NotFoundException('促销活动不存在');
    }

    const results = [];
    for (const product of products) {
      try {
        const result = await this.create({ ...product, promotionId }, userId);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message, productId: product.productId });
      }
    }

    return results;
  }

  /**
   * 分页查询列表
   */
  async findAll(query: QueryPromotionProductDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { promotionId, productId, status } = query;

    const where = {
      deleted: false,
      ...(promotionId && { promotionId }),
      ...(productId && { productId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.promotionProduct.findMany({
        where,
        include: {
          promotion: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
              status: true,
            },
          },
        },
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.promotionProduct.count({ where }),
    ]);

    // 计算剩余库存和折扣率
    const list = data.map((item) => ({
      ...item,
      remainingStock: item.activityStock - item.soldCount,
      discountRate: Number(item.originalPrice) > 0
        ? Math.round((Number(item.activityPrice) / Number(item.originalPrice)) * 100) / 10
        : 0,
    }));

    return {
      data: list,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取详情
   */
  async findOne(id: number) {
    const record = await this.prisma.promotionProduct.findFirst({
      where: { id, deleted: false },
      include: {
        promotion: true,
      },
    });
    if (!record) {
      throw new NotFoundException('促销商品不存在');
    }
    return {
      ...record,
      remainingStock: record.activityStock - record.soldCount,
    };
  }

  /**
   * 更新
   */
  async update(id: number, dto: UpdatePromotionProductDto, userId: number) {
    const record = await this.findOne(id);

    // 检查活动状态
    if (record.promotion.status === 'ENDED') {
      throw new BadRequestException('已结束的活动商品不能修改');
    }

    // 验证活动价
    if (dto.activityPrice !== undefined && dto.originalPrice !== undefined) {
      if (dto.activityPrice >= dto.originalPrice) {
        throw new BadRequestException('活动价必须低于原价');
      }
    } else if (dto.activityPrice !== undefined) {
      if (dto.activityPrice >= Number(record.originalPrice)) {
        throw new BadRequestException('活动价必须低于原价');
      }
    }

    return this.prisma.promotionProduct.update({
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
    const record = await this.findOne(id);

    // 进行中的活动已售出的商品不能删除
    if (record.promotion.status === 'RUNNING' && record.soldCount > 0) {
      throw new BadRequestException('进行中活动的已售商品不能删除');
    }

    return this.prisma.promotionProduct.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 切换状态
   */
  async toggleStatus(id: number, userId: number) {
    const record = await this.findOne(id);

    const newStatus = record.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';

    return this.prisma.promotionProduct.update({
      where: { id },
      data: {
        status: newStatus,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 获取活动的商品统计
   */
  async getPromotionStats(promotionId: number) {
    const products = await this.prisma.promotionProduct.findMany({
      where: { promotionId, deleted: false },
    });

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.activityStock, 0);
    const totalSold = products.reduce((sum, p) => sum + p.soldCount, 0);
    const enabledProducts = products.filter((p) => p.status === 'ENABLED').length;

    return {
      totalProducts,
      enabledProducts,
      totalStock,
      totalSold,
      remainingStock: totalStock - totalSold,
      soldRate: totalStock > 0 ? Math.round((totalSold / totalStock) * 100) : 0,
    };
  }
}
