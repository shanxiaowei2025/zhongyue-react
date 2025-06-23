import React, { useState, useEffect, useCallback } from 'react'

// 扩展Window接口，添加自定义方法
declare global {
  interface Window {
    activateMenuTab?: (mainTabPath: string, targetPath: string) => boolean
  }
}
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
  FileTextOutlined,
  AppstoreOutlined,
  AuditOutlined,
  FileDoneOutlined,
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

interface ModuleState {
  lastPath: string        // 最后访问的路径
  defaultPath: string     // 默认路径
  label: string          // 模块名称
  icon: React.ReactNode  // 图标
}

// 模块配置
const MODULE_CONFIG: Record<string, {
  defaultPath: string
  label: string
  icon: React.ReactNode
  pathPatterns: string[]
}> = {
  '/contracts': {
    defaultPath: '/contracts',
    label: '合同管理',
    icon: <FileTextOutlined />,
    pathPatterns: ['/contracts']
  },
  '/customers': {
    defaultPath: '/customers',
    label: '客户管理',
    icon: <ShopOutlined />,
    pathPatterns: ['/customers']
  },
  '/expenses': {
    defaultPath: '/expenses',
    label: '费用管理',
    icon: <DollarOutlined />,
    pathPatterns: ['/expenses']
  },
  '/enterprise-service': {
    defaultPath: '/enterprise-service',
    label: '企业服务详情',
    icon: <AppstoreOutlined />,
    pathPatterns: ['/enterprise-service']
  },
  '/financial-self-inspection': {
    defaultPath: '/financial-self-inspection',
    label: '账务自查',
    icon: <AuditOutlined />,
    pathPatterns: ['/financial-self-inspection']
  },
  '/tax-review': {
    defaultPath: '/tax-review',
    label: '税务核查',
    icon: <FileDoneOutlined />,
    pathPatterns: ['/tax-review']
  },
  '/users': {
    defaultPath: '/users',
    label: '用户管理',
    icon: <UserOutlined />,
    pathPatterns: ['/users']
  },
  '/roles': {
    defaultPath: '/roles',
    label: '角色管理',
    icon: <TeamOutlined />,
    pathPatterns: ['/roles']
  },
  '/permissions': {
    defaultPath: '/permissions',
    label: '权限管理',
    icon: <LockOutlined />,
    pathPatterns: ['/permissions']
  },
  '/departments': {
    defaultPath: '/departments',
    label: '部门管理',
    icon: <ApartmentOutlined />,
    pathPatterns: ['/departments']
  },
}

// 创建增强版tabs存储，支持模块状态保持
const useTabsStore = () => {
  const [tabs, setTabs] = useState<TabItem[]>([
    { key: '/', label: '仪表盘', icon: <DashboardOutlined />, closable: false },
  ])
  const [activeKey, setActiveKey] = useState('/')

  // 缓存组件状态的对象
  const [cachedViews] = useState<Record<string, boolean>>({
    '/': true,
  })

  // 模块状态映射，支持持久化存储
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>(() => {
    // 尝试从 localStorage 恢复状态
    const savedStates = localStorage.getItem('moduleStates')
    if (savedStates) {
      try {
        const parsed = JSON.parse(savedStates)
        // 确保所有模块都有完整的状态
        const initialStates: Record<string, ModuleState> = {}
        Object.entries(MODULE_CONFIG).forEach(([moduleKey, config]) => {
          initialStates[moduleKey] = {
            lastPath: parsed[moduleKey]?.lastPath || config.defaultPath,
            defaultPath: config.defaultPath,
            label: config.label,
            icon: config.icon,
          }
        })
        console.log('📋 已从本地存储恢复模块状态:', initialStates)
        return initialStates
      } catch (error) {
        console.warn('⚠️ 恢复模块状态失败，使用默认状态:', error)
      }
    }

    // 初始化默认模块状态
    const initialStates: Record<string, ModuleState> = {}
    Object.entries(MODULE_CONFIG).forEach(([moduleKey, config]) => {
      initialStates[moduleKey] = {
        lastPath: config.defaultPath,
        defaultPath: config.defaultPath,
        label: config.label,
        icon: config.icon,
      }
    })
    return initialStates
  })

  // 更新模块状态并持久化保存
  const updateModuleState = useCallback((moduleKey: string, path: string) => {
    setModuleStates(prevStates => {
      // 检查是否真的需要更新（避免不必要的状态更新）
      if (prevStates[moduleKey]?.lastPath === path) {
        return prevStates
      }
      
      const newStates = {
        ...prevStates,
        [moduleKey]: {
          ...prevStates[moduleKey],
          lastPath: path,
        }
      }
      
      // 持久化保存到 localStorage（只保存必要的数据）
      const statesToSave: Record<string, { lastPath: string }> = {}
      Object.entries(newStates).forEach(([key, state]) => {
        statesToSave[key] = { lastPath: state.lastPath }
      })
      
      try {
        localStorage.setItem('moduleStates', JSON.stringify(statesToSave))
      } catch (error) {
        console.warn('⚠️ 保存模块状态失败:', error)
      }
      
      return newStates
    })
  }, [])

  // 获取模块的目标路径
  const getModuleTargetPath = useCallback((moduleKey: string): string => {
    const moduleState = moduleStates[moduleKey]
    return moduleState ? moduleState.lastPath : moduleKey
  }, [moduleStates])

  // 识别路径属于哪个模块
  const identifyModule = useCallback((pathname: string): string | null => {
    for (const [moduleKey, config] of Object.entries(MODULE_CONFIG)) {
      if (config.pathPatterns.some(pattern => pathname.startsWith(pattern))) {
        return moduleKey
      }
    }
    return null
  }, [])

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

  return { 
    tabs, 
    activeKey, 
    setActiveKey, 
    addTab, 
    removeTab, 
    isCached,
    moduleStates,
    updateModuleState,
    getModuleTargetPath,
    identifyModule
  }
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

  // 检查用户是否有企业服务权限
  const hasEnterpriseServicePermission = () => {
    if (!user?.roles || !Array.isArray(user.roles)) {
      return false
    }
    
    // 允许访问企业服务的角色
    const allowedRoles = ['super_admin', 'admin', 'consultantAccountant', 'bookkeepingAccountant', '超级管理员', '管理员', '顾问会计', '记账会计']
    
    return user.roles.some(role => allowedRoles.includes(role))
  }

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
    {
      key: '/contracts',
      icon: <FileTextOutlined />,
      label: '合同管理',
    },
    // 根据用户角色决定是否显示企业服务菜单
    ...(hasEnterpriseServicePermission() ? [{
      key: 'enterprise',
      icon: <AppstoreOutlined />,
      label: '企业服务',
      children: [
        {
          key: '/enterprise-service',
          icon: <AppstoreOutlined />,
          label: '企业服务详情',
        },
        {
          key: '/financial-self-inspection',
          icon: <AuditOutlined />,
          label: '账务自查',
        },
        {
          key: '/tax-review',
          icon: <FileDoneOutlined />,
          label: '税务核查',
        },
      ],
    }] : []),
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

  // 跟踪路由变化，添加新标签并更新模块状态
  useEffect(() => {
    const { pathname } = location

    // 识别当前路径属于哪个模块并更新状态
    const moduleKey = tabsStore.identifyModule(pathname)
    if (moduleKey) {
      tabsStore.updateModuleState(moduleKey, pathname)
      console.log(`📌 模块 ${moduleKey} 状态已更新为: ${pathname}`)
    }

    // 特殊处理企业详情页
    if (pathname.startsWith('/enterprise-service/detail/')) {
      // 为企业详情页添加自定义标签
      const enterpriseData = localStorage.getItem('currentEnterprise')
      if (enterpriseData) {
        try {
          const enterprise = JSON.parse(enterpriseData)
          tabsStore.addTab({
            key: pathname,
            label: `企业详情 - ${enterprise.companyName}`,
            icon: <AppstoreOutlined />,
            closable: true,
          })
        } catch (error) {
          console.error('解析企业信息失败:', error)
          tabsStore.addTab({
            key: pathname,
            label: '企业详情',
            icon: <AppstoreOutlined />,
            closable: true,
          })
        }
      }
      return
    }

    // 特殊处理合同详情页
    if (pathname.startsWith('/contracts/detail/')) {
      const contractId = pathname.split('/').pop()
      tabsStore.addTab({
        key: pathname,
        label: `合同详情 - #${contractId}`,
        icon: <FileTextOutlined />,
        closable: true,
      })
      return
    }

    // 特殊处理合同编辑页
    if (pathname.startsWith('/contracts/edit/')) {
      const contractId = pathname.split('/').pop()
      tabsStore.addTab({
        key: pathname,
        label: `编辑合同 - #${contractId}`,
        icon: <FileTextOutlined />,
        closable: true,
      })
      return
    }

    // 特殊处理合同创建页
    if (pathname === '/contracts/create') {
      tabsStore.addTab({
        key: pathname,
        label: '创建合同',
        icon: <FileTextOutlined />,
        closable: true,
      })
      return
    }

    // 特殊处理账务自查详情页
    if (pathname.startsWith('/financial-self-inspection/detail/')) {
      const recordId = pathname.split('/').pop()
      tabsStore.addTab({
        key: pathname,
        label: `账务自查详情 - #${recordId}`,
        icon: <AuditOutlined />,
        closable: true,
      })
      return
    }

    // 特殊处理我负责的账务自查详情页
    if (pathname.startsWith('/financial-self-inspection/responsible-detail/')) {
      const recordId = pathname.split('/').pop()
      tabsStore.addTab({
        key: pathname,
        label: `我负责的账务自查 - #${recordId}`,
        icon: <AuditOutlined />,
        closable: true,
      })
      return
    }

    // 特殊处理税务核查详情页
    if (pathname.startsWith('/tax-review/') && pathname !== '/tax-review') {
      const recordId = pathname.split('/').pop()
      tabsStore.addTab({
        key: pathname,
        label: `税务核查详情 - #${recordId}`,
        icon: <FileDoneOutlined />,
        closable: true,
      })
      return
    }

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

  // 定义全局导航函数，用于从其他组件调用，支持智能导航
  React.useEffect(() => {
    // 定义全局函数，用于从其他组件激活特定tab并跳转
    window.activateMenuTab = (mainTabPath: string, targetPath: string) => {
      // 查找菜单项并点击
      const targetMenuItem = menuItems?.find(
        item => item && 'key' in item && item.key === mainTabPath
      )

      if (targetMenuItem) {
        // 智能导航：获取模块的最后访问路径
        const smartTargetPath = tabsStore.getModuleTargetPath(mainTabPath)
        
        // 检查tab是否已经存在
        const tabExists = tabsStore.tabs.some(tab => tab.key === mainTabPath)

        if (!tabExists) {
          // 如果tab不存在，先添加tab
          const menuItem = targetMenuItem as any
          tabsStore.addTab({
            key: mainTabPath,
            label: menuItem.label as string,
            icon: menuItem.icon,
            closable: mainTabPath !== '/', // 仪表盘不可关闭
          })
        }

        // 先切换到主tab
        tabsStore.setActiveKey(mainTabPath)

        // 智能导航：优先使用保存的状态路径，否则使用传入的目标路径
        const finalTargetPath = smartTargetPath !== mainTabPath ? smartTargetPath : targetPath
        
        console.log(`🎯 全局智能导航：${mainTabPath} → ${finalTargetPath}`)

        // 再导航到目标路径
        setTimeout(() => {
          navigate(finalTargetPath)
        }, 100)
        return true
      }

      // 如果找不到菜单项，直接导航
      navigate(targetPath)
      return false
    }

    // 清理函数
    return () => {
      delete window.activateMenuTab
    }
  }, [menuItems, navigate])

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      // 先清除用户状态
      logout()
      // 然后进行导航
      navigate('/login', { replace: true })
    } else if (key === 'profile') {
      // 在新标签页中打开个人资料
      tabsStore.addTab({
        key: '/profile',
        label: '个人资料',
        icon: <UserOutlined />,
        closable: true,
      })
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
      const targetPath = tabsStore.getModuleTargetPath('/users')
      console.log(`🎯 系统管理：跳转到 ${targetPath}`)
      navigate(targetPath)
    } else if (key === 'enterprise') {
      // 企业服务主菜单，默认跳转到企业服务管理
      const targetPath = tabsStore.getModuleTargetPath('/enterprise-service')
      console.log(`🎯 企业服务：跳转到 ${targetPath}`)
      navigate(targetPath)
    } else {
      // 核心改进：智能导航到模块的最后访问路径
      const targetPath = tabsStore.getModuleTargetPath(key)
      
      // 如果路径不同，说明有历史状态，显示智能跳转提示
      if (targetPath !== key) {
        console.log(`🎯 智能导航：${key} → ${targetPath}`)
      }
      
      navigate(targetPath)
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
      id="main-navigation-menu"
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
            {/* 开发模式下显示模块状态调试信息 */}
            {process.env.NODE_ENV === 'development' && !isMobile && (
              <Tooltip 
                title={
                  <div style={{ maxWidth: '300px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📋 模块状态保持</div>
                    {Object.entries(tabsStore.moduleStates).map(([key, state]) => (
                      <div key={key} style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <strong>{state.label}:</strong> {state.lastPath}
                      </div>
                    ))}
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
                      点击不同模块菜单查看智能导航效果
                    </div>
                  </div>
                }
                placement="bottomRight"
              >
                <Button
                  type="text"
                  style={{ 
                    fontSize: '12px', 
                    padding: '4px 8px',
                    height: 'auto',
                    color: '#1890ff'
                  }}
                  className="mx-2"
                >
                  📋 状态保持
                </Button>
              </Tooltip>
            )}

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
