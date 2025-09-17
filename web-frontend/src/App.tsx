import { FC, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Button, Typography } from 'antd';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import LoginPage from './pages/Login';
import { useAuthStore } from './store/authStore';
import { LogoutOutlined } from '@ant-design/icons';
import ProductionOrders from './pages/ProductionOrders';
import ProductionPlanning from './pages/ProductionPlanning';
import ProductionPlanningCreate from './pages/ProductionPlanningCreate'; // <-- 1. 导入新页面
import ProductionMonitoring from './pages/ProductionMonitoring';
const { Title } = Typography;

const { Content } = Layout;

const AdminLayout: FC = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <Sidebar />
    <Layout>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<ProductionOrders />} />
          <Route path="/planning" element={<ProductionPlanning />} />
          <Route path="/planning/new" element={<ProductionPlanningCreate />} /> {/* <-- 2. 添加新路由 */}
          <Route path="/monitoring" element={<ProductionMonitoring />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Content>
    </Layout>
  </Layout>
);
// 员工视图 (占位符)
const WorkerLayout: FC = () => (
  <div style={{ padding: 40 }}>
      <Title level={2}>员工操作界面</Title>
      <p>这里将是员工的工作台。</p>
      <Button 
        type="primary" 
        danger 
        icon={<LogoutOutlined />}
        onClick={() => useAuthStore.getState().logout()}
      >
        退出登录
      </Button>
  </div>
);


const App: FC = () => {
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      {user?.role === 'admin' || user?.role === 'manager' ? <AdminLayout /> : <WorkerLayout />}
    </Router>
  );
};

export default App;