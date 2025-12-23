import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateDeptDto, UpdateDeptDto } from './dto';
import { Status } from '@prisma/client';

@Injectable()
export class DeptService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDeptDto: CreateDeptDto) {
    // 获取父部门的 ancestors
    let ancestors = '0';
    if (createDeptDto.parentId && createDeptDto.parentId > 0) {
      const parent = await this.prisma.sysDept.findFirst({
        where: { id: createDeptDto.parentId, deleted: false },
      });
      if (!parent) {
        throw new BadRequestException('父部门不存在');
      }
      ancestors = parent.ancestors ? `${parent.ancestors},${parent.id}` : `${parent.id}`;
    }

    return this.prisma.sysDept.create({
      data: {
        ...createDeptDto,
        ancestors,
      },
    });
  }

  async findAll() {
    const depts = await this.prisma.sysDept.findMany({
      where: { deleted: false },
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
    });
    return this.buildTree(depts);
  }

  async findOne(id: number) {
    const dept = await this.prisma.sysDept.findFirst({
      where: { id, deleted: false },
    });
    if (!dept) throw new NotFoundException('部门不存在');
    return dept;
  }

  async update(id: number, updateDeptDto: UpdateDeptDto) {
    const existing = await this.prisma.sysDept.findFirst({
      where: { id, deleted: false },
    });
    if (!existing) throw new NotFoundException('部门不存在');

    if (updateDeptDto.parentId === id) {
      throw new BadRequestException('不能将父级设为自己');
    }

    // 更新 ancestors
    let ancestors = existing.ancestors;
    if (updateDeptDto.parentId !== undefined && updateDeptDto.parentId !== existing.parentId) {
      if (updateDeptDto.parentId === 0) {
        ancestors = '0';
      } else {
        const parent = await this.prisma.sysDept.findFirst({
          where: { id: updateDeptDto.parentId, deleted: false },
        });
        if (!parent) {
          throw new BadRequestException('父部门不存在');
        }
        ancestors = parent.ancestors ? `${parent.ancestors},${parent.id}` : `${parent.id}`;
      }
    }

    return this.prisma.sysDept.update({
      where: { id },
      data: {
        ...updateDeptDto,
        ancestors,
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.sysDept.findFirst({
      where: { id, deleted: false },
    });
    if (!existing) throw new NotFoundException('部门不存在');

    // 检查是否有子部门
    const children = await this.prisma.sysDept.count({
      where: { parentId: id, deleted: false },
    });
    if (children > 0) {
      throw new BadRequestException('存在子部门，不能删除');
    }

    // 检查是否有用户
    const users = await this.prisma.sysUser.count({
      where: { deptId: id, deleted: false },
    });
    if (users > 0) {
      throw new BadRequestException('部门下存在用户，不能删除');
    }

    await this.prisma.sysDept.delete({ where: { id } });
    return { message: '删除成功' };
  }

  async getTreeSelect() {
    const depts = await this.prisma.sysDept.findMany({
      where: { deleted: false, status: Status.ENABLED },
      select: { id: true, parentId: true, name: true },
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
    });
    return this.buildTree(depts);
  }

  private buildTree(depts: any[], parentId = 0): any[] {
    return depts
      .filter((dept) => dept.parentId === parentId)
      .map((dept) => ({
        ...dept,
        children: this.buildTree(depts, dept.id),
      }))
      .map((dept) => (dept.children.length === 0 ? { ...dept, children: undefined } : dept));
  }
}
