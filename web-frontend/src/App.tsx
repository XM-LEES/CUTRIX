import { FC } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Styles from './pages/Styles'
import Tasks from './pages/Tasks'
import FabricRolls from './pages/FabricRolls'
import ProductionLogs from './pages/ProductionLogs'
import Workers from './pages/Workers'

const { Content } = Layout

const App: FC = () => {
  return (
    <Router>
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
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  )
}

export default App