import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDashboardMenu() {
  try {
    console.log('开始添加仪表盘菜单...');
    
    // 检查仪表盘菜单是否已存在
    const existingDashboard = await prisma.sysMenu.findUnique({
      where: { id: 1 }
    });

    if (!existingDashboard) {
      // 创建仪表盘菜单
      await prisma.sysMenu.create({
        data: {
          id: 1,
          parentId: 0,
          name: '首页',
          path: '/dashboard',
          component: 'dashboard/index',
          type: 'MENU' as any,
          icon: 'DashboardOutlined',
          sort: 0,
          perms: 'dashboard:list',
          visible: true,
          status: 'ENABLED' as any,
          createdBy: 'system',
        }
      });
      console.log('✅ 仪表盘菜单已创建');
    } else {
      console.log('ℹ️ 仪表盘菜单已存在');
    }

    // 为管理员角色分配仪表盘权限
    const roleMenu = await prisma.sysRoleMenu.findUnique({
      where: {
        roleId_menuId: {
          roleId: 1,
          menuId: 1
        }
      }
    });

    if (!roleMenu) {
      await prisma.sysRoleMenu.create({
        data: {
          roleId: 1,
          menuId: 1
        }
      });
      console.log('✅ 管理员角色已分配仪表盘权限');
    } else {
      console.log('ℹ️ 管理员角色已有仪表盘权限');
    }

    console.log('🎉 仪表盘权限配置完成！');
    console.log('');
    console.log('请重新登录系统以获取最新的权限信息');
  } catch (error) {
    console.error('❌ 配置失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDashboardMenu();
