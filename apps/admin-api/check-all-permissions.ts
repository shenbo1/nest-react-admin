import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllPermissions() {
  try {
    console.log('=== 检查所有菜单权限 ===\n');

    // 查找 admin 用户
    const adminUser = await prisma.sysUser.findFirst({
      where: { username: 'admin' },
      include: {
        roles: {
          include: {
            role: {
              include: {
                menus: {
                  include: {
                    menu: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!adminUser) {
      console.log('❌ 未找到 admin 用户');
      return;
    }

    console.log(`用户: ${adminUser.username}\n`);

    // 获取所有权限
    const allPermissions = new Set<string>();

    // 从角色菜单关联中获取权限
    for (const userRole of adminUser.roles) {
      const roleMenus = await prisma.sysRoleMenu.findMany({
        where: { roleId: userRole.roleId },
        include: { menu: true }
      });

      roleMenus.forEach((rm) => {
        if (rm.menu.perms) {
          allPermissions.add(rm.menu.perms);
        }
      });
    }

    // 检查缺失的权限
    console.log('=== 缺失的权限检查 ===\n');

    const expectedPermissions = [
      // 菜单管理权限
      'system:menu:add',
      'system:menu:edit',
      'system:menu:remove',
      'system:menu:query',

      // 部门管理权限
      'system:dept:add',
      'system:dept:edit',
      'system:dept:remove',
      'system:dept:query',

      // 岗位管理权限
      'system:post:add',
      'system:post:edit',
      'system:post:remove',
      'system:post:query',

      // 字典管理权限
      'system:dict:add',
      'system:dict:edit',
      'system:dict:remove',
      'system:dict:query',

      // 参数设置权限
      'system:config:add',
      'system:config:edit',
      'system:config:remove',
      'system:config:query',

      // 通知公告权限
      'system:notice:add',
      'system:notice:edit',
      'system:notice:remove',
      'system:notice:query',

      // 操作日志权限
      'system:operlog:query',
      'system:operlog:remove',

      // 登录日志权限
      'system:loginlog:query',
      'system:loginlog:remove',
    ];

    expectedPermissions.forEach((perm) => {
      if (allPermissions.has(perm)) {
        console.log(`✅ ${perm}: 已拥有`);
      } else {
        console.log(`❌ ${perm}: 缺失`);
      }
    });

    console.log(`\n总计: 已拥有 ${allPermissions.size} 个权限`);

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllPermissions();
