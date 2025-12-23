import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllPermissions() {
  try {
    console.log('=== 开始修复所有权限 ===\n');

    // 查找所有菜单
    const menus = await prisma.sysMenu.findMany({
      where: { deleted: false },
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
    });

    console.log(`找到 ${menus.length} 个菜单\n`);

    // 为菜单项生成权限标识
    const updatedMenus = [];

    for (const menu of menus) {
      if (menu.path && menu.type !== 'BUTTON') {
        // 菜单类型的权限：查看
        const cleanPath = menu.path.replace(/^\//, '');
        const permFromPath = cleanPath.replace(/\//g, ':');
        const listPerm = `${permFromPath}:list`;
        const queryPerm = `${permFromPath}:query`;

        // 如果菜单没有权限标识，添加
        if (!menu.perms && menu.type === 'MENU') {
          updatedMenus.push({
            id: menu.id,
            oldPerms: menu.perms,
            newPerms: listPerm,
          });

          await prisma.sysMenu.update({
            where: { id: menu.id },
            data: { perms: listPerm },
          });

          console.log(`✅ 更新菜单权限: ${menu.name} (${menu.path})`);
          console.log(`   ${listPerm}`);
        }
      } else if (menu.type === 'BUTTON' && !menu.perms) {
        // 按钮类型：根据父菜单生成权限
        const parentMenu = menus.find(m => m.id === menu.parentId);
        if (parentMenu && parentMenu.path) {
          const cleanPath = parentMenu.path.replace(/^\//, '');
          const permFromPath = cleanPath.replace(/\//g, ':');

          let buttonPerm = '';
          if (menu.name.includes('新增')) {
            buttonPerm = `${permFromPath}:add`;
          } else if (menu.name.includes('修改') || menu.name.includes('编辑')) {
            buttonPerm = `${permFromPath}:edit`;
          } else if (menu.name.includes('删除')) {
            buttonPerm = `${permFromPath}:remove`;
          } else if (menu.name.includes('查询') || menu.name.includes('详情')) {
            buttonPerm = `${permFromPath}:query`;
          } else {
            buttonPerm = `${permFromPath}:${menu.name}`;
          }

          if (buttonPerm) {
            updatedMenus.push({
              id: menu.id,
              oldPerms: menu.perms,
              newPerms: buttonPerm,
            });

            await prisma.sysMenu.update({
              where: { id: menu.id },
              data: { perms: buttonPerm },
            });

            console.log(`✅ 更新按钮权限: ${menu.name} (${parentMenu.path})`);
            console.log(`   ${buttonPerm}`);
          }
        }
      }
    }

    console.log(`\n=== 重新分配权限给管理员角色 ===\n`);

    // 重新为管理员分配所有菜单权限
    const allMenus = await prisma.sysMenu.findMany({
      where: { deleted: false, perms: { not: null } },
    });

    for (const menu of allMenus) {
      // 检查是否已有权限
      const existingRoleMenu = await prisma.sysRoleMenu.findUnique({
        where: {
          roleId_menuId: {
            roleId: 1,
            menuId: menu.id,
          },
        },
      });

      if (!existingRoleMenu) {
        await prisma.sysRoleMenu.create({
          data: {
            roleId: 1,
            menuId: menu.id,
          },
        });
        console.log(`✅ 分配权限: ${menu.name} - ${menu.perms}`);
      }
    }

    console.log('\n🎉 权限修复完成！');
    console.log('');
    console.log('已更新的菜单数量:', updatedMenus.length);
    console.log('请重新登录系统以获取最新的权限信息');

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllPermissions();
