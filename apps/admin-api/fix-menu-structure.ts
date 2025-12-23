import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMenuStructure() {
  try {
    console.log('开始修复菜单结构...\n');

    // 将操作日志和登录日志移到系统管理下
    const operLogMenu = await prisma.sysMenu.findFirst({
      where: { path: '/system/operlog' }
    });

    if (operLogMenu && operLogMenu.parentId !== 1) {
      await prisma.sysMenu.update({
        where: { id: operLogMenu.id },
        data: { parentId: 1, sort: 3 }
      });
      console.log(`✅ 移动操作日志到系统管理下 (ID: ${operLogMenu.id})`);
    }

    const loginLogMenu = await prisma.sysMenu.findFirst({
      where: { path: '/system/loginlog' }
    });

    if (loginLogMenu && loginLogMenu.parentId !== 1) {
      await prisma.sysMenu.update({
        where: { id: loginLogMenu.id },
        data: { parentId: 1, sort: 4 }
      });
      console.log(`✅ 移动登录日志到系统管理下 (ID: ${loginLogMenu.id})`);
    }

    // 删除空的日志管理菜单（如果没有子菜单）
    const logMenu = await prisma.sysMenu.findFirst({
      where: { path: '/system/log' }
    });

    if (logMenu) {
      const children = await prisma.sysMenu.count({
        where: { parentId: logMenu.id, deleted: false }
      });

      if (children === 0) {
        await prisma.sysMenu.delete({
          where: { id: logMenu.id }
        });
        console.log(`✅ 删除空的日志管理菜单 (ID: ${logMenu.id})`);
      } else {
        // 如果有子菜单，重新排序
        await prisma.sysMenu.update({
          where: { id: logMenu.id },
          data: { sort: 5 }
        });
        console.log(`ℹ️ 保留日志管理菜单，它有 ${children} 个子菜单`);
      }
    }

    console.log('\n🎉 菜单结构修复完成！');
    console.log('');
    console.log('请重新登录系统以获取最新的菜单信息');

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMenuStructure();
