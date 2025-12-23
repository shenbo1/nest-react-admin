import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDuplicateMenus() {
  try {
    console.log('开始清理重复菜单...\n');

    // 删除重复的菜单项（旧的路径）
    const oldOperLog = await prisma.sysMenu.findFirst({
      where: { path: '/system/log/operlog' }
    });

    if (oldOperLog) {
      await prisma.sysMenu.delete({
        where: { id: oldOperLog.id }
      });
      console.log(`✅ 删除重复的操作日志菜单 (ID: ${oldOperLog.id})`);
    }

    const oldLoginLog = await prisma.sysMenu.findFirst({
      where: { path: '/system/log/loginlog' }
    });

    if (oldLoginLog) {
      await prisma.sysMenu.delete({
        where: { id: oldLoginLog.id }
      });
      console.log(`✅ 删除重复的登录日志菜单 (ID: ${oldLoginLog.id})`);
    }

    // 删除重复的菜单项（错误的父级）
    const duplicateMenus = [
      { name: '菜单管理', path: '/system/menu', parentId: 10 },
      { name: '部门管理', path: '/system/dept', parentId: 10 },
      { name: '岗位管理', path: '/system/post', parentId: 10 },
      { name: '字典管理', path: '/system/dict', parentId: 10 },
      { name: '参数设置', path: '/system/config', parentId: 10 },
      { name: '通知公告', path: '/system/notice', parentId: 10 },
      { name: '日志管理', path: '/system/log', parentId: 10 },
    ];

    for (const menu of duplicateMenus) {
      const duplicate = await prisma.sysMenu.findFirst({
        where: {
          path: menu.path,
          parentId: menu.parentId
        }
      });

      if (duplicate) {
        await prisma.sysMenu.delete({
          where: { id: duplicate.id }
        });
        console.log(`✅ 删除重复的菜单项: ${menu.name} (ID: ${duplicate.id})`);
      }
    }

    // 删除重复的权限按钮菜单
    const duplicatePermissionMenus = [
      { parentId: 13 }, // 菜单管理下的按钮
      { parentId: 14 }, // 部门管理下的按钮
      { parentId: 16 }, // 字典管理下的按钮
    ];

    for (const perm of duplicatePermissionMenus) {
      const menus = await prisma.sysMenu.findMany({
        where: {
          parentId: perm.parentId,
          path: null,
          perms: { not: null }
        }
      });

      // 只保留一个
      if (menus.length > 1) {
        for (let i = 1; i < menus.length; i++) {
          await prisma.sysMenu.delete({
            where: { id: menus[i].id }
          });
          console.log(`✅ 删除重复的权限菜单: ${menus[i].name} (ID: ${menus[i].id})`);
        }
      }
    }

    console.log('\n🎉 菜单清理完成！');
    console.log('');
    console.log('请重新登录系统以获取最新的菜单信息');

  } catch (error) {
    console.error('❌ 清理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicateMenus();
