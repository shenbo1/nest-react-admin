import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugProfileApi() {
  try {
    console.log('=== 调试 Profile API ===\n');

    // 查找 admin 用户
    const user = await prisma.sysUser.findFirst({
      where: { username: 'admin', deleted: false },
      include: {
        dept: true,
        roles: {
          include: {
            role: {
              include: {
                menus: {
                  include: {
                    menu: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.log('❌ 未找到 admin 用户');
      return;
    }

    console.log(`用户: ${user.username}\n`);

    // 模拟 getPermissions 方法
    const permissions = new Set<string>();

    for (const ur of user.roles) {
      if (ur.role.status === 'ENABLED') {
        // 超级管理员拥有所有权限
        if (ur.role.key === 'admin') {
          permissions.add('*:*:*');
        }

        for (const rm of ur.role.menus) {
          if (rm.menu.status === 'ENABLED') {
            // 如果有权限标识，直接使用
            if (rm.menu.perms) {
              permissions.add(rm.menu.perms);
            } else {
              // 为没有权限标识的菜单生成默认权限标识
              const defaultPerm = generateDefaultPermission(rm.menu);
              if (defaultPerm) {
                permissions.add(defaultPerm);
              }
            }
          }
        }
      }
    }

    console.log('=== 返回的权限列表 ===');
    const permsArray = Array.from(permissions);
    permsArray.forEach((perm, index) => {
      console.log(`${index + 1}. ${perm}`);
    });

    console.log(`\n总计: ${permsArray.length} 个权限\n`);

    // 检查新增菜单的权限
    console.log('=== 新增菜单权限检查 ===');
    const newMenuPermissions = [
      'system:operlog:list',
      'system:loginlog:list',
      'system:config:list',
      'system:notice:list'
    ];

    newMenuPermissions.forEach((perm) => {
      if (permsArray.includes(perm)) {
        console.log(`✅ ${perm}: 已包含`);
      } else {
        console.log(`❌ ${perm}: 未包含`);
      }
    });

  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateDefaultPermission(menu: any): string | null {
  // 如果菜单有路径，尝试从路径生成权限标识
  if (menu.path) {
    // 移除路径开头的斜杠
    const cleanPath = menu.path.replace(/^\//, '');
    // 将路径中的斜杠替换为冒号
    const permFromPath = cleanPath.replace(/\//g, ':');

    // 根据菜单类型添加操作后缀
    if (menu.type === 'DIRECTORY') {
      return `${permFromPath}:list`;
    } else if (menu.type === 'MENU') {
      return `${permFromPath}:list`;
    } else if (menu.type === 'BUTTON') {
      return `${permFromPath}:${menu.perms || 'execute'}`;
    }
  }

  // 如果无法从路径生成，使用菜单ID
  return `system:menu:${menu.id}`;
}

debugProfileApi();
