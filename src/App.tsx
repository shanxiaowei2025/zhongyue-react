import { useEffect, useState, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { loadRolesFromAPI } from './constants/roles'
import { Spin, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './index.css'
import { useAuthStore } from './store/auth'
import PasswordExpiredModal from './components/PasswordExpiredModal'

const App = () => {
  const [loading, setLoading] = useState(true)
  const { 
    isAuthenticated, 
    resetTimer, 
    startTimer, 
    clearTimer, 
    passwordModalVisible, 
    checkPasswordExpiration 
  } = useAuthStore()

  // 在应用启动时预加载角色数据，但仅当用户已登录时
  useEffect(() => {
    const preloadData = async () => {
      try {
        // 只有当用户已登录时才预加载需要权限的数据
        if (isAuthenticated) {
          // 预加载角色数据
          await loadRolesFromAPI()
          // 这里可以添加其他需要预加载的数据
          
          // 检查密码是否过期
          if (checkPasswordExpiration()) {
            useAuthStore.getState().showPasswordModal()
          }
        }
      } catch (error) {
        console.error('预加载数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    preloadData()
  }, [isAuthenticated, checkPasswordExpiration])

  // 添加自动登出功能
  useEffect(() => {
    // 只有当用户已认证时才启动计时器
    if (isAuthenticated) {
      // 初始化计时器
      startTimer()

      // 定义用户活动处理函数
      const handleUserActivity = () => {
        resetTimer() // 重置计时器
      }

      // 添加用户活动事件监听器
      window.addEventListener('mousemove', handleUserActivity)
      window.addEventListener('mousedown', handleUserActivity)
      window.addEventListener('keypress', handleUserActivity)
      window.addEventListener('touchmove', handleUserActivity)
      window.addEventListener('scroll', handleUserActivity)

      // 组件卸载时清理
      return () => {
        window.removeEventListener('mousemove', handleUserActivity)
        window.removeEventListener('mousedown', handleUserActivity)
        window.removeEventListener('keypress', handleUserActivity)
        window.removeEventListener('touchmove', handleUserActivity)
        window.removeEventListener('scroll', handleUserActivity)
        clearTimer() // 清除计时器
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]) // 仅在认证状态变化时重新运行

  // 显示一个全屏加载指示器，直到预加载完成
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Spin size="large" spinning={true} fullscreen tip="加载中..." />
      </div>
    )
  }

  return (
    <ConfigProvider
      locale={zhCN}
      form={{
        validateMessages: {
          required: '${label}不能为空',
        },
      }}
    >
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            <Spin size="large" />
          </div>
        }
      >
        <RouterProvider router={router} />
        
        {/* 密码过期强制修改弹窗 */}
        {isAuthenticated && <PasswordExpiredModal visible={passwordModalVisible} />}
      </Suspense>
    </ConfigProvider>
  )
}

export default App
