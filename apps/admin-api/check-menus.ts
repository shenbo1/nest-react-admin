import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMenus() {
  try {
    console.log('=== 检查菜单数据 ===\n');

    // 查找所有菜单
    const menus = await prisma.sysMenu.findMany({
      where: { deleted: false },
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
    });

    console.log(`总共有 ${menus.length} 个菜单项:\n`);

    menus.forEach((menu) => {
      console.log(`ID: ${menu.id}`);
      console.log(`  名称: ${menu.name}`);
      console.log(`  路径: ${menu.path}`);
      console.log(`  组件: ${menu.component}`);
      console.log(`  权限: ${menu.perms}`);
      console.log(`  状态: ${menu.status}`);
      console.log(`  父级ID: ${menu.parentId}`);
      console.log('---');
    });

    // 检查管理员角色的菜单权限
    console.log('\n=== 检查管理员角色权限 ===\n');
    const roleMenus = await prisma.sysRoleMenu.findMany({
      where: { roleId: 1 },
      include: { menu: true },
    });

    console.log(`管理员角色有 ${roleMenus.length} 个菜单权限:\n`);

    roleMenus.forEach((rm) => {
      console.log(`菜单ID: ${rm.menuId}, 菜单名称: ${rm.menu.name}, 路径: ${rm.menu.path}`);
    });

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMenus();
