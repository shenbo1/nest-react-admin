import { Form, Input, Button, Card, message, notification, Checkbox, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login, LoginParams } from '@/services/system/auth';
import { useUserStore } from '@/stores/user';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setUserInfo } = useUserStore();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log('登录成功:', data);
      setToken(data.token);
      setUserInfo(data.user);
      message.success('登录成功');
      navigate(from, { replace: true });
    },
    onError: (error: any) => {
      console.error('登录失败 - 完整错误对象:', error);
      console.error('登录失败 - error.response:', error.response);
      console.error('登录失败 - error.response?.data:', error.response?.data);
      console.error('登录失败 - error.message:', error.message);

      // 同时使用notification和message来确保能显示
      const errorMsg = error.response?.data?.message ||
                      error.message ||
                      (error.response?.status === 401 ? '用户名或密码错误' : '登录失败，请检查用户名和密码');

      console.log('准备显示错误消息:', errorMsg);

      // 使用notification
      notification.error({
        message: '登录失败',
        description: errorMsg,
        duration: 4,
        placement: 'top',
      });

      // 也使用message作为备选
      setTimeout(() => {
        message.error(errorMsg);
      }, 100);

      // 临时方案：直接修改DOM显示错误
      setTimeout(() => {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #ff4d4f;
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          font-size: 14px;
          max-width: 500px;
          text-align: center;
        `;
        errorDiv.textContent = errorMsg;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
          }
        }, 4000);
      }, 200);
    },
  });

  const onFinish = (values: LoginParams) => {
    console.log('表单提交 - onFinish 被调用:', values);
    console.log('当前URL:', window.location.href);
    console.log('mutation状态:', loginMutation.status);

    // 确保不会刷新页面
    loginMutation.mutate(values, {
      onError: (error) => {
        console.log('mutation 错误回调触发:', error);
        console.log('错误详情:', {
          name: error.name,
          message: error.message,
          response: error.response,
          status: error.response?.status
        });
      }
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 左侧装饰区域 */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 60,
          position: 'relative',
        }}
      >
        {/* 装饰性圆圈 */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '10%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' }}>
          <SafetyCertificateOutlined style={{ fontSize: 80, marginBottom: 24 }} />
          <Title level={2} style={{ color: '#fff', marginBottom: 16 }}>
            企业级后台管理系统
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16 }}>
            基于 NestJS + React + Ant Design 构建
          </Text>
          <div style={{ marginTop: 40 }}>
            <Space orientation="vertical" size={12}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                ✓ 完整的权限管理体系
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                ✓ 灵活的菜单配置
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                ✓ 多角色数据隔离
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                ✓ 操作日志审计
              </Text>
            </Space>
          </div>
        </div>
      </div>

      {/* 右侧登录表单区域 */}
      <div
        style={{
          width: 500,
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
        }}
      >
        <div style={{ marginBottom: 48 }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            欢迎登录
          </Title>
          <Text type="secondary">请输入您的账号信息</Text>
        </div>

        <Form
          name="login"
          initialValues={{ username: 'admin', password: 'admin123', remember: true }}
          onFinish={onFinish}
          onFinishFailed={(errorInfo) => {
            console.log('表单验证失败:', errorInfo);
          }}
          size="large"
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入用户名"
              autoComplete="username"
              style={{ height: 48, borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入密码"
              autoComplete="current-password"
              style={{ height: 48, borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <a style={{ color: '#1890ff' }}>忘记密码?</a>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loginMutation.isPending}
              block
              style={{ height: 48, borderRadius: 8, fontSize: 16 }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <Card
          size="small"
          style={{
            marginTop: 24,
            background: '#f6f8fa',
            borderRadius: 8,
            border: '1px solid #e8e8e8',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            演示账号: admin / admin123
          </Text>
        </Card>

        <div style={{ marginTop: 'auto', paddingTop: 40, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            © 2024 Nest React Admin. All Rights Reserved.
          </Text>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
