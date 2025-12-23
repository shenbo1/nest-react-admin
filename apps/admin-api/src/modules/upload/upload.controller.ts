import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
  Res,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { UploadService } from './upload.service';
import { RequirePermissions } from '@/common/decorators';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 上传图片
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions('upload:image')
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.getImageUrl(file);
  }

  /**
   * 预览图片
   */
  @Get('preview/:filename')
  previewImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'public/uploads', filename);
    if (existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: '图片不存在' });
    }
  }

  /**
   * 删除图片
   */
  @Delete(':id')
  @RequirePermissions('upload:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.uploadService.remove(id);
  }
}
