import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/user';

interface AuthRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children, requiredPermission }) => {
  const token = useUserStore((state) => state.token);
  const hasPermission = useUserStore((state) => state.hasPermission);
  const location = useLocation();

  // 如果没有 token，重定向到登录页
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果需要权限检查
  if (requiredPermission) {
    const hasPerm = hasPermission(requiredPermission);
    if (!hasPerm) {
      return (
        <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
          <h2>403 - 没有权限访问此页面</h2>
          <p>请联系管理员开通相关权限</p>
          <p style={{ color: '#999', fontSize: '12px', marginTop: '20px' }}>
            所需权限：{requiredPermission}
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default AuthRoute;
