import { useEffect, useState, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { loadRolesFromAPI } from './constants/roles'
import { Spin, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './index.css'
import { useAuthStore } from './store/auth'

const App = () => {
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuthStore()

  // 在应用启动时预加载角色数据，但仅当用户已登录时
  useEffect(() => {
    const preloadData = async () => {
      try {
        // 只有当用户已登录时才预加载需要权限的数据
        if (isAuthenticated) {
          // 预加载角色数据
          await loadRolesFromAPI()
          // 这里可以添加其他需要预加载的数据
        }
      } catch (error) {
        console.error('预加载数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    preloadData()
  }, [isAuthenticated])

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
      </Suspense>
    </ConfigProvider>
  )
}

export default App
