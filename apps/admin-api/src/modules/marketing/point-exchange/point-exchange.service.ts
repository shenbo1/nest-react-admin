import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QueryPointExchangeDto } from './dto/query-point-exchange.dto';
import { ShipPointExchangeDto } from './dto/ship-point-exchange.dto';

@Injectable()
export class PointExchangeService {
  constructor(private prisma: PrismaService) {}

  /**
   * 分页查询列表
   */
  async findAll(query: QueryPointExchangeDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { exchangeNo, memberId, productName, productType, status } = query;

    const where = {
      deleted: false,
      ...(exchangeNo && { exchangeNo: { contains: exchangeNo } }),
      ...(memberId && { memberId }),
      ...(productName && { productName: { contains: productName } }),
      ...(productType && { productType }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.pointExchangeRecord.findMany({
        where,
        include: {
          pointProduct: {
            select: {
              id: true,
              name: true,
              code: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.pointExchangeRecord.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取详情
   */
  async findOne(id: number) {
    const record = await this.prisma.pointExchangeRecord.findFirst({
      where: { id, deleted: false },
      include: {
        pointProduct: {
          select: {
            id: true,
            name: true,
            code: true,
            image: true,
            points: true,
            price: true,
          },
        },
      },
    });
    if (!record) {
      throw new NotFoundException('兑换记录不存在');
    }
    return record;
  }

  /**
   * 发货（实物商品）
   */
  async ship(id: number, dto: ShipPointExchangeDto, userId: number) {
    const record = await this.findOne(id);

    if (record.productType !== 'PHYSICAL') {
      throw new BadRequestException('只有实物商品才能发货');
    }

    if (record.status !== 'PENDING') {
      throw new BadRequestException('只有待发货状态的订单才能发货');
    }

    return this.prisma.pointExchangeRecord.update({
      where: { id },
      data: {
        status: 'SHIPPED',
        shippingInfo: {
          expressCompany: dto.expressCompany,
          expressNo: dto.expressNo,
          shippedAt: new Date().toISOString(),
        },
        remark: dto.remark,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 完成兑换
   */
  async complete(id: number, userId: number) {
    const record = await this.findOne(id);

    if (record.status === 'COMPLETED') {
      throw new BadRequestException('该订单已完成');
    }

    if (record.status === 'CANCELLED') {
      throw new BadRequestException('已取消的订单无法完成');
    }

    // 实物商品需要先发货
    if (record.productType === 'PHYSICAL' && record.status !== 'SHIPPED') {
      throw new BadRequestException('实物商品需要先发货才能完成');
    }

    return this.prisma.pointExchangeRecord.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 取消兑换
   */
  async cancel(id: number, userId: number) {
    const record = await this.findOne(id);

    if (record.status === 'COMPLETED') {
      throw new BadRequestException('已完成的订单无法取消');
    }

    if (record.status === 'CANCELLED') {
      throw new BadRequestException('该订单已取消');
    }

    // 使用事务：取消订单并退还积分
    return this.prisma.$transaction(async (prisma) => {
      // 更新订单状态
      const updatedRecord = await prisma.pointExchangeRecord.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedBy: String(userId),
        },
      });

      // 退还积分商品库存
      await prisma.pointProduct.update({
        where: { id: record.pointProductId },
        data: {
          exchangedCount: { decrement: record.quantity },
        },
      });

      // TODO: 退还会员积分（需要调用会员积分服务）
      // await memberPointService.addPoints(record.memberId, record.points, 'REFUND');

      return updatedRecord;
    });
  }

  /**
   * 统计数据
   */
  async getStats() {
    const [pending, shipped, completed, cancelled] = await Promise.all([
      this.prisma.pointExchangeRecord.count({
        where: { deleted: false, status: 'PENDING' },
      }),
      this.prisma.pointExchangeRecord.count({
        where: { deleted: false, status: 'SHIPPED' },
      }),
      this.prisma.pointExchangeRecord.count({
        where: { deleted: false, status: 'COMPLETED' },
      }),
      this.prisma.pointExchangeRecord.count({
        where: { deleted: false, status: 'CANCELLED' },
      }),
    ]);

    return {
      pending,
      shipped,
      completed,
      cancelled,
      total: pending + shipped + completed + cancelled,
    };
  }
}
