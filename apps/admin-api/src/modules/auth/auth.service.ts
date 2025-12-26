import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Status } from '@prisma/client';
import { SessionService } from '@/modules/system/session/session.service';
import { UAParser } from 'ua-parser-js';
import { getIpLocation } from '@/common/utils/ip.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async login(loginDto: LoginDto, ip?: string, userAgent?: string) {
    const { username, password } = loginDto;

    // 解析 User-Agent（提前解析，用于记录失败日志）
    const uaResult = UAParser(userAgent || '');
    const browser = uaResult.browser.name || 'Unknown';
    const os = uaResult.os.name ? `${uaResult.os.name} ${uaResult.os.version || ''}`.trim() : 'Unknown';

    // 记录登录失败日志的辅助函数
    const logLoginFail = async (msg: string) => {
      const location = await getIpLocation(ip || '');
      await this.prisma.sysLoginLog.create({
        data: {
          username,
          status: '1', // 失败
          msg,
          ipaddr: ip,
          location,
          browser,
          os,
        },
      });
    };

    // 查找用户
    const user = await this.prisma.sysUser.findFirst({
      where: { username, deleted: false },
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
      await logLoginFail('用户名或密码错误');
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status === Status.DISABLED) {
      await logLoginFail('用户已被禁用');
      throw new UnauthorizedException('用户已被禁用');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logLoginFail('用户名或密码错误');
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 获取角色和权限
    const roles = user.roles.map((ur) => ur.role.key);
    const permissions = this.getPermissions(user.roles);

    // 生成 token
    const payload = {
      sub: user.id,
      username: user.username,
      roles,
      permissions,
    };

    const token = this.jwtService.sign(payload);

    // 获取 IP 地理位置
    const location = await getIpLocation(ip || '');

    // 创建会话
    await this.sessionService.createSession(
      user.id,
      user.username,
      token,
      ip || 'Unknown',
      browser,
    );

    // 更新登录信息
    await this.prisma.sysUser.update({
      where: { id: user.id },
      data: {
        loginTime: new Date(),
        loginIp: ip || null,
      },
    });

    // 记录登录日志
    await this.prisma.sysLoginLog.create({
      data: {
        username: user.username,
        status: '0',
        msg: '登录成功',
        ipaddr: ip,
        location,
        browser,
        os,
      },
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dept: user.dept,
        roles,
        permissions,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.sysUser.findFirst({
      where: { id: userId, deleted: false },
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
      throw new UnauthorizedException('用户不存在');
    }

    const roles = user.roles.map((ur) => ur.role.key);
    const permissions = this.getPermissions(user.roles);

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      dept: user.dept,
      roles,
      permissions,
    };
  }

  async getRouters(userId: number) {
    const user = await this.prisma.sysUser.findFirst({
      where: { id: userId, deleted: false },
      include: {
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
      throw new UnauthorizedException('用户不存在');
    }

    // 收集所有菜单
    const menuSet = new Map();
    for (const ur of user.roles) {
      if (ur.role.status === Status.ENABLED) {
        for (const rm of ur.role.menus) {
          if (rm.menu.status === Status.ENABLED && !rm.menu.deleted) {
            menuSet.set(rm.menu.id, rm.menu);
          }
        }
      }
    }

    const menus = Array.from(menuSet.values());
    return this.buildMenuTree(menus);
  }

  private getPermissions(userRoles: any[]): string[] {
    const permissions = new Set<string>();

    for (const ur of userRoles) {
      if (ur.role.status === Status.ENABLED) {
        // 超级管理员拥有所有权限
        if (ur.role.key === 'admin') {
          permissions.add('*:*:*');
        }

        for (const rm of ur.role.menus) {
          if (rm.menu.status === Status.ENABLED) {
            // 如果有权限标识，直接使用
            if (rm.menu.perms) {
              permissions.add(rm.menu.perms);
            } else {
              // 为没有权限标识的菜单生成默认权限标识
              // 根据菜单类型和路径生成标准的权限标识
              const defaultPerm = this.generateDefaultPermission(rm.menu);
              if (defaultPerm) {
                permissions.add(defaultPerm);
              }
            }
          }
        }
      }
    }

    return Array.from(permissions);
  }

  private generateDefaultPermission(menu: any): string | null {
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

  private buildMenuTree(menus: any[], parentId = 0): any[] {
    return menus
      .filter((menu) => menu.parentId === parentId && menu.type !== 'BUTTON')
      .sort((a, b) => a.sort - b.sort)
      .map((menu) => ({
        id: menu.id,
        name: menu.name,
        path: menu.path,
        component: menu.component,
        icon: menu.icon,
        visible: menu.visible,
        children: this.buildMenuTree(menus, menu.id),
      }));
  }
}
