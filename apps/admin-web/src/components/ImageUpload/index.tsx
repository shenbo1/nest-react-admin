import React, { useState, useEffect } from 'react';
import { Form, Upload, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { uploadImage } from '@/services/upload';

interface ImageUploadProps {
  name?: string;
  maxSize?: number; // MB
  limit?: number; // 最大图片数量
  reset?: boolean; // 重置信号
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  name = 'image',
  maxSize = 5,
  limit = 1,
  reset = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');

  // 监听重置信号
  useEffect(() => {
    if (reset) {
      setUploadedUrl('');
    }
  }, [reset]);

  return (
    <Form.Item noStyle shouldUpdate>
      {(form) => {
        // 获取表单值，如果上传过了就用本地的，否则用表单的
        const formValue = form.getFieldValue(name);
        const currentUrl = uploadedUrl || formValue || '';

        // 如果有值，转换为 UploadFile 格式
        const fileList: UploadFile[] = currentUrl
          ? [
              {
                uid: currentUrl,
                name: currentUrl.split('/').pop() || 'image',
                status: 'done' as const,
                url: currentUrl,
                response: { url: currentUrl },
              },
            ]
          : [];

        const handleUpload = async (file: File) => {
          setLoading(true);
          try {
            const res = await uploadImage(file);
            setUploadedUrl(res.url);
            form.setFieldValue(name, res.url);
            message.success('上传成功');
          } catch {
            message.error('上传失败');
          } finally {
            setLoading(false);
          }
        };

        const handleRemove = () => {
          setUploadedUrl('');
          form.setFieldValue(name, '');
        };

        const props: UploadProps = {
          accept: 'image/*',
          maxCount: limit,
          listType: 'picture-card',
          fileList,
          beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
              message.error('只能上传图片文件');
              return Upload.LIST_IGNORE;
            }
            const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
            if (!isLtMaxSize) {
              message.error(`图片大小不能超过 ${maxSize}MB`);
              return Upload.LIST_IGNORE;
            }
            handleUpload(file);
            return false; // 阻止默认上传行为
          },
          onRemove: handleRemove,
          onPreview: async (file) => {
            if (file.url) {
              window.open(file.url, '_blank');
            }
          },
        };

        return (
          <Spin spinning={loading}>
            <Upload {...props}>
              {fileList.length >= limit ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Spin>
        );
      }}
    </Form.Item>
  );
};
