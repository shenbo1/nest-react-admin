import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseDto } from '@/common/dto/response.dto';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取图片访问 URL
   */
  getImageUrl(file: Express.Multer.File) {
    const baseUrl = this.configService.get('BASE_URL') || `http://localhost:${process.env.PORT || 3000}`;
    const url = `${baseUrl}/upload/preview/${file.filename}`;
    return ResponseDto.success({
      url,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  }

  /**
   * 删除图片
   */
  remove(id: number) {
    // 这里可以实现删除数据库记录和文件的逻辑
    return ResponseDto.success({ success: true, message: '删除成功' }, '删除成功');
  }
}
