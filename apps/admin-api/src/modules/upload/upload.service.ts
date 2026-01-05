import { Inject, Injectable } from '@nestjs/common';
import { ResponseDto } from '@/common/dto/response.dto';
import { appConfig, uploadConfig, type AppConfig, type UploadConfig } from '@/config';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class UploadService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly app: AppConfig,
    @Inject(uploadConfig.KEY)
    private readonly upload: UploadConfig,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 解码文件名（处理中文乱码）
   */
  private decodeFileName(originalName: string): string {
    try {
      // 尝试解码 Latin1 编码的中文文件名
      return Buffer.from(originalName, 'latin1').toString('utf8');
    } catch {
      return originalName;
    }
  }

  /**
   * 获取文件访问 URL 并保存文件记录
   * @param file 上传的文件
   * @param type 文件类型：'image' 图片 | 'file' 普通文件
   * @param userId 上传人ID
   */
  async getFileUrl(
    file: Express.Multer.File,
    type: 'image' | 'file' = 'image',
    userId?: number,
  ) {
    const baseUrl =
      this.upload.baseUrl || `http://localhost:${this.app.port ?? 3000}`;
    const prefix = this.app.prefix ?? 'api';

    // 图片使用 preview 路径，文件使用 file 路径
    const urlPath = type === 'image' ? 'preview' : 'file';
    const url = `${baseUrl}/${prefix}/upload/${urlPath}/${file.filename}`;

    // 解码原始文件名（处理中文乱码）
    const decodedOriginalName = this.decodeFileName(file.originalname);

    // 保存文件记录到数据库
    await this.prisma.sysFile.create({
      data: {
        filename: file.filename,
        originalName: decodedOriginalName,
        mimetype: file.mimetype,
        size: file.size,
        url,
        fileType: type,
        uploadedBy: userId,
      },
    });

    return ResponseDto.success({
      url,
      filename: file.filename,
      originalname: decodedOriginalName,
      size: file.size,
      mimetype: file.mimetype,
    });
  }

  /**
   * 获取图片访问 URL（兼容旧接口）
   * @deprecated 使用 getFileUrl 代替
   */
  getImageUrl(file: Express.Multer.File, userId?: number) {
    return this.getFileUrl(file, 'image', userId);
  }

  /**
   * 删除文件
   */
  remove(id: number) {
    // 这里可以实现删除数据库记录和文件的逻辑
    return ResponseDto.success({ success: true, message: '删除成功' }, '删除成功');
  }
}
