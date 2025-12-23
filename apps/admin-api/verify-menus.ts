import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMenus() {
  try {
    console.log('=== 验证菜单结构 ===\n');

    // 查找系统管理下的所有子菜单
    const systemMenus = await prisma.sysMenu.findMany({
      where: { parentId: 1, deleted: false },
      orderBy: { sort: 'asc' }
    });

    console.log('系统管理下的菜单项:\n');

    systemMenus.forEach((menu) => {
      console.log(`✓ ${menu.name}`);
      console.log(`  路径: ${menu.path}`);
      console.log(`  组件: ${menu.component}`);
      console.log(`  权限: ${menu.perms}`);
      console.log('');
    });

    console.log(`总计: ${systemMenus.length} 个菜单项\n`);

    // 验证管理员权限
    const roleMenus = await prisma.sysRoleMenu.findMany({
      where: { roleId: 1 },
      include: { menu: true },
      orderBy: { menuId: 'asc' }
    });

    console.log('管理员角色权限验证:');
    const newMenus = roleMenus.filter(rm => rm.menu.path?.startsWith('/system/'));
    console.log(`✓ 系统管理相关权限: ${newMenus.length} 个\n`);

    console.log('✅ 菜单结构验证完成！');

  } catch (error) {
    console.error('❌ 验证失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMenus();
