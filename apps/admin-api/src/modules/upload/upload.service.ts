import { Inject, Injectable } from '@nestjs/common';
import { ResponseDto } from '@/common/dto/response.dto';
import { appConfig, uploadConfig, type AppConfig, type UploadConfig } from '@/config';

@Injectable()
export class UploadService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly app: AppConfig,
    @Inject(uploadConfig.KEY)
    private readonly upload: UploadConfig,
  ) {}

  /**
   * 获取文件访问 URL
   * @param file 上传的文件
   * @param type 文件类型：'image' 图片 | 'file' 普通文件
   */
  getFileUrl(file: Express.Multer.File, type: 'image' | 'file' = 'image') {
    const baseUrl =
      this.upload.baseUrl || `http://localhost:${this.app.port ?? 3000}`;
    const prefix = this.app.prefix ?? 'api';

    // 图片使用 preview 路径，文件使用 file 路径
    const urlPath = type === 'image' ? 'preview' : 'file';
    const url = `${baseUrl}/${prefix}/upload/${urlPath}/${file.filename}`;

    return ResponseDto.success({
      url,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  }

  /**
   * 获取图片访问 URL（兼容旧接口）
   * @deprecated 使用 getFileUrl 代替
   */
  getImageUrl(file: Express.Multer.File) {
    return this.getFileUrl(file, 'image');
  }

  /**
   * 删除文件
   */
  remove(id: number) {
    // 这里可以实现删除数据库记录和文件的逻辑
    return ResponseDto.success({ success: true, message: '删除成功' }, '删除成功');
  }
}
