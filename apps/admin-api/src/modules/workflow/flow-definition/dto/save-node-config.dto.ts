import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsInt,
  IsArray,
  ValidateNested,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  WfNodeType,
  WfApprovalType,
  WfAssigneeType,
  WfEmptyAssigneeAction,
  WfTimeoutAction,
  Prisma,
} from '@prisma/client';

export class NodeConfigDto {
  @ApiProperty({ description: '节点ID' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nodeId: string;

  @ApiProperty({ description: '节点类型', enum: WfNodeType })
  @IsEnum(WfNodeType)
  nodeType: WfNodeType;

  @ApiProperty({ description: '节点名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nodeName: string;

  @ApiPropertyOptional({ description: '审批方式', enum: WfApprovalType })
  @IsEnum(WfApprovalType)
  @IsOptional()
  approvalType?: WfApprovalType;

  @ApiPropertyOptional({ description: '审批人选择方式', enum: WfAssigneeType })
  @IsEnum(WfAssigneeType)
  @IsOptional()
  assigneeType?: WfAssigneeType;

  @ApiPropertyOptional({ description: '审批人配置' })
  @IsObject()
  @IsOptional()
  assigneeConfig?: Prisma.InputJsonValue;

  @ApiPropertyOptional({
    description: '审批人为空处理策略',
    enum: WfEmptyAssigneeAction,
  })
  @IsEnum(WfEmptyAssigneeAction)
  @IsOptional()
  emptyAssigneeAction?: WfEmptyAssigneeAction;

  @ApiPropertyOptional({ description: '条件表达式' })
  @IsObject()
  @IsOptional()
  conditionExpr?: Prisma.InputJsonValue;

  @ApiPropertyOptional({ description: '表单字段权限' })
  @IsObject()
  @IsOptional()
  formPerms?: Prisma.InputJsonValue;

  @ApiPropertyOptional({ description: '超时时间（分钟）' })
  @IsInt()
  @IsOptional()
  timeLimit?: number;

  @ApiPropertyOptional({ description: '超时处理方式', enum: WfTimeoutAction })
  @IsEnum(WfTimeoutAction)
  @IsOptional()
  timeoutAction?: WfTimeoutAction;

  @ApiPropertyOptional({ description: '抄送配置' })
  @IsObject()
  @IsOptional()
  ccConfig?: Prisma.InputJsonValue;
}

export class SaveNodeConfigsDto {
  @ApiProperty({ description: '节点配置列表', type: [NodeConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NodeConfigDto)
  nodeConfigs: NodeConfigDto[];
}
