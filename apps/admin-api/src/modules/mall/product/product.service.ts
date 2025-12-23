import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
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
    // 处理图片和规格数据
    const data: any = {
      ...dto,
      mainImages: dto.images ? JSON.stringify(dto.images) : null,
      specs: dto.specs ? JSON.stringify(dto.specs) : null,
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    // 处理JSON字段
    const processedList = list.map(item => ({
      ...item,
      mainImages: item.mainImages ? JSON.parse(item.mainImages as any) : [],
      specs: item.specs ? JSON.parse(item.specs as any) : null,
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
          orderBy: { createdAt: 'asc' },
        },
        /// 关联的规格组
        specGroups: {
          include: {
            specValues: {
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

    // 处理 JSON 字段
    return {
      ...record,
      mainImages: record.mainImages ? JSON.parse(record.mainImages as any) : [],
      specs: record.specs ? JSON.parse(record.specs as any) : null,
      /// 处理 SKU 中的 JSON 字段
      skus: record.skus.map(sku => ({
        ...sku,
        specCombination: sku.specCombination ? JSON.parse(sku.specCombination as any) : {},
        images: sku.images ? JSON.parse(sku.images as any) : [],
      })),
    };
  }

  /**
   * 更新商品
   */
  async update(id: number, dto: UpdateProductDto, userId: number) {
    await this.findOne(id);

    // 处理图片和规格数据
    const data: any = {
      ...dto,
      ...(dto.images && { mainImages: JSON.stringify(dto.images) }),
      ...(dto.specs && { specs: JSON.stringify(dto.specs) }),
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
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: String(userId),
      },
    });
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
}
