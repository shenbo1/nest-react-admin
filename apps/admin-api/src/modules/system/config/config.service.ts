import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { PaginatedResult } from '@/common/dto';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createConfigDto: CreateConfigDto) {
    const existing = await this.prisma.sysConfig.findFirst({
      where: { key: createConfigDto.key, deleted: false },
    });

    if (existing) {
      throw new BadRequestException('配置键名已存在');
    }

    const config = await this.prisma.sysConfig.create({
      data: createConfigDto,
    });

    return config;
  }

  async findAll(query: QueryConfigDto) {
    const { page = 1, pageSize = 10, name, key, configType } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };

    if (name) {
      where.name = { contains: name };
    }
    if (key) {
      where.key = { contains: key };
    }
    if (configType) {
      where.configType = configType;
    }

    const [data, total] = await Promise.all([
      this.prisma.sysConfig.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sysConfig.count({ where }),
    ]);

    return new PaginatedResult(data, total, page, pageSize);
  }

  async findOne(id: number) {
    const config = await this.prisma.sysConfig.findFirst({
      where: { id, deleted: false },
    });

    if (!config) {
      throw new NotFoundException('配置不存在');
    }

    return config;
  }

  async update(id: number, updateConfigDto: UpdateConfigDto) {
    const existing = await this.prisma.sysConfig.findFirst({
      where: { id, deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('配置不存在');
    }

    // 检查键名是否已存在（排除当前记录）
    if (updateConfigDto.key !== existing.key) {
      const keyExists = await this.prisma.sysConfig.findFirst({
        where: { key: updateConfigDto.key, deleted: false },
      });
      if (keyExists) {
        throw new BadRequestException('配置键名已存在');
      }
    }

    const config = await this.prisma.sysConfig.update({
      where: { id },
      data: updateConfigDto,
    });

    return config;
  }

  async remove(id: number) {
    const existing = await this.prisma.sysConfig.findFirst({
      where: { id, deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('配置不存在');
    }

    await this.prisma.sysConfig.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });

    return { message: '删除成功' };
  }
}
