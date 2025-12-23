import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSystemMenus() {
  try {
    console.log('开始添加系统管理菜单...');

    // 首先确保系统管理父菜单存在
    const systemMenu = await prisma.sysMenu.findFirst({
      where: { path: '/system', name: '系统管理' }
    });

    let systemMenuId: number;
    if (!systemMenu) {
      const newSystemMenu = await prisma.sysMenu.create({
        data: {
          parentId: 0,
          name: '系统管理',
          path: '/system',
          component: '',
          type: 'DIR' as any,
          icon: 'SettingOutlined',
          sort: 1,
          perms: 'system:manage',
          visible: true,
          status: 'ENABLED' as any,
          createdBy: 'system',
        }
      });
      systemMenuId = newSystemMenu.id;
      console.log('✅ 系统管理父菜单已创建');
    } else {
      systemMenuId = systemMenu.id;
      console.log('ℹ️ 系统管理父菜单已存在');
    }

    // 要添加的菜单项
    const menus = [
      {
        parentId: systemMenuId,
        name: '操作日志',
        path: '/system/operlog',
        component: 'system/operlog/index',
        type: 'MENU' as any,
        icon: 'FileTextOutlined',
        sort: 1,
        perms: 'system:operlog:list',
        visible: true,
        status: 'ENABLED' as any,
      },
      {
        parentId: systemMenuId,
        name: '登录日志',
        path: '/system/loginlog',
        component: 'system/loginlog/index',
        type: 'MENU' as any,
        icon: 'LoginOutlined',
        sort: 2,
        perms: 'system:loginlog:list',
        visible: true,
        status: 'ENABLED' as any,
      },
      {
        parentId: systemMenuId,
        name: '参数设置',
        path: '/system/config',
        component: 'system/config/index',
        type: 'MENU' as any,
        icon: 'ToolOutlined',
        sort: 3,
        perms: 'system:config:list',
        visible: true,
        status: 'ENABLED' as any,
      },
      {
        parentId: systemMenuId,
        name: '通知公告',
        path: '/system/notice',
        component: 'system/notice/index',
        type: 'MENU' as any,
        icon: 'NotificationOutlined',
        sort: 4,
        perms: 'system:notice:list',
        visible: true,
        status: 'ENABLED' as any,
      },
    ];

    // 创建每个菜单项
    for (const menuData of menus) {
      try {
        const result = await prisma.sysMenu.create({
          data: {
            ...menuData,
            createdBy: 'system',
          }
        });
        console.log(`✅ 菜单项 "${menuData.name}" 已创建 (ID: ${result.id})`);
      } catch (error: any) {
        // 如果已存在，则忽略错误
        if (error.code === 'P2002') {
          console.log(`ℹ️ 菜单项 "${menuData.name}" 已存在`);
        } else {
          console.error(`❌ 创建菜单项 "${menuData.name}" 失败:`, error.message);
        }
      }
    }

    // 为管理员角色分配所有菜单权限
    console.log('\n开始为管理员角色分配菜单权限...');
    const allMenus = await prisma.sysMenu.findMany({
      where: { deleted: false }
    });

    for (const menu of allMenus) {
      const roleMenu = await prisma.sysRoleMenu.findUnique({
        where: {
          roleId_menuId: {
            roleId: 1,
            menuId: menu.id
          }
        }
      });

      if (!roleMenu) {
        await prisma.sysRoleMenu.create({
          data: {
            roleId: 1,
            menuId: menu.id
          }
        });
        console.log(`✅ 已为管理员分配菜单权限: ${menu.name}`);
      }
    }

    console.log('\n🎉 所有菜单配置完成！');
    console.log('');
    console.log('请重新登录系统以获取最新的权限信息');
  } catch (error) {
    console.error('❌ 配置失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSystemMenus();
