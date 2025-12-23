import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMenuPaths() {
  try {
    console.log('开始修复菜单路径...\n');

    // 修复操作日志路径
    const operLogMenu = await prisma.sysMenu.findFirst({
      where: { path: '/system/log/operlog' }
    });

    if (operLogMenu) {
      await prisma.sysMenu.update({
        where: { id: operLogMenu.id },
        data: {
          path: '/system/operlog',
          component: 'system/operlog/index',
          name: '操作日志',
        }
      });
      console.log('✅ 修复操作日志路径: /system/log/operlog -> /system/operlog');
    }

    // 修复登录日志路径
    const loginLogMenu = await prisma.sysMenu.findFirst({
      where: { path: '/system/log/loginlog' }
    });

    if (loginLogMenu) {
      await prisma.sysMenu.update({
        where: { id: loginLogMenu.id },
        data: {
          path: '/system/loginlog',
          component: 'system/loginlog/index',
          name: '登录日志',
        }
      });
      console.log('✅ 修复登录日志路径: /system/log/loginlog -> /system/loginlog');
    }

    // 修复参数设置路径（如果需要）
    const configMenu = await prisma.sysMenu.findFirst({
      where: { path: '/system/config' }
    });

    if (configMenu) {
      await prisma.sysMenu.update({
        where: { id: configMenu.id },
        data: {
          component: 'system/config/index',
        }
      });
      console.log('✅ 修复参数设置组件路径');
    }

    // 修复通知公告路径（如果需要）
    const noticeMenu = await prisma.sysMenu.findFirst({
      where: { path: '/system/notice' }
    });

    if (noticeMenu) {
      await prisma.sysMenu.update({
        where: { id: noticeMenu.id },
        data: {
          component: 'system/notice/index',
        }
      });
      console.log('✅ 修复通知公告组件路径');
    }

    console.log('\n🎉 菜单路径修复完成！');
    console.log('');
    console.log('请重新登录系统以获取最新的菜单信息');

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMenuPaths();
