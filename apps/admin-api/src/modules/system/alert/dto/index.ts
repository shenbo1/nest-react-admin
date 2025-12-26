import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum AlertRuleType {
  CPU = 'CPU',
  MEMORY = 'MEMORY',
  DISK = 'DISK',
  API_ERROR_RATE = 'API_ERROR_RATE',
  API_RESPONSE_TIME = 'API_RESPONSE_TIME',
  LOGIN_FAIL = 'LOGIN_FAIL',
  DB_CONNECTION = 'DB_CONNECTION',
}

export enum AlertCondition {
  GT = 'GT',   // 大于
  LT = 'LT',   // 小于
  EQ = 'EQ',   // 等于
  GTE = 'GTE', // 大于等于
  LTE = 'LTE', // 小于等于
}

export enum AlertLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum AlertStatus {
  PENDING = 'PENDING',         // 待处理
  ACKNOWLEDGED = 'ACKNOWLEDGED', // 已确认
  RESOLVED = 'RESOLVED',       // 已解决
}

export class CreateAlertRuleDto {
  @ApiProperty({ description: '规则名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '规则类型', enum: AlertRuleType })
  @IsEnum(AlertRuleType)
  type: AlertRuleType;

  @ApiProperty({ description: '触发条件', enum: AlertCondition })
  @IsEnum(AlertCondition)
  condition: AlertCondition;

  @ApiProperty({ description: '阈值' })
  @IsNumber()
  threshold: number;

  @ApiPropertyOptional({ description: '告警级别', enum: AlertLevel, default: AlertLevel.WARNING })
  @IsOptional()
  @IsEnum(AlertLevel)
  level?: AlertLevel;

  @ApiPropertyOptional({ description: '通知方式(逗号分隔): EMAIL, SMS, WEBHOOK' })
  @IsOptional()
  @IsString()
  notifyType?: string;

  @ApiPropertyOptional({ description: 'Webhook URL' })
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: '邮件接收人(逗号分隔)' })
  @IsOptional()
  @IsString()
  emailTo?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: '静默时间(分钟)', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  silenceMins?: number;
}

export class UpdateAlertRuleDto extends PartialType(CreateAlertRuleDto) {}

export class HandleAlertDto {
  @ApiProperty({ description: '状态', enum: AlertStatus })
  @IsEnum(AlertStatus)
  status: AlertStatus;

  @ApiPropertyOptional({ description: '处理备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryAlertDto {
  @ApiPropertyOptional({ description: '告警级别', enum: AlertLevel })
  @IsOptional()
  @IsEnum(AlertLevel)
  level?: AlertLevel;

  @ApiPropertyOptional({ description: '状态', enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional({ description: '规则ID' })
  @IsOptional()
  @IsNumber()
  ruleId?: number;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  pageSize?: number;
}
