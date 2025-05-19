import { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Drawer, Badge, Tooltip, message, Tabs } from 'antd'
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
  ApartmentOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../store/auth'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

// 定义Tab类型
interface TabItem {
  key: string
  label: string
  icon?: React.ReactNode
  closable: boolean
}

// 创建tabs存储，用于保持组件状态
const useTabsStore = () => {
  const [tabs, setTabs] = useState<TabItem[]>([
    { key: '/', label: '仪表盘', icon: <DashboardOutlined />, closable: false },
  ])
  const [activeKey, setActiveKey] = useState('/')

  // 缓存组件状态的对象
  const [cachedViews] = useState<Record<string, boolean>>({
    '/': true,
  })

  // 添加新标签
  const addTab = (newTab: TabItem) => {
    setTabs(prev => {
      // 检查标签是否已存在
      if (!prev.some(tab => tab.key === newTab.key)) {
        return [...prev, newTab]
      }
      return prev
    })
    setActiveKey(newTab.key)
    cachedViews[newTab.key] = true
  }

  // 移除标签
  const removeTab = (targetKey: string) => {
    // 找出要删除的标签索引
    const targetIndex = tabs.findIndex(tab => tab.key === targetKey)

    // 删除标签
    const newTabs = tabs.filter(tab => tab.key !== targetKey)
    setTabs(newTabs)

    // 从缓存中删除视图
    delete cachedViews[targetKey]

    // 如果删除的是当前激活的标签，需要激活其他标签
    if (newTabs.length && activeKey === targetKey) {
      // 优先激活右侧标签，如果没有右侧标签则激活左侧标签
      const newActiveKey =
        newTabs[targetIndex === newTabs.length ? targetIndex - 1 : targetIndex].key
      setActiveKey(newActiveKey)
    }
  }

  // 检查视图是否被缓存
  const isCached = (key: string) => !!cachedViews[key]

  return { tabs, activeKey, setActiveKey, addTab, removeTab, isCached }
}

const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // 使用自定义的tabsStore
  const tabsStore = useTabsStore()

  // 模拟通知数量
  const [notificationCount] = useState(5)

  // 模拟通知数据
  const [notifications, setNotifications] = useState([
    { id: 1, title: '系统通知', content: '欢迎使用中岳会计系统' },
    { id: 2, title: '更新提醒', content: '系统已更新至最新版本' },
    { id: 3, title: '任务提醒', content: '您有3个待处理的任务' },
  ])

  // 基础菜单项
  const baseMenuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/customers',
      icon: <ShopOutlined />,
      label: '客户管理',
    },
    {
      key: '/expenses',
      icon: <DollarOutlined />,
      label: '费用管理',
    },
  ]

  // 系统管理菜单项
  const systemMenuItems: MenuProps['items'] = [
    {
      key: 'system',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
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
          key: '/departments',
          icon: <ApartmentOutlined />,
          label: '部门管理',
        },
      ],
    },
  ]

  // 根据用户角色过滤菜单项
  const menuItems: MenuProps['items'] = user?.roles.some(role =>
    ['super_admin', 'admin'].includes(role)
  )
    ? [...baseMenuItems, ...systemMenuItems]
    : baseMenuItems

  // 获取菜单项图标和标签
  const getMenuItemByKey = (key: string) => {
    // 递归查找所有菜单项，包括子菜单
    const findMenuItemRecursive = (items: MenuProps['items']): any => {
      if (!items) return null

      for (const item of items) {
        if (!item) continue

        if ('key' in item && item.key === key) {
          return item
        }

        // 检查子菜单
        if ('children' in item && item.children) {
          const found = findMenuItemRecursive(item.children)
          if (found) return found
        }
      }

      return null
    }

    return findMenuItemRecursive(menuItems)
  }

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

  // 跟踪路由变化，添加新标签
  useEffect(() => {
    const { pathname } = location

    // 根据当前路径找到对应的菜单项
    const currentMenuItem = getMenuItemByKey(pathname)

    if (currentMenuItem && 'label' in currentMenuItem) {
      // 添加新标签或切换到已有标签
      tabsStore.addTab({
        key: pathname,
        label: currentMenuItem.label as string,
        icon: 'icon' in currentMenuItem ? currentMenuItem.icon : undefined,
        closable: pathname !== '/', // 仪表盘不可关闭
      })
    }
  }, [location.pathname])

  // 检查用户状态，确保用户信息显示正确
  useEffect(() => {
    if (!user) {
      // 如果没有用户信息但有 token，可能需要重新获取用户信息
      const token = localStorage.getItem('token')
      if (token) {
        console.log('页面刷新后检测到 token 但没有用户信息，应该重新获取用户信息')
        // 如果是真实环境，这里可以调用 API 重新获取用户信息
        // fetchUserInfo(token)
      }
    } else {
      console.log('用户信息已加载:', user.username)
    }
  }, [user])

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
      // 先清除用户状态
      logout()
      // 然后进行导航
      navigate('/login', { replace: true })
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
      setNotifications(notifications.filter(n => n.id !== parseInt(key)))
    } else if (key === 'system') {
      // 系统管理主菜单，默认跳转到用户管理
      navigate('/users')
    } else {
      navigate(key)
      if (isMobile) {
        setDrawerVisible(false)
      }
    }
  }

  // 处理标签页变化
  const handleTabChange = (activeKey: string) => {
    tabsStore.setActiveKey(activeKey)
    navigate(activeKey)
  }

  // 处理关闭标签页
  const handleTabEdit = (
    targetKey: React.MouseEvent<Element> | React.KeyboardEvent<Element> | string,
    action: 'add' | 'remove'
  ) => {
    if (action === 'remove' && typeof targetKey === 'string') {
      // 找出要删除的标签所在位置和前后标签
      const currentTabs = tabsStore.tabs
      const targetIndex = currentTabs.findIndex(tab => tab.key === targetKey)

      // 关闭当前标签，需要激活其他标签
      if (tabsStore.activeKey === targetKey) {
        // 找出新的激活标签
        const newActiveIndex = targetIndex === 0 ? 0 : targetIndex - 1
        const newActiveKey = currentTabs[newActiveIndex].key
        navigate(newActiveKey)
      }

      // 移除标签
      tabsStore.removeTab(targetKey)
    }
  }

  // 自定义标签页标题，添加图标和关闭按钮
  const renderTabLabel = (tab: TabItem) => (
    <div className="flex items-center">
      {tab.icon && <span className="mr-1">{tab.icon}</span>}
      <span>{tab.label}</span>
    </div>
  )

  const renderMenu = () => (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      className="menu-container"
    />
  )

  return (
    <Layout className="min-h-screen layout-container">
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <Sider
          width={200}
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          className="hidden md:block sider-container"
          style={{
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 10,
            overflow: 'auto',
          }}
        >
          <div
            className={`h-16 flex items-center ${collapsed ? 'justify-center' : 'justify-start pl-4'}`}
          >
            <div className="flex items-center">
              <img
                src="/images/logo.png"
                alt="中岳会计"
                className={`${collapsed ? 'w-10' : 'w-32'} h-auto`}
              />
            </div>
          </div>
          {renderMenu()}
        </Sider>
      )}
      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 200,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          className="bg-white p-0 flex items-center justify-between shadow-sm"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 9,
            width: '100%',
          }}
        >
          <div className="flex items-center">
            {isMobile ? (
              <>
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setDrawerVisible(true)}
                  className="ml-4"
                />
                <div className="flex items-center ml-2">
                  <img src="/images/logo.png" alt="中岳会计" className="h-10 w-auto" />
                </div>
              </>
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="ml-4"
              />
            )}
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
                  style={{ backgroundColor: user?.avatar ? 'transparent' : '#1890ff' }}
                />
                {!isMobile && (
                  <div className="ml-2">
                    <div className="flex items-center">
                      <span className="font-medium">{user?.username}</span>
                    </div>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 添加标签页系统 */}
        <div className="bg-white border-b border-gray-200">
          <Tabs
            type="editable-card"
            activeKey={tabsStore.activeKey}
            onChange={handleTabChange}
            onEdit={handleTabEdit}
            items={tabsStore.tabs.map(tab => ({
              key: tab.key,
              label: renderTabLabel(tab),
              closable: tab.closable,
              children: null, // 标签内容由Outlet渲染
            }))}
            className="tabs-container px-4"
            hideAdd
          />
        </div>

        <Content
          className="p-4 md:p-6 bg-white content-container"
          style={{
            minHeight: 'calc(100vh - 64px - 48px)', // 减去header和tabs的高度
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title="后台管理系统"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        styles={{ body: { padding: 0 } }}
      >
        {renderMenu()}
      </Drawer>
    </Layout>
  )
}

export default MainLayout
