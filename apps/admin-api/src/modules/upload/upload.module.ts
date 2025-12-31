import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

// 获取上传目录的绝对路径
const getUploadDir = (subDir?: string) => {
  // 检测当前工作目录
  const cwd = process.cwd();
  let baseDir: string;

  // 优先使用环境变量
  if (process.env.UPLOAD_DIR) {
    baseDir = process.env.UPLOAD_DIR;
  } else if (existsSync(join(cwd, 'apps/admin-api'))) {
    // 从项目根目录启动
    baseDir = join(cwd, 'apps/admin-api/public/uploads');
  } else {
    // 从 apps/admin-api 目录启动
    baseDir = join(cwd, 'public/uploads');
  }

  const uploadDir = subDir ? join(baseDir, subDir) : baseDir;

  // 确保目录存在
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  return uploadDir;
};

// 图片上传目录
export const UPLOAD_DIR = getUploadDir();
// 文件上传目录
export const FILE_UPLOAD_DIR = getUploadDir('files');

// 允许的图片类型
const IMAGE_MIMETYPES = /\/(jpg|jpeg|png|gif|webp|svg\+xml)$/;
// 允许的文件类型（文档、压缩包等）
const FILE_MIMETYPES = /\/(pdf|msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation)|vnd\.ms-(excel|powerpoint)|plain|csv|zip|x-rar-compressed|x-7z-compressed)$/;

console.log('[Upload] 图片上传目录:', UPLOAD_DIR);
console.log('[Upload] 文件上传目录:', FILE_UPLOAD_DIR);

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          // 根据请求路径选择上传目录
          const isFileUpload = req.path.includes('/file');
          cb(null, isFileUpload ? FILE_UPLOAD_DIR : UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}

// 导出文件类型验证函数
export const isImageFile = (mimetype: string) => IMAGE_MIMETYPES.test(mimetype);
export const isAllowedFile = (mimetype: string) => IMAGE_MIMETYPES.test(mimetype) || FILE_MIMETYPES.test(mimetype);
