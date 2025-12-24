import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建
   */
  async create(dto: CreateCategoryDto, userId: number) {
    // 处理层级逻辑
    let level = dto.level || 1;
    let ancestors = null;

    // 如果有父分类，需要计算正确的层级和祖先路径
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deleted: false },
        select: { level: true, ancestors: true },
      });

      if (parent) {
        // 层级为父分类层级+1，但不能超过5级
        level = Math.min(parent.level + 1, 5);

        // 构建祖先路径
        const parentAncestors = parent.ancestors ? `${parent.ancestors},` : '';
        ancestors = `${parentAncestors}${dto.parentId}`;
      }
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        level,
        ancestors,
        createdBy: String(userId),
      },
    });
  }

  /**
   * 分页查询 - 返回树形结构
   */
  async findAll(query: QueryCategoryDto) {
    const { name, status } = query;

    const where = {
      deleted: false,
      ...(name && { name: { contains: name } }),
      ...(status && { status }),
    };

    const data = await this.prisma.category.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        code: true,
        parentId: true,
        level: true,
        sort: true,
        status: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 构建树形结构
    const buildTree = (parentId: number | null): any[] => {
      return data
        .filter(item => item.parentId === parentId)
        .map(item => {
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
      data: treeData,
      total: treeData.length,
      page: 1,
      pageSize: 9999, // 树形结构不分页
    };
  }

  /**
   * 获取所有分类（用于下拉选择）
   */
  async findAllForSelect() {
    const data = await this.prisma.category.findMany({
      where: {
        deleted: false,
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        parentId: true,
        level: true,
      },
    });

    // 构建树形结构
    const buildTree = (parentId: number | null): any[] => {
      return data
        .filter(item => item.parentId === parentId)
        .map(item => ({
          id: item.id,
          name: item.name,
          title: item.name,
          level: item.level,
          children: buildTree(item.id),
        }));
    };

    const treeData = buildTree(null);

    return {
      list: treeData,
    };
  }

  /**
   * 获取详情
   */
  async findOne(id: number) {
    const record = await this.prisma.category.findFirst({
      where: { id, deleted: false },
    });
    if (!record) {
      throw new NotFoundException('记录不存在');
    }
    return record;
  }

  /**
   * 更新
   */
  async update(id: number, dto: UpdateCategoryDto, userId: number) {
    const currentRecord = await this.findOne(id);

    // 处理层级逻辑 - 只有parentId改变时才重新计算
    let level = dto.level;
    let ancestors = null;

    // 如果传入了parentId并且与当前parentId不同，需要重新计算
    if (dto.parentId !== undefined && dto.parentId !== currentRecord.parentId) {
      if (dto.parentId === null) {
        // 设置为一级分类
        level = 1;
        ancestors = null;
      } else if (dto.parentId) {
        // 查找父分类
        const parent = await this.prisma.category.findFirst({
          where: { id: dto.parentId, deleted: false },
          select: { level: true, ancestors: true },
        });

        if (parent) {
          // 层级为父分类层级+1，但不能超过5级
          level = Math.min(parent.level + 1, 5);

          // 构建祖先路径
          const parentAncestors = parent.ancestors
            ? `${parent.ancestors},`
            : '';
          ancestors = `${parentAncestors}${dto.parentId}`;
        } else {
          // 父分类不存在，保持原样
          level = currentRecord.level;
          ancestors = currentRecord.ancestors;
        }
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        level,
        ancestors,
        updatedBy: String(userId),
      },
    });
  }

  /**
   * 删除（软删除）
   */
  async remove(id: number, userId: number) {
    await this.findOne(id);

    // 检查是否有子分类
    const childrenCount = await this.prisma.category.count({
      where: { parentId: id, deleted: false },
    });

    if (childrenCount > 0) {
      throw new ConflictException('该分类下存在子分类，无法删除');
    }

    return this.prisma.category.update({
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

    // 检查是否有子分类（如果是要禁用）
    if (record.status === 'ENABLED') {
      const childrenCount = await this.prisma.category.count({
        where: { parentId: id, deleted: false },
      });

      if (childrenCount > 0) {
        throw new ConflictException('该分类下存在子分类，无法禁用');
      }
    }

    const newStatus = record.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';

    return this.prisma.category.update({
      where: { id },
      data: {
        status: newStatus,
        updatedBy: String(userId),
      },
    });
  }
}
