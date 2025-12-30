import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { WfCategoryStatus } from '@prisma/client';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoryDto } from './dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建分类
   */
  async create(dto: CreateCategoryDto) {
    // 检查编码是否已存在
    const existing = await this.prisma.wfCategory.findFirst({
      where: { code: dto.code, deleted: false },
    });

    if (existing) {
      throw new ConflictException(`分类编码 ${dto.code} 已存在`);
    }

    // 计算层级
    let level = 0;
    if (dto.parentId) {
      const parent = await this.prisma.wfCategory.findFirst({
        where: { id: dto.parentId, deleted: false },
      });
      if (!parent) {
        throw new NotFoundException(`父分类 #${dto.parentId} 不存在`);
      }
      level = parent.level + 1;
    }

    return this.prisma.wfCategory.create({
      data: {
        code: dto.code,
        name: dto.name,
        parentId: dto.parentId,
        level,
        icon: dto.icon,
        color: dto.color,
        sort: dto.sort ?? 0,
        status: dto.status ?? WfCategoryStatus.ENABLED,
        remark: dto.remark,
      },
    });
  }

  /**
   * 查询分类列表 - 返回树形结构
   */
  async findAll(query: QueryCategoryDto) {
    const { code, name, status } = query;

    const where = {
      deleted: false,
      ...(code && { code: { contains: code } }),
      ...(name && { name: { contains: name } }),
      ...(status && { status }),
    };

    const data = await this.prisma.wfCategory.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        code: true,
        name: true,
        icon: true,
        color: true,
        parentId: true,
        level: true,
        sort: true,
        status: true,
        remark: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 构建树形结构
    const buildTree = (parentId: number | null): any[] => {
      return data
        .filter((item) => item.parentId === parentId)
        .map((item) => {
          const children = buildTree(item.id);
          return {
            ...item,
            key: item.id,
            children,
            childrenCount: children.length,
          };
        });
    };

    const treeData = buildTree(null);

    return {
      list: treeData,
      total: treeData.length,
      page: 1,
      pageSize: 9999, // 树形结构不分页
    };
  }

  /**
   * 获取所有分类（用于下拉选择）
   */
  async findAllForSelect() {
    const data = await this.prisma.wfCategory.findMany({
      where: {
        deleted: false,
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        parentId: true,
        level: true,
        color: true,
      },
    });

    // 构建树形结构
    const buildTree = (parentId: number | null): any[] => {
      return data
        .filter((item) => item.parentId === parentId)
        .map((item) => ({
          id: item.id,
          name: item.name,
          title: item.name,
          level: item.level,
          color: item.color,
          children: buildTree(item.id),
        }));
    };

    const treeData = buildTree(null);

    return {
      list: treeData,
    };
  }

  /**
   * 查询分类详情
   */
  async findOne(id: number) {
    const category = await this.prisma.wfCategory.findFirst({
      where: { id, deleted: false },
    });

    if (!category) {
      throw new NotFoundException(`分类 #${id} 不存在`);
    }

    return category;
  }

  /**
   * 更新分类
   */
  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);

    // 检查编码是否与其他分类冲突
    if (dto.code) {
      const existing = await this.prisma.wfCategory.findFirst({
        where: {
          code: dto.code,
          deleted: false,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`分类编码 ${dto.code} 已存在`);
      }
    }

    return this.prisma.wfCategory.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * 删除分类
   */
  async remove(id: number) {
    const category = await this.findOne(id);

    // 检查是否有关联的流程定义
    const flowCount = await this.prisma.wfFlowDefinition.count({
      where: { categoryId: id, deleted: false },
    });

    if (flowCount > 0) {
      throw new ConflictException(
        `该分类下有 ${flowCount} 个流程定义，无法删除`,
      );
    }

    // 检查是否有子分类
    const childrenCount = await this.prisma.wfCategory.count({
      where: { parentId: id, deleted: false },
    });

    if (childrenCount > 0) {
      throw new ConflictException('该分类下存在子分类，无法删除');
    }

    // 软删除时修改 code，避免唯一约束冲突
    return this.prisma.wfCategory.update({
      where: { id },
      data: {
        code: `${category.code}_deleted_${Date.now()}`,
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * 批量删除分类
   */
  async batchRemove(ids: number[]) {
    // 检查是否有关联的流程定义
    const flowCount = await this.prisma.wfFlowDefinition.count({
      where: { categoryId: { in: ids }, deleted: false },
    });

    if (flowCount > 0) {
      throw new ConflictException(
        `选中的分类下有 ${flowCount} 个流程定义，无法删除`,
      );
    }

    // 获取要删除的分类
    const categories = await this.prisma.wfCategory.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });

    // 逐个删除以处理 code 唯一约束
    const timestamp = Date.now();
    return this.prisma.$transaction(
      categories.map((cat, index) =>
        this.prisma.wfCategory.update({
          where: { id: cat.id },
          data: {
            code: `${cat.code}_deleted_${timestamp + index}`,
            deleted: true,
            deletedAt: new Date(),
          },
        }),
      ),
    );
  }

  /**
   * 更新分类状态
   */
  async updateStatus(id: number, status: WfCategoryStatus) {
    await this.findOne(id);

    return this.prisma.wfCategory.update({
      where: { id },
      data: { status },
    });
  }
}
