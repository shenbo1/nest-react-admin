import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class ShipPointExchangeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  expressCompany: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  expressNo: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
