import { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Drawer } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  LogoutOutlined,
  ShopOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../store/auth'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setDrawerVisible(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/roles',
      icon: <TeamOutlined />,
      label: '角色管理',
    },
    {
      key: '/permissions',
      icon: <LockOutlined />,
      label: '权限管理',
    },
    {
      key: '/customers',
      icon: <ShopOutlined />,
      label: '客户管理',
    },
  ]

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    } else if (key === 'profile') {
      navigate('/profile')
    } else {
      navigate(key)
      if (isMobile) {
        setDrawerVisible(false)
      }
    }
  }

  const renderMenu = () => (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
    />
  )

  return (
    <Layout className="min-h-screen">
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <Sider
          width={200}
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          className="hidden md:block"
        >
          <div
            className={`h-16 flex items-center ${collapsed ? 'justify-center' : 'justify-start pl-4'}`}
          >
            <h1 className={`${collapsed ? 'text-lg' : 'text-xl'} font-bold truncate`}>
              {collapsed ? 'ZY' : '后台管理系统'}
            </h1>
          </div>
          {renderMenu()}
        </Sider>
      )}
      <Layout>
        <Header className="bg-white p-0 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
                className="ml-4"
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="ml-4"
              />
            )}
            <h1 className="ml-4 text-lg font-medium md:hidden">后台管理系统</h1>
          </div>
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleMenuClick,
            }}
            placement="bottomRight"
          >
            <div className="flex items-center cursor-pointer px-4">
              <Avatar src={user?.avatar} icon={<UserOutlined />} />
              <span className="ml-2 max-w-[100px] truncate">{user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="p-4 md:p-6 bg-gray-50">
          <Outlet />
        </Content>
      </Layout>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title="后台管理系统"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {renderMenu()}
      </Drawer>
    </Layout>
  )
}

export default MainLayout
