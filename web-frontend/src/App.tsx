import { FC, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Styles from './pages/Styles';
import Tasks from './pages/Tasks';
import FabricRolls from './pages/FabricRolls';
import ProductionLogs from './pages/ProductionLogs';
import Workers from './pages/Workers';
import LoginPage from './pages/Login';
import { useAuthStore } from './store/authStore';

const { Content } = Layout;

const AdminLayout: FC = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <Sidebar />
    <Layout>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/styles" element={<Styles />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/fabric-rolls" element={<FabricRolls />} />
          <Route path="/production-logs" element={<ProductionLogs />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Content>
    </Layout>
  </Layout>
);

// 员工视图 (占位符)
const WorkerLayout: FC = () => (
    <div>
        <h1>员工操作界面</h1>
        <p>这里将是员工的工作台。</p>
        <button onClick={() => useAuthStore.getState().logout()}>退出登录</button>
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
      {user?.role === 'admin' ? <AdminLayout /> : <WorkerLayout />}
    </Router>
  );
};

export default App;