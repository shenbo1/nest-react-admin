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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { UploadService } from './upload.service';
import { RequirePermissions, Public } from '@/common/decorators';
import { UPLOAD_DIR, FILE_UPLOAD_DIR, isImageFile, isAllowedFile } from './upload.module';

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
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }
    if (!isImageFile(file.mimetype)) {
      throw new BadRequestException('只支持 jpg、jpeg、png、gif、webp、svg 格式的图片');
    }
    return this.uploadService.getFileUrl(file, 'image');
  }

  /**
   * 上传文件（文档、压缩包等）
   */
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions('upload:file')
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    if (!isAllowedFile(file.mimetype)) {
      throw new BadRequestException('不支持该文件格式，允许的格式：图片、PDF、Word、Excel、PPT、TXT、CSV、ZIP、RAR、7Z');
    }
    return this.uploadService.getFileUrl(file, 'file');
  }

  /**
   * 预览图片（公开接口，不需要认证）
   */
  @Public()
  @Get('preview/:filename')
  previewImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(UPLOAD_DIR, filename);
    if (existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: '图片不存在', path: filePath });
    }
  }

  /**
   * 下载/预览文件（公开接口，不需要认证）
   */
  @Public()
  @Get('file/:filename')
  downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(FILE_UPLOAD_DIR, filename);
    if (existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: '文件不存在', path: filePath });
    }
  }

  /**
   * 删除文件
   */
  @Delete(':id')
  @RequirePermissions('upload:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.uploadService.remove(id);
  }
}
