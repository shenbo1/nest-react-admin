import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMenuAssignment() {
  try {
    console.log('🧪 测试菜单权限分配...\n');

    // 测试给角色分配菜单权限
    const roleId = 1; // 管理员角色
    const menuIds = [1, 11, 12, 13, 14, 16]; // 首页、用户管理、角色管理、菜单管理、部门管理、字典管理

    console.log(`📝 为角色 ${roleId} 分配菜单权限:`, menuIds);

    // 删除旧的权限
    await prisma.sysRoleMenu.deleteMany({
      where: { roleId }
    });
    console.log('✅ 已删除旧的权限');

    // 添加新的权限
    for (const menuId of menuIds) {
      await prisma.sysRoleMenu.create({
        data: {
          roleId,
          menuId
        }
      });
    }
    console.log('✅ 已添加新的权限');

    // 验证权限
    const roleMenus = await prisma.sysRoleMenu.findMany({
      where: { roleId },
      include: {
        menu: true
      }
    });

    console.log('\n📋 当前角色权限列表：');
    roleMenus.forEach(rm => {
      console.log(`  - ${rm.menu.name} (${rm.menu.perms || '无权限标识'})`);
    });

    console.log('\n🎉 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMenuAssignment();
