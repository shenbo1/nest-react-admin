import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
import { PaginatedResult } from '@/common/dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existing = await this.prisma.sysRole.findFirst({
      where: { key: createRoleDto.key, deleted: false },
    });
    if (existing) {
      throw new BadRequestException('角色标识已存在');
    }

    const { menuIds, ...roleData } = createRoleDto;

    return this.prisma.sysRole.create({
      data: {
        ...roleData,
        menus: menuIds?.length
          ? { create: menuIds.map((menuId) => ({ menuId })) }
          : undefined,
      },
      include: { menus: { include: { menu: true } } },
    });
  }

  async findAll(query: QueryRoleDto) {
    const { page = 1, pageSize = 10, name, key, status } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };
    if (name) where.name = { contains: name };
    if (key) where.key = { contains: key };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.sysRole.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sort: 'asc' },
        include: { menus: { include: { menu: true } } },
      }),
      this.prisma.sysRole.count({ where }),
    ]);

    return new PaginatedResult(data, total, page, pageSize);
  }

  async findOne(id: number) {
    const role = await this.prisma.sysRole.findFirst({
      where: { id, deleted: false },
      include: { menus: { include: { menu: true } } },
    });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const existing = await this.prisma.sysRole.findFirst({
      where: { id, deleted: false },
    });
    if (!existing) throw new NotFoundException('角色不存在');

    if (existing.key === 'admin') {
      throw new BadRequestException('不能修改超级管理员角色');
    }

    const { menuIds, ...roleData } = updateRoleDto;

    return this.prisma.sysRole.update({
      where: { id },
      data: {
        ...roleData,
        menus: menuIds
          ? {
              deleteMany: {},
              create: menuIds.map((menuId) => ({ menuId })),
            }
          : undefined,
      },
      include: { menus: { include: { menu: true } } },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.sysRole.findFirst({
      where: { id, deleted: false },
    });
    if (!existing) throw new NotFoundException('角色不存在');

    if (existing.key === 'admin') {
      throw new BadRequestException('不能删除超级管理员角色');
    }

    await this.prisma.sysRole.delete({ where: { id } });
    return { message: '删除成功' };
  }

  async findAllSimple() {
    return this.prisma.sysRole.findMany({
      where: { deleted: false, status: 'ENABLED' },
      select: { id: true, name: true, key: true },
      orderBy: { sort: 'asc' },
    });
  }

  async toggleStatus(id: number) {
    const existing = await this.prisma.sysRole.findFirst({
      where: { id, deleted: false },
    });
    if (!existing) throw new NotFoundException('角色不存在');

    if (existing.key === 'admin') {
      throw new BadRequestException('不能修改超级管理员角色状态');
    }

    const newStatus = existing.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    return this.prisma.sysRole.update({
      where: { id },
      data: { status: newStatus },
    });
  }
}
