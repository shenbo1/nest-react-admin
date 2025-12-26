import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
  HandleAlertDto,
  QueryAlertDto,
  AlertRuleType,
  AlertCondition,
  AlertLevel,
  AlertStatus,
} from './dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AlertService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // 初始化默认告警规则
    await this.initDefaultRules();
  }

  /**
   * 初始化默认告警规则
   */
  private async initDefaultRules() {
    const existingRules = await this.prisma.sysAlertRule.count();
    if (existingRules > 0) return;

    const defaultRules = [
      {
        name: 'CPU 使用率过高',
        type: AlertRuleType.CPU,
        condition: AlertCondition.GT,
        threshold: 80,
        level: AlertLevel.WARNING,
        silenceMins: 10,
      },
      {
        name: '内存使用率过高',
        type: AlertRuleType.MEMORY,
        condition: AlertCondition.GT,
        threshold: 85,
        level: AlertLevel.WARNING,
        silenceMins: 10,
      },
      {
        name: '磁盘使用率过高',
        type: AlertRuleType.DISK,
        condition: AlertCondition.GT,
        threshold: 90,
        level: AlertLevel.ERROR,
        silenceMins: 30,
      },
      {
        name: 'API 错误率过高',
        type: AlertRuleType.API_ERROR_RATE,
        condition: AlertCondition.GT,
        threshold: 5,
        level: AlertLevel.WARNING,
        silenceMins: 5,
      },
      {
        name: 'API 响应时间过长',
        type: AlertRuleType.API_RESPONSE_TIME,
        condition: AlertCondition.GT,
        threshold: 3000,
        level: AlertLevel.WARNING,
        silenceMins: 5,
      },
      {
        name: '登录失败次数过多',
        type: AlertRuleType.LOGIN_FAIL,
        condition: AlertCondition.GT,
        threshold: 10,
        level: AlertLevel.WARNING,
        silenceMins: 15,
      },
    ];

    await this.prisma.sysAlertRule.createMany({
      data: defaultRules,
    });
  }

  // ==================== 告警规则管理 ====================

  /**
   * 获取所有告警规则
   */
  async getRules() {
    return this.prisma.sysAlertRule.findMany({
      where: { deleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { alerts: { where: { deleted: false } } },
        },
      },
    });
  }

  /**
   * 获取单个告警规则
   */
  async getRule(id: number) {
    const rule = await this.prisma.sysAlertRule.findFirst({
      where: { id, deleted: false },
      include: {
        alerts: {
          where: { deleted: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!rule) {
      throw new NotFoundException('告警规则不存在');
    }

    return rule;
  }

  /**
   * 创建告警规则
   */
  async createRule(dto: CreateAlertRuleDto) {
    return this.prisma.sysAlertRule.create({
      data: dto,
    });
  }

  /**
   * 更新告警规则
   */
  async updateRule(id: number, dto: UpdateAlertRuleDto) {
    await this.getRule(id);

    return this.prisma.sysAlertRule.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * 删除告警规则（软删除）
   */
  async deleteRule(id: number) {
    await this.getRule(id);

    return this.prisma.sysAlertRule.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * 启用/禁用告警规则
   */
  async toggleRule(id: number, enabled: boolean) {
    await this.getRule(id);

    return this.prisma.sysAlertRule.update({
      where: { id },
      data: { enabled },
    });
  }

  // ==================== 告警事件管理 ====================

  /**
   * 获取告警事件列表
   */
  async getAlerts(query: QueryAlertDto) {
    const { level, status, ruleId, page = 1, pageSize = 20 } = query;

    const where: any = { deleted: false };
    if (level) where.level = level;
    if (status) where.status = status;
    if (ruleId) where.ruleId = ruleId;

    const [total, list] = await Promise.all([
      this.prisma.sysAlert.count({ where }),
      this.prisma.sysAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          rule: {
            select: { name: true, type: true },
          },
        },
      }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取告警统计
   */
  async getAlertStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [total, pending, today, byLevel] = await Promise.all([
      this.prisma.sysAlert.count({ where: { deleted: false } }),
      this.prisma.sysAlert.count({ where: { deleted: false, status: AlertStatus.PENDING } }),
      this.prisma.sysAlert.count({ where: { deleted: false, createdAt: { gte: todayStart } } }),
      this.prisma.sysAlert.groupBy({
        by: ['level'],
        where: { deleted: false },
        _count: true,
      }),
    ]);

    return {
      total,
      pending,
      today,
      byLevel: byLevel.map((b) => ({ level: b.level, count: b._count })),
    };
  }

  /**
   * 处理告警
   */
  async handleAlert(id: number, dto: HandleAlertDto, username: string) {
    const alert = await this.prisma.sysAlert.findFirst({ where: { id, deleted: false } });
    if (!alert) {
      throw new NotFoundException('告警事件不存在');
    }

    return this.prisma.sysAlert.update({
      where: { id },
      data: {
        status: dto.status,
        handledBy: username,
        handledAt: new Date(),
        handleRemark: dto.remark,
        updatedBy: username,
      },
    });
  }

  /**
   * 批量处理告警
   */
  async batchHandleAlerts(ids: number[], dto: HandleAlertDto, username: string) {
    return this.prisma.sysAlert.updateMany({
      where: { id: { in: ids }, deleted: false },
      data: {
        status: dto.status,
        handledBy: username,
        handledAt: new Date(),
        handleRemark: dto.remark,
        updatedBy: username,
      },
    });
  }

  /**
   * 删除告警事件（软删除）
   */
  async deleteAlert(id: number) {
    return this.prisma.sysAlert.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * 清理过期告警
   */
  async cleanupAlerts(daysToKeep: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.sysAlert.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: [AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED] },
      },
    });

    return { deleted: result.count };
  }

  // ==================== 告警触发逻辑 ====================

  /**
   * 触发告警
   */
  async triggerAlert(
    ruleId: number,
    currentValue: number,
    title: string,
    content: string,
  ) {
    const rule = await this.prisma.sysAlertRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || !rule.enabled) return null;

    // 检查静默期
    if (rule.lastTriggeredAt) {
      const silenceUntil = new Date(rule.lastTriggeredAt.getTime() + rule.silenceMins * 60 * 1000);
      if (new Date() < silenceUntil) {
        return null; // 在静默期内，不触发
      }
    }

    // 检查条件是否满足
    if (!this.checkCondition(currentValue, rule.condition, rule.threshold)) {
      return null;
    }

    // 创建告警事件
    const alert = await this.prisma.sysAlert.create({
      data: {
        ruleId,
        level: rule.level,
        title,
        content,
        currentValue,
        threshold: rule.threshold,
      },
    });

    // 更新规则最后触发时间
    await this.prisma.sysAlertRule.update({
      where: { id: ruleId },
      data: { lastTriggeredAt: new Date() },
    });

    // 发送通知
    await this.sendNotification(rule, alert);

    return alert;
  }

  /**
   * 检查条件是否满足
   */
  private checkCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case AlertCondition.GT:
        return value > threshold;
      case AlertCondition.LT:
        return value < threshold;
      case AlertCondition.EQ:
        return value === threshold;
      case AlertCondition.GTE:
        return value >= threshold;
      case AlertCondition.LTE:
        return value <= threshold;
      default:
        return false;
    }
  }

  /**
   * 发送通知
   */
  private async sendNotification(rule: any, alert: any) {
    if (!rule.notifyType) return;

    const notifyTypes = rule.notifyType.split(',').map((t: string) => t.trim());

    for (const type of notifyTypes) {
      switch (type) {
        case 'WEBHOOK':
          await this.sendWebhook(rule.webhookUrl, alert);
          break;
        case 'EMAIL':
          // TODO: 实现邮件通知
          console.log(`[Alert] 邮件通知: ${rule.emailTo}`);
          break;
        case 'SMS':
          // TODO: 实现短信通知
          console.log('[Alert] 短信通知');
          break;
      }
    }
  }

  /**
   * 发送 Webhook 通知
   */
  private async sendWebhook(url: string, alert: any) {
    if (!url) return;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: alert.level,
          title: alert.title,
          content: alert.content,
          currentValue: alert.currentValue,
          threshold: alert.threshold,
          createdAt: alert.createdAt,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      console.error('[Alert] Webhook 发送失败:', error);
    }
  }

  // ==================== 定时检查任务 ====================

  /**
   * 每分钟检查系统指标告警
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkSystemAlerts() {
    // 获取启用的系统指标规则
    const rules = await this.prisma.sysAlertRule.findMany({
      where: {
        enabled: true,
        type: { in: [AlertRuleType.CPU, AlertRuleType.MEMORY, AlertRuleType.DISK] },
      },
    });

    if (rules.length === 0) return;

    // 获取系统指标
    const os = await import('os');
    const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    for (const rule of rules) {
      let currentValue = 0;
      let title = '';
      let content = '';

      switch (rule.type) {
        case AlertRuleType.CPU:
          currentValue = cpuUsage;
          title = `CPU 使用率告警: ${currentValue.toFixed(1)}%`;
          content = `当前 CPU 使用率为 ${currentValue.toFixed(1)}%，已超过阈值 ${rule.threshold}%`;
          break;
        case AlertRuleType.MEMORY:
          currentValue = memoryUsage;
          title = `内存使用率告警: ${currentValue.toFixed(1)}%`;
          content = `当前内存使用率为 ${currentValue.toFixed(1)}%，已超过阈值 ${rule.threshold}%`;
          break;
        // DISK 需要额外处理，这里简化
      }

      if (currentValue > 0) {
        await this.triggerAlert(rule.id, currentValue, title, content);
      }
    }
  }

  /**
   * 每5分钟检查登录失败告警
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkLoginFailAlerts() {
    const rules = await this.prisma.sysAlertRule.findMany({
      where: {
        enabled: true,
        type: AlertRuleType.LOGIN_FAIL,
      },
    });

    if (rules.length === 0) return;

    // 获取最近5分钟的登录失败次数
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const failCount = await this.prisma.sysLoginLog.count({
      where: {
        status: '1',
        loginTime: { gte: fiveMinutesAgo },
      },
    });

    for (const rule of rules) {
      await this.triggerAlert(
        rule.id,
        failCount,
        `登录失败告警: ${failCount} 次`,
        `最近5分钟内登录失败 ${failCount} 次，已超过阈值 ${rule.threshold} 次`,
      );
    }
  }
}
