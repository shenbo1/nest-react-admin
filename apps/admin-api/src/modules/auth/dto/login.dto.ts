import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class LoginDto {
  @ApiProperty({ description: "用户名", example: "admin" })
  @IsNotEmpty({ message: "用户名不能为空" })
  @IsString()
  username: string;

  @ApiProperty({ description: "密码", example: "admin123" })
  @IsNotEmpty({ message: "密码不能为空" })
  @IsString()
  @MinLength(6, { message: "密码长度不能少于6位" })
  password: string;

  @ApiPropertyOptional({ description: "验证码" })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: "验证码唯一标识" })
  @IsOptional()
  @IsString()
  uuid?: string;

  @ApiPropertyOptional({ description: "记住我" })
  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}
