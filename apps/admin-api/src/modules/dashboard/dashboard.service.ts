import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStatistics() {
    const [userCount, roleCount, menuCount, deptCount, loginLogCount] =
      await Promise.all([
        this.prisma.sysUser.count(),
        this.prisma.sysRole.count(),
        this.prisma.sysMenu.count(),
        this.prisma.sysDept.count(),
        this.prisma.sysLoginLog.count(),
      ]);

    // 获取今日登录次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLoginCount = await this.prisma.sysLoginLog.count({
      where: {
        loginTime: {
          gte: today,
        },
      },
    });

    return {
      userCount,
      roleCount,
      menuCount,
      deptCount,
      loginLogCount,
      todayLoginCount,
    };
  }

  async getRecentLoginLogs(limit = 10) {
    return this.prisma.sysLoginLog.findMany({
      orderBy: { loginTime: "desc" },
      take: limit,
      select: {
        id: true,
        username: true,
        // ip: true,
        location: true,
        browser: true,
        os: true,
        status: true,
        msg: true,
        loginTime: true,
      },
    });
  }
}
