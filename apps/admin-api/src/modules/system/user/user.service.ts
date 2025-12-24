import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PaginatedResult } from '@/common/dto';
import * as bcrypt from 'bcrypt';
import { Status } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // 检查用户名是否存在
    const existing = await this.prisma.sysUser.findFirst({
      where: { username: createUserDto.username, deleted: false },
    });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const { roleIds, ...userData } = createUserDto;

    const user = await this.prisma.sysUser.create({
      data: {
        ...userData,
        password: hashedPassword,
        roles: roleIds?.length
          ? {
              create: roleIds.map((roleId) => ({ roleId })),
            }
          : undefined,
      },
      include: {
        dept: true,
        roles: { include: { role: true } },
      },
    });

    return this.excludePassword(user);
  }

  async findAll(query: QueryUserDto) {
    const { page = 1, pageSize = 10, username, phone, status, deptId } = query;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };

    if (username) {
      where.username = { contains: username };
    }
    if (phone) {
      where.phone = { contains: phone };
    }
    if (status) {
      where.status = status;
    }
    if (deptId) {
      where.deptId = deptId;
    }

    const [data, total] = await Promise.all([
      this.prisma.sysUser.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          dept: true,
          roles: { include: { role: true } },
        },
      }),
      this.prisma.sysUser.count({ where }),
    ]);

    return new PaginatedResult(
      data.map((user) => this.excludePassword(user)),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: number) {
    const user = await this.prisma.sysUser.findFirst({
      where: { id, deleted: false },
      include: {
        dept: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.excludePassword(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existing = await this.prisma.sysUser.findFirst({
      where: { id, deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('用户不存在');
    }

    const { roleIds, ...userData } = updateUserDto;

    // 如果更新了密码，需要加密
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = await this.prisma.sysUser.update({
      where: { id },
      data: {
        ...userData,
        roles: roleIds
          ? {
              deleteMany: {},
              create: roleIds.map((roleId) => ({ roleId })),
            }
          : undefined,
      },
      include: {
        dept: true,
        roles: { include: { role: true } },
      },
    });

    return this.excludePassword(user);
  }

  async remove(id: number) {
    const existing = await this.prisma.sysUser.findFirst({
      where: { id, deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('用户不存在');
    }

    // 不允许删除 admin 用户
    if (existing.username === 'admin') {
      throw new BadRequestException('不能删除超级管理员');
    }

    await this.prisma.sysUser.delete({ where: { id } });

    return { message: '删除成功' };
  }

  async resetPassword(id: number, password: string) {
    const existing = await this.prisma.sysUser.findFirst({
      where: { id, deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('用户不存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.sysUser.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: '重置密码成功' };
  }

  async changeStatus(id: number, status: Status) {
    const existing = await this.prisma.sysUser.findFirst({
      where: { id, deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('用户不存在');
    }

    if (existing.username === 'admin') {
      throw new BadRequestException('不能修改超级管理员状态');
    }

    await this.prisma.sysUser.update({
      where: { id },
      data: { status },
    });

    return { message: '状态修改成功' };
  }

  async toggleStatus(id: number) {
    const existing = await this.prisma.sysUser.findFirst({
      where: { id, deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('用户不存在');
    }

    const newStatus = existing.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    return this.changeStatus(id, newStatus as Status);
  }

  private excludePassword(user: any) {
    const { password, ...result } = user;
    return result;
  }
}
