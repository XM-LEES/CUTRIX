import React from 'react'
import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  TagsOutlined,
  UnorderedListOutlined,
  BlockOutlined,
  FileTextOutlined,
  TeamOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'

const { Sider } = Layout

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/orders',
      icon: <FileTextOutlined />, // 使用新图标
      label: '生产订单',
    },
    {
      key: '/planning',
      icon: <UnorderedListOutlined />,
      label: '生产计划',
    },
    {
      key: '/monitoring',
      icon: <BlockOutlined />,
      label: '进度监控',
    },
    {
      key: '/styles',
      icon: <TagsOutlined />,
      label: '基础数据', // 将款号等归入基础数据
    },
    {
      key: '/workers',
      icon: <TeamOutlined />,
      label: '员工管理',
    },
  ]

  // 新增：统一的菜单点击处理函数
  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
    } else {
      navigate(key)
    }
  }

  return (
    <Sider width={256} theme="dark">
      <div style={{ 
        height: '64px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
        borderBottom: '1px solid #434343'
      }}>
        CUTRIX 管理系统
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={handleMenuClick}
        items={[
          ...menuItems,
          { type: 'divider' }, // 添加分割线
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            danger: true, // 设置为危险操作项（红色）
          },
        ]}
      />
    </Sider>
  )
}

export default Sidebar