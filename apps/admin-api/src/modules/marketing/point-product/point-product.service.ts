import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreatePointProductDto } from './dto/create-point-product.dto';
import { UpdatePointProductDto } from './dto/update-point-product.dto';
import { QueryPointProductDto } from './dto/query-point-product.dto';

@Injectable()
export class PointProductService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建积分商品
   */
  async create(dto: CreatePointProductDto, userId: number) {
    // 检查编码唯一性
    const existing = await this.prisma.pointProduct.findFirst({
      where: { code: dto.code, deleted: false },
    });
    if (existing) {
      throw new ConflictException(`商品编码 ${dto.code} 已存在`);
    }

    // 根据商品类型验证必填字段
    this.validateProductType(dto);

    return this.prisma.pointProduct.create({
      data: {
        name: dto.name,
        code: dto.code,
        image: dto.image,
        sort: dto.sort ?? 0,
        points: dto.points,
        price: dto.price,
        stock: dto.stock,
        limitCount: dto.limitCount ?? 0,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        productType: dto.productType,
        relatedProductId: dto.relatedProductId,
        relatedCouponId: dto.relatedCouponId,
        virtualContent: dto.virtualContent,
        status: dto.status ?? 'ENABLED',
        description: dto.description,
        createdBy: String(userId),
      },
    });
  }

  /**
   * 分页查询列表
   */
  async findAll(query: QueryPointProductDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { name, productType, status } = query;

    const where = {
      deleted: false,
      ...(name && { name: { contains: name } }),
      ...(productType && { productType }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.pointProduct.findMany({
        where,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.pointProduct.count({ where }),
    ]);

    // 计算剩余库存
    const list = data.map((item) => ({
      ...item,
      remainingStock: item.stock - item.exchangedCount,
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
    const record = await this.prisma.pointProduct.findFirst({
      where: { id, deleted: false },
    });
    if (!record) {
      throw new NotFoundException('积分商品不存在');
    }
    return {
      ...record,
      remainingStock: record.stock - record.exchangedCount,
    };
  }

  /**
   * 更新
   */
  async update(id: number, dto: UpdatePointProductDto, userId: number) {
    await this.findOne(id);

    // 检查编码唯一性
    if (dto.code) {
      const existing = await this.prisma.pointProduct.findFirst({
        where: { code: dto.code, deleted: false, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`商品编码 ${dto.code} 已存在`);
      }
    }

    // 如果更新了商品类型，需要验证必填字段
    if (dto.productType) {
      this.validateProductType(dto as CreatePointProductDto);
    }

    return this.prisma.pointProduct.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 删除（软删除）
   */
  async remove(id: number, userId: number) {
    const record = await this.findOne(id);

    // 检查是否有已兑换记录
    if (record.exchangedCount > 0) {
      throw new ConflictException('该商品已有兑换记录，无法删除');
    }

    return this.prisma.pointProduct.update({
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

    return this.prisma.pointProduct.update({
      where: { id },
      data: {
        status: newStatus,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 下架商品
   */
  async offline(id: number, userId: number) {
    await this.findOne(id);

    return this.prisma.pointProduct.update({
      where: { id },
      data: {
        status: 'DISABLED',
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 验证商品类型对应的必填字段
   */
  private validateProductType(dto: CreatePointProductDto) {
    switch (dto.productType) {
      case 'PHYSICAL':
        // 实物商品暂不强制关联商品ID（可能只是记录）
        break;
      case 'VIRTUAL':
        if (!dto.virtualContent) {
          throw new BadRequestException('虚拟商品必须填写虚拟内容');
        }
        break;
      case 'COUPON':
        if (!dto.relatedCouponId) {
          throw new BadRequestException('优惠券类型必须关联优惠券模板');
        }
        break;
    }
  }
}
