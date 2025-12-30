import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  WfNodeConfig,
  WfAssigneeType,
  WfEmptyAssigneeAction,
  WfNodeType,
  WfTaskStatus,
  WfLogAction,
  WfInstanceStatus,
} from '@prisma/client';
import { AssigneeInfo, FlowNode } from '../types';

@Injectable()
export class AssigneeResolverService {
  private readonly logger = new Logger(AssigneeResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 生成任务编号
   */
  private generateTaskNo(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TK${dateStr}${random}`;
  }

  /**
   * 解析审批人
   */
  async resolve(
    nodeConfig: WfNodeConfig | undefined,
    initiatorId: number,
    initiatorDeptId: number | null | undefined,
    formData: Record<string, unknown>,
  ): Promise<AssigneeInfo[]> {
    if (!nodeConfig?.assigneeType) {
      return [];
    }

    const config = nodeConfig.assigneeConfig as Record<string, unknown> | null;

    switch (nodeConfig.assigneeType) {
      case WfAssigneeType.ROLE:
        return this.resolveByRole(config?.roleIds as number[] | undefined);

      case WfAssigneeType.DEPT_LEADER:
        return this.resolveByDeptLeader(initiatorDeptId);

      case WfAssigneeType.SPECIFIC_USER:
        return this.resolveBySpecificUser(config?.userIds as number[] | undefined);

      case WfAssigneeType.INITIATOR_LEADER:
        return this.resolveByInitiatorLeader(initiatorId);

      case WfAssigneeType.FORM_FIELD:
        return this.resolveByFormField(
          formData,
          config?.fieldName as string | undefined,
        );

      default:
        return [];
    }
  }

  /**
   * 按角色解析审批人
   */
  private async resolveByRole(roleIds?: number[]): Promise<AssigneeInfo[]> {
    if (!roleIds?.length) {
      return [];
    }

    const users = await this.prisma.sysUser.findMany({
      where: {
        deleted: false,
        status: 'ENABLED',
        roles: {
          some: {
            roleId: { in: roleIds },
          },
        },
      },
      include: { dept: true },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.nickname || u.username,
      deptId: u.deptId ?? undefined,
      deptName: u.dept?.name,
    }));
  }

  /**
   * 按部门领导解析审批人
   */
  private async resolveByDeptLeader(
    deptId: number | null | undefined,
  ): Promise<AssigneeInfo[]> {
    if (!deptId) {
      return [];
    }

    const dept = await this.prisma.sysDept.findFirst({
      where: { id: deptId, deleted: false },
    });

    if (!dept?.leader) {
      return [];
    }

    // 查找领导用户
    const leader = await this.prisma.sysUser.findFirst({
      where: {
        OR: [{ username: dept.leader }, { nickname: dept.leader }],
        deleted: false,
        status: 'ENABLED',
      },
      include: { dept: true },
    });

    if (!leader) {
      return [];
    }

    return [
      {
        id: leader.id,
        name: leader.nickname || leader.username,
        deptId: leader.deptId ?? undefined,
        deptName: leader.dept?.name,
      },
    ];
  }

  /**
   * 按指定人员解析审批人
   */
  private async resolveBySpecificUser(
    userIds?: number[],
  ): Promise<AssigneeInfo[]> {
    if (!userIds?.length) {
      return [];
    }

    const users = await this.prisma.sysUser.findMany({
      where: {
        id: { in: userIds },
        deleted: false,
        status: 'ENABLED',
      },
      include: { dept: true },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.nickname || u.username,
      deptId: u.deptId ?? undefined,
      deptName: u.dept?.name,
    }));
  }

  /**
   * 按发起人上级解析审批人
   */
  private async resolveByInitiatorLeader(
    initiatorId: number,
  ): Promise<AssigneeInfo[]> {
    const initiator = await this.prisma.sysUser.findFirst({
      where: { id: initiatorId, deleted: false },
      include: { dept: true },
    });

    if (!initiator?.deptId) {
      return [];
    }

    // 获取发起人部门的领导
    return this.resolveByDeptLeader(initiator.deptId);
  }

  /**
   * 从表单字段解析审批人
   */
  private async resolveByFormField(
    formData: Record<string, unknown>,
    fieldName?: string,
  ): Promise<AssigneeInfo[]> {
    if (!fieldName) {
      return [];
    }

    const value = formData[fieldName];
    if (!value) {
      return [];
    }

    const userIds = Array.isArray(value) ? value : [value];
    return this.resolveBySpecificUser(userIds.map((v) => Number(v)));
  }

  /**
   * 处理审批人为空的情况
   */
  async handleEmptyAssignee(
    instanceId: number,
    node: FlowNode,
    nodeConfig: WfNodeConfig | undefined,
  ) {
    const action = nodeConfig?.emptyAssigneeAction || WfEmptyAssigneeAction.ERROR;

    this.logger.warn(
      `节点 ${node.id} 审批人为空，处理策略: ${action}`,
    );

    switch (action) {
      case WfEmptyAssigneeAction.SKIP:
        // 跳过该节点，自动通过（由 engine.service 推进流程）
        await this.prisma.wfFlowLog.create({
          data: {
            flowInstanceId: instanceId,
            nodeId: node.id,
            nodeName: nodeConfig?.nodeName || node.data.label,
            action: WfLogAction.AUTO,
            comment: '审批人为空，自动跳过',
          },
        });
        break;

      case WfEmptyAssigneeAction.TO_ADMIN:
        // 转给管理员
        await this.assignToAdmin(instanceId, node, nodeConfig);
        break;

      case WfEmptyAssigneeAction.ERROR:
      default:
        // 报错终止流程
        await this.prisma.$transaction(async (tx) => {
          await tx.wfFlowInstance.update({
            where: { id: instanceId },
            data: {
              status: WfInstanceStatus.TERMINATED,
              endTime: new Date(),
              resultRemark: `节点 ${nodeConfig?.nodeName || node.data.label} 找不到审批人`,
            },
          });

          await tx.wfFlowLog.create({
            data: {
              flowInstanceId: instanceId,
              nodeId: node.id,
              nodeName: nodeConfig?.nodeName || node.data.label,
              action: WfLogAction.TERMINATE,
              comment: '审批人为空，流程终止',
            },
          });
        });
        break;
    }
  }

  /**
   * 转给管理员处理
   */
  private async assignToAdmin(
    instanceId: number,
    node: FlowNode,
    nodeConfig: WfNodeConfig | undefined,
  ) {
    const admins = await this.prisma.sysUser.findMany({
      where: {
        deleted: false,
        status: 'ENABLED',
        roles: {
          some: {
            role: { key: 'admin', deleted: false },
          },
        },
      },
      include: { dept: true },
      take: 1,
    });

    if (admins.length > 0) {
      const admin = admins[0];
      await this.prisma.wfTask.create({
        data: {
          taskNo: this.generateTaskNo(),
          flowInstanceId: instanceId,
          nodeId: node.id,
          nodeName: nodeConfig?.nodeName || node.data.label,
          nodeType: WfNodeType.APPROVAL,
          status: WfTaskStatus.PENDING,
          assigneeId: admin.id,
          assigneeName: admin.nickname || admin.username,
          assigneeDeptId: admin.deptId,
          assigneeDeptName: admin.dept?.name,
        },
      });

      await this.prisma.wfFlowLog.create({
        data: {
          flowInstanceId: instanceId,
          nodeId: node.id,
          nodeName: nodeConfig?.nodeName || node.data.label,
          action: WfLogAction.AUTO,
          comment: `审批人为空，自动转给管理员 ${admin.nickname || admin.username}`,
        },
      });
    }
  }
}
