import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateMenuDto, UpdateMenuDto } from './dto';
import { Prisma, Status } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMenuDto: CreateMenuDto) {
    const data = this.normalizeMenuData(createMenuDto);
    return this.prisma.sysMenu.create({ data });
  }

  async findAll() {
    const menus = await this.prisma.sysMenu.findMany({
      where: { deleted: false },
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
    });
    return this.buildTree(menus);
  }

  async findOne(id: number) {
    const menu = await this.prisma.sysMenu.findFirst({
      where: { id, deleted: false },
    });
    if (!menu) throw new NotFoundException('菜单不存在');
    return menu;
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    const existing = await this.prisma.sysMenu.findFirst({
      where: { id, deleted: false },
    });
    if (!existing) throw new NotFoundException('菜单不存在');

    // 不能将父级设为自己或自己的子级
    if (updateMenuDto.parentId === id) {
      throw new BadRequestException('不能将父级设为自己');
    }

    const data = this.normalizeMenuData(updateMenuDto);
    return this.prisma.sysMenu.update({ where: { id }, data });
  }

  async remove(id: number) {
    const existing = await this.prisma.sysMenu.findFirst({
      where: { id, deleted: false },
    });
    if (!existing) throw new NotFoundException('菜单不存在');

    // 检查是否有子菜单
    const children = await this.prisma.sysMenu.count({
      where: { parentId: id, deleted: false },
    });
    if (children > 0) {
      throw new BadRequestException('存在子菜单，不能删除');
    }

    await this.prisma.sysMenu.delete({ where: { id } });
    return { message: '删除成功' };
  }

  async getTreeSelect() {
    const menus = await this.prisma.sysMenu.findMany({
      where: { deleted: false, status: Status.ENABLED },
      select: { id: true, parentId: true, name: true },
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
    });
    return this.buildTree(menus);
  }

  async toggleStatus(id: number) {
    const record = await this.findOne(id);
    const newStatus = record.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    return this.prisma.sysMenu.update({
      where: { id },
      data: { status: newStatus as Status },
    });
  }

  private buildTree(menus: any[], parentId = 0): any[] {
    return menus
      .filter((menu) => menu.parentId === parentId)
      .map((menu) => ({
        ...menu,
        children: this.buildTree(menus, menu.id),
      }))
      .map((menu) =>
        menu.children.length === 0 ? { ...menu, children: undefined } : menu,
      );
  }

  private normalizeMenuData(
    data: CreateMenuDto,
  ): Prisma.SysMenuUncheckedCreateInput;
  private normalizeMenuData(
    data: UpdateMenuDto,
  ): Prisma.SysMenuUncheckedUpdateInput;
  private normalizeMenuData(data: CreateMenuDto | UpdateMenuDto) {
    const normalized: Record<string, unknown> = { ...data };
    delete normalized.id;
    delete normalized.createdAt;
    delete normalized.updatedAt;
    delete normalized.deletedAt;
    delete normalized.createdBy;
    delete normalized.updatedBy;
    Object.keys(normalized).forEach((key) => {
      if (normalized[key] === null || normalized[key] === undefined) {
        delete normalized[key];
      }
    });
    return normalized as
      | Prisma.SysMenuUncheckedCreateInput
      | Prisma.SysMenuUncheckedUpdateInput;
  }
}
