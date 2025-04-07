import { useState, useEffect } from 'react'
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Drawer,
  Badge,
  Tooltip,
  Space,
  message,
} from 'antd'
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
  BellOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
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

  // 模拟通知数量
  const [notificationCount, setNotificationCount] = useState(5)

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
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账号设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  const notificationMenuItems: MenuProps['items'] = [
    {
      key: 'notification1',
      label: '有新的客户信息需要处理',
    },
    {
      key: 'notification2',
      label: '系统更新通知',
    },
    {
      key: 'notification3',
      label: '欢迎使用中岳会计系统',
    },
    {
      type: 'divider',
    },
    {
      key: 'viewAll',
      label: '查看全部通知',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    } else if (key === 'profile') {
      navigate('/profile')
    } else if (key === 'settings') {
      // 跳转到账号设置页面
      message.info('账号设置功能即将上线')
    } else if (key === 'viewAll') {
      // 跳转到通知中心
      message.info('通知中心功能即将上线')
    } else if (key.startsWith('notification')) {
      // 处理通知点击事件
      setNotificationCount(prevCount => Math.max(0, prevCount - 1))
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

  // 获取用户角色显示
  const getRoleTag = () => {
    let roleName = '普通用户'

    // 从字符串数组中获取角色名称
    if (user && user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      roleName = user.roles[0] || '普通用户'
    }

    let color = ''

    if (roleName === '管理员' || roleName === 'admin') {
      color = '#f50'
    } else if (roleName === '财务主管') {
      color = '#108ee9'
    } else if (roleName === '会计') {
      color = '#87d068'
    } else {
      color = '#999999' // 默认颜色
    }

    return (
      <span
        className="text-xs px-1 py-0.5 rounded"
        style={{ backgroundColor: color, color: 'white' }}
      >
        {roleName}
      </span>
    )
  }

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

          <div className="flex items-center">
            {/* 帮助按钮 */}
            {!isMobile && (
              <Tooltip title="帮助中心">
                <Button
                  type="text"
                  icon={<QuestionCircleOutlined />}
                  onClick={() => message.info('帮助中心功能即将上线')}
                  className="mx-2"
                />
              </Tooltip>
            )}

            {/* 通知中心 */}
            <Dropdown
              menu={{
                items: notificationMenuItems,
                onClick: handleMenuClick,
              }}
              placement="bottomRight"
              arrow={{ pointAtCenter: true }}
            >
              <div className="mx-3 cursor-pointer">
                <Badge count={notificationCount} size="small">
                  <BellOutlined className="text-lg" />
                </Badge>
              </div>
            </Dropdown>

            {/* 用户信息下拉菜单 */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleMenuClick,
              }}
              placement="bottomRight"
              arrow={{ pointAtCenter: true }}
            >
              <div className="flex items-center cursor-pointer px-4 py-2 hover:bg-gray-50 rounded-md">
                <Avatar
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  className="border-2 border-blue-100"
                  style={{ backgroundColor: user?.avatar ? 'transparent' : '#1890ff' }}
                />
                {!isMobile && (
                  <div className="ml-2 flex flex-col justify-center">
                    <div className="flex items-center">
                      <span className="font-medium mr-1">{user?.username}</span>
                      {getRoleTag()}
                    </div>
                    <span className="text-xs text-gray-500">{user?.nickname || '欢迎回来'}</span>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
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
