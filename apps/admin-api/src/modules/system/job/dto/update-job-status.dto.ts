import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Status } from '@prisma/client';

export class UpdateJobStatusDto {
  @ApiProperty({ description: '状态' })
  @IsEnum(Status)
  status: Status;
}
