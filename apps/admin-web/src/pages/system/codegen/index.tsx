import { useState } from 'react';
import { Alert, Card, Form, List, message, Typography } from 'antd';
import { ProForm, ProFormDigit, ProFormText } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import PermissionButton from '@/components/PermissionButton';
import { SYSTEM } from '@/constants/permissions';
import { codegenApi, CodegenRequest, CodegenResult } from '@/services/system/system';

const { Title, Text } = Typography;

const CodegenPage: React.FC = () => {
  const [result, setResult] = useState<CodegenResult | null>(null);
  const [form] = Form.useForm<CodegenRequest>();

  const generateMutation = useMutation({
    mutationFn: (values: CodegenRequest) => codegenApi.generate(values),
    onSuccess: (data) => {
      setResult(data);
      message.success('生成成功');
    },
  });

  return (
    <div className="p-4 space-y-4">
      <Card title="代码生成">
        <Alert
          type="info"
          showIcon
          message="根据模块名生成后端、前端与配置参考文件"
          description="模块名仅支持小写字母、数字和连字符，生成后请按提示完成 Prisma 迁移与菜单/路由配置。"
          className="mb-4"
        />
        <ProForm<CodegenRequest>
          form={form}
          layout="horizontal"
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 14 }}
          initialValues={{ menuId: 200 }}
          submitter={false}
          onFinish={async (values) => {
            await generateMutation.mutateAsync(values);
            return true;
          }}
        >
          <ProFormText
            name="moduleName"
            label="模块名"
            placeholder="例如: article"
            rules={[
              { required: true, message: '请输入模块名' },
              {
                pattern: /^[a-z][a-z0-9-]*$/,
                message: '仅支持小写字母、数字和连字符，且必须以字母开头',
              },
            ]}
          />
          <ProFormText
            name="cnName"
            label="中文名"
            placeholder="默认: 模块名 + 管理"
          />
          <ProFormDigit
            name="menuId"
            label="菜单起始ID"
            fieldProps={{ precision: 0, min: 1 }}
          />
        </ProForm>
        <div className="ml-4">
          <PermissionButton
            type="primary"
            permission={SYSTEM.CODEGEN.GENERATE}
            loading={generateMutation.isPending}
            onClick={() => form.submit()}
          >
            生成模块代码
          </PermissionButton>
        </div>
      </Card>

      {result && (
        <Card title="生成结果">
          <div className="space-y-3">
            <Title level={5}>已创建文件</Title>
            <List
              size="small"
              dataSource={result.createdFiles}
              renderItem={(item) => (
                <List.Item>
                  <Text code>{item}</Text>
                </List.Item>
              )}
            />

            <Title level={5}>配置参考文件</Title>
            <List
              size="small"
              dataSource={result.configFiles}
              renderItem={(item) => (
                <List.Item>
                  <Text code>{item}</Text>
                </List.Item>
              )}
            />

            <Title level={5}>自动注册文件</Title>
            <List
              size="small"
              dataSource={result.updatedFiles}
              renderItem={(item) => (
                <List.Item>
                  <Text code>{item}</Text>
                </List.Item>
              )}
            />

            <Title level={5}>后续步骤</Title>
            <List
              size="small"
              dataSource={result.nextSteps}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default CodegenPage;
