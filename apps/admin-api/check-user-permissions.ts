import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserPermissions() {
  try {
    console.log('🔍 检查用户权限...\n');

    // 获取管理员用户及其权限
    const user = await prisma.sysUser.findFirst({
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

    if (!user) {
      console.log('❌ 未找到管理员用户');
      return;
    }

    console.log(`👤 用户：${user.username} (${user.nickname})`);
    console.log(`📋 角色：${user.roles.map(ur => ur.role.name).join(', ')}\n`);

    // 收集所有权限
    const permissions = new Set<string>();
    for (const ur of user.roles) {
      for (const rm of ur.role.menus) {
        if (rm.menu.perms) {
          permissions.add(rm.menu.perms);
        }
      }
    }

    console.log('🔑 拥有权限列表：');
    const permArray = Array.from(permissions).sort();
    permArray.forEach((perm, index) => {
      console.log(`  ${index + 1}. ${perm}`);
    });

    console.log(`\n📊 总计：${permArray.length} 个权限\n`);

    // 检查特定权限
    const requiredPerms = [
      'dashboard:list',
      'system:user:list',
      'system:user:query',
      'system:user:add',
      'system:user:edit',
      'system:user:remove'
    ];

    console.log('✅ 关键权限检查：');
    requiredPerms.forEach(perm => {
      const has = permissions.has(perm);
      console.log(`  ${has ? '✅' : '❌'} ${perm}`);
    });

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPermissions();
