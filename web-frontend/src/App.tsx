import { FC, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard'; // 这是管理员的
import Workers from './pages/Workers';
import LoginPage from './pages/Login';
import { useAuthStore } from './store/authStore';
import ProductionOrders from './pages/ProductionOrders';
import ProductionPlanning from './pages/ProductionPlanning';
import ProductionPlanningCreate from './pages/ProductionPlanningCreate';
import ProductionPlanningEdit from './pages/ProductionPlanningEdit';
import ProductionMonitoring from './pages/ProductionMonitoring';
import ProductionPlanDetail from './pages/ProductionPlanDetail';
// 引入员工端新页面
import WorkerDashboard from './pages/WorkerDashboard'; // 这是工人的
import TaskOperation from './pages/TaskOperation';

const { Content } = Layout;

// 管理员/主任布局
const AdminLayout: FC = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <Sidebar />
    <Layout>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} /> {/* 管理员首页 */}
          <Route path="/orders" element={<ProductionOrders />} />
          <Route path="/planning" element={<ProductionPlanning />} />
          <Route path="/planning/new" element={<ProductionPlanningCreate />} />
          <Route path="/planning/edit/:planId" element={<ProductionPlanningEdit />} />
          <Route path="/monitoring" element={<ProductionMonitoring />} />
          <Route path="/monitoring/:planId" element={<ProductionPlanDetail />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Content>
    </Layout>
  </Layout>
);

// 工人布局
const WorkerLayout: FC = () => (
    <Routes>
        <Route path="/" element={<WorkerDashboard />} /> {/* 工人首页 */}
        <Route path="/task/:planId" element={<TaskOperation />} />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
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
      {user?.role === 'admin' || user?.role === 'manager' 
        ? <AdminLayout /> 
        : <WorkerLayout /> // 根据角色渲染不同布局
      }
    </Router>
  );
};

export default App;