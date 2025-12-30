import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, MaxLength, IsInt, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class ApproveTaskDto {
  @ApiPropertyOptional({ description: '审批意见' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;

  @ApiPropertyOptional({ description: '表单数据（可修改的字段）' })
  @IsObject()
  @IsOptional()
  formData?: Record<string, unknown>;
}

export class RejectTaskDto {
  @ApiPropertyOptional({ description: '驳回原因' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}

export class TransferTaskDto {
  @ApiProperty({ description: '转办目标用户ID' })
  @IsInt()
  @Type(() => Number)
  targetUserId: number;

  @ApiPropertyOptional({ description: '转办原因' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}

export class CountersignTaskDto {
  @ApiProperty({ description: '加签用户ID列表' })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  @Type(() => Number)
  userIds: number[];

  @ApiPropertyOptional({ description: '加签原因' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}
