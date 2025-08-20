// import React from 'react'
// import { Layout, Menu } from 'antd'
// import { useNavigate, useLocation } from 'react-router-dom'
// import {
//   DashboardOutlined,
//   TagsOutlined,
//   UnorderedListOutlined,
//   BlockOutlined,
//   FileTextOutlined,
//   TeamOutlined,
// } from '@ant-design/icons'

// const { Sider } = Layout

// const Sidebar: React.FC = () => {
//   const navigate = useNavigate()
//   const location = useLocation()

//   const menuItems = [
//     {
//       key: '/',
//       icon: <DashboardOutlined />,
//       label: '仪表板',
//     },
//     {
//       key: '/styles',
//       icon: <TagsOutlined />,
//       label: '款号管理',
//     },
//     {
//       key: '/tasks',
//       icon: <UnorderedListOutlined />,
//       label: '生产任务',
//     },
//     {
//       key: '/fabric-rolls',
//       icon: <BlockOutlined />,
//       label: '布匹管理',
//     },
//     {
//       key: '/production-logs',
//       icon: <FileTextOutlined />,
//       label: '生产记录',
//     },
//     {
//       key: '/workers',
//       icon: <TeamOutlined />,
//       label: '员工管理',
//     },
//   ]

//   return (
//     <Sider width={256} theme="dark">
//       <div style={{ 
//         height: '64px', 
//         display: 'flex', 
//         alignItems: 'center', 
//         justifyContent: 'center',
//         color: 'white',
//         fontSize: '18px',
//         fontWeight: 'bold',
//         borderBottom: '1px solid #434343'
//       }}>
//         CUTRIX 管理系统
//       </div>
//       <Menu
//         theme="dark"
//         mode="inline"
//         selectedKeys={[location.pathname]}
//         items={menuItems}
//         onClick={({ key }) => navigate(key)}
//       />
//     </Sider>
//   )
// }

// export default Sidebar

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
  LogoutOutlined, // <-- 新增：导入图标
} from '@ant-design/icons'
import { useAuthStore } from '../store/authStore' // <-- 新增：导入 auth store

const { Sider } = Layout

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout) // <-- 新增：获取 logout 方法

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/styles',
      icon: <TagsOutlined />,
      label: '款号管理',
    },
    {
      key: '/tasks',
      icon: <UnorderedListOutlined />,
      label: '生产任务',
    },
    {
      key: '/fabric-rolls',
      icon: <BlockOutlined />,
      label: '布匹管理',
    },
    {
      key: '/production-logs',
      icon: <FileTextOutlined />,
      label: '生产记录',
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
        onClick={handleMenuClick} // <-- 修改：使用新的点击处理器
        // 修改：直接在 items 属性中组合菜单项
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