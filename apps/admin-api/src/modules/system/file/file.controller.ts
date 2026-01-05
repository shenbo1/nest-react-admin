import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FileService } from './file.service';
import { QueryFileDto } from './dto/query-file.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('system/file')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 分页查询文件列表
   */
  @Get()
  @RequirePermissions('system:file:list')
  findAll(@Query() query: QueryFileDto) {
    return this.fileService.findAll(query);
  }

  /**
   * 获取文件详情
   */
  @Get(':id')
  @RequirePermissions('system:file:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fileService.findOne(id);
  }

  /**
   * 删除文件
   */
  @Delete(':id')
  @RequirePermissions('system:file:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.fileService.remove(id, userId);
  }
}
