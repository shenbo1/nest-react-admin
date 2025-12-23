import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T = any> {
  @ApiProperty({ description: '状态码', example: 200 })
  code: number;

  @ApiProperty({ description: '消息', example: '操作成功' })
  message: string;

  @ApiProperty({ description: '数据' })
  data?: T;

  constructor(code: number, message: string, data?: T) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  static success<T>(data?: T, message = '操作成功'): ResponseDto<T> {
    return new ResponseDto(200, message, data);
  }

  static error(message: string, code = 500): ResponseDto {
    return new ResponseDto(code, message);
  }
}
