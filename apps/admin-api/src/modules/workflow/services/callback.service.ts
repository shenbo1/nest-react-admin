import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { BusinessCallback, CallbackPayload } from '../types/callback.types';

/**
 * 业务回调服务
 * 注意：此服务依赖 @nestjs/axios，需要安装依赖后才能使用 HTTP 请求功能
 */
@Injectable()
export class CallbackService {
  private readonly logger = new Logger(CallbackService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 执行业务回调
   */
  async executeCallback(
    flowInstanceId: number,
    eventType: string,
    _payload: CallbackPayload,
    callbacks: BusinessCallback[],
  ): Promise<void> {
    // TODO: 等待添加 @nestjs/axios 依赖后启用完整功能
    this.logger.warn('业务回调功能暂时不可用，请安装 @nestjs/axios 依赖');

    // 记录流程日志
    await this.prisma.wfFlowLog.create({
      data: {
        flowInstanceId,
        action: 'AUTO' as any,
        operatorId: 0,
        operatorName: '系统',
        comment: `触发事件: ${eventType}，回调功能待启用`,
        detail: {
          eventType,
          callbackCount: callbacks.length,
        },
      },
    });
  }

  /**
   * 获取流程的回调配置
   */
  async getCallbacksForFlow(_flowDefinitionId: number): Promise<BusinessCallback[]> {
    // 从流程定义中获取回调配置
    // 目前暂时返回空数组，等待回调配置完善
    return [];
  }
}
