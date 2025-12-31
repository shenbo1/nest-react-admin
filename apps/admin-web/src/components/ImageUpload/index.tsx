import React, { useState, useEffect, useCallback } from 'react';
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

// 将 URL 转换为 UploadFile 格式
const urlToFileList = (url: string): UploadFile[] => {
  if (!url) return [];
  return [
    {
      uid: url,
      name: url.split('/').pop() || 'image',
      status: 'done' as const,
      url: url,
      thumbUrl: url,
    },
  ];
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  name = 'image',
  maxSize = 5,
  limit = 1,
  reset = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [initialized, setInitialized] = useState(false);

  // 监听重置信号
  useEffect(() => {
    if (reset) {
      setFileList([]);
      setInitialized(false);
    }
  }, [reset]);

  // 初始化表单值的回调
  const initFromFormValue = useCallback((formValue: string) => {
    if (!initialized && formValue) {
      setFileList(urlToFileList(formValue));
      setInitialized(true);
    }
  }, [initialized]);

  const handleUpload = useCallback(async (file: File, form: any) => {
    setLoading(true);
    try {
      const res = await uploadImage(file);
      const newFileList = urlToFileList(res.url);
      setFileList(newFileList);
      form.setFieldValue(name, res.url);
      message.success('上传成功');
    } catch {
      message.error('上传失败');
    } finally {
      setLoading(false);
    }
  }, [name]);

  const handleRemove = useCallback((form: any) => {
    setFileList([]);
    form.setFieldValue(name, '');
  }, [name]);

  return (
    <Form.Item noStyle shouldUpdate={(prev, cur) => prev[name] !== cur[name]}>
      {(form) => {
        const formValue = form.getFieldValue(name);

        // 初始化（编辑模式下同步表单值）
        if (!initialized && formValue && fileList.length === 0) {
          // 使用 setTimeout 避免在 render 中直接调用 setState
          setTimeout(() => initFromFormValue(formValue), 0);
        }

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
            handleUpload(file, form);
            return false;
          },
          onRemove: () => handleRemove(form),
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
