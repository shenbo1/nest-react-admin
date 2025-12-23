import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@/common/decorators';
import { CodegenService } from './codegen.service';
import { GenerateCodeDto } from './dto/generate-code.dto';

@ApiTags('代码生成')
@ApiBearerAuth()
@Controller('system/codegen')
export class CodegenController {
  constructor(private readonly codegenService: CodegenService) {}

  @Post('generate')
  @ApiOperation({ summary: '生成模块代码' })
  @RequirePermissions('system:codegen:generate')
  generate(@Body() dto: GenerateCodeDto) {
    return this.codegenService.generate(dto);
  }
}
