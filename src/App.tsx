import { useEffect, useState, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { loadRolesFromAPI } from './constants/roles'
import { Spin, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './index.css'
import { useAuthStore } from './store/auth'
import { useNotificationStore } from './store/notification'
import webSocketService from './services/websocket'
import { mutate } from 'swr'
import { getNewNotificationsKey, getNotificationListKey, useNotificationActions } from './hooks/useNotification'
import { getNewNotifications } from './api/notification'
import PasswordExpiredModal from './components/PasswordExpiredModal'
import NotificationDetail from './components/NotificationDetail'
import type { Notification } from './types/notification'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const App = () => {
  const [loading, setLoading] = useState(true)
  const [notificationModalVisible, setNotificationModalVisible] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)
  const [unreadQueue, setUnreadQueue] = useState<Notification[]>([]) // 未读通知队列
  
  const {
    isAuthenticated,
    resetTimer,
    startTimer,
    clearTimer,
    passwordModalVisible,
    checkPasswordExpiration,
    checkAndHandleAutoLogout,
    updateLastActivity,
  } = useAuthStore()

  const {
    addNewNotification,
    setWebSocketConnected,
    reset: resetNotificationStore,
    updateStats,
  } = useNotificationStore()

  const { markAsReadAction } = useNotificationActions()

  // 处理通知队列，逐条弹出
  useEffect(() => {
    if (!notificationModalVisible && unreadQueue.length > 0) {
      // 当前没有弹窗显示，且队列中有未读通知
      const nextNotification = unreadQueue[0]
      setCurrentNotification(nextNotification)
      setNotificationModalVisible(true)
      // 从队列中移除已显示的通知
      setUnreadQueue(prev => prev.slice(1))
    }
  }, [notificationModalVisible, unreadQueue])

  // 在应用启动时预加载角色数据，但仅当用户已登录时
  useEffect(() => {
    const preloadData = async () => {
      try {
        // 首先检查是否应该自动退出（基于最后活动时间）
        if (isAuthenticated) {
          const shouldLogout = checkAndHandleAutoLogout()
          if (shouldLogout) {
            // 如果已经自动退出，不需要继续执行后续逻辑
            setLoading(false)
            return
          }

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
  }, [isAuthenticated, checkPasswordExpiration, checkAndHandleAutoLogout])

  // 添加自动登出功能
  useEffect(() => {
    // 只有当用户已认证时才启动计时器
    if (isAuthenticated) {
      // 初始化计时器
      startTimer()

      // 添加节流机制，避免过于频繁的调用
      let lastActivityTime = 0
      const throttleDelay = 1000 // 1秒内最多触发一次

      // 定义用户活动处理函数
      const handleUserActivity = () => {
        const now = Date.now()
        // 只有距离上次调用超过1秒才执行
        if (now - lastActivityTime >= throttleDelay) {
          lastActivityTime = now
          updateLastActivity() // 更新最后活动时间
          resetTimer() // 重置计时器
        }
      }

      // 添加用户活动事件监听器
      window.addEventListener('mousemove', handleUserActivity)
      window.addEventListener('mousedown', handleUserActivity)
      window.addEventListener('keypress', handleUserActivity)
      window.addEventListener('touchmove', handleUserActivity)
      window.addEventListener('scroll', handleUserActivity)

      // 添加定期检查，每分钟检查一次是否应该自动退出
      const intervalCheck = setInterval(() => {
        checkAndHandleAutoLogout()
      }, 60000) // 每60秒检查一次

      // 组件卸载时清理
      return () => {
        window.removeEventListener('mousemove', handleUserActivity)
        window.removeEventListener('mousedown', handleUserActivity)
        window.removeEventListener('keypress', handleUserActivity)
        window.removeEventListener('touchmove', handleUserActivity)
        window.removeEventListener('scroll', handleUserActivity)
        clearInterval(intervalCheck) // 清除定期检查
        clearTimer() // 清除计时器
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]) // 仅在认证状态变化时重新运行

  // 登录后检查未读通知并加入队列
  useEffect(() => {
    if (isAuthenticated && !loading) {
      // 延迟检查，确保页面加载完成
      const timer = setTimeout(async () => {
        try {
          // 获取所有未读通知（最多10条，避免过多弹窗）
          const response = await getNewNotifications({ page: 1, limit: 10 })
          const unreadNotifications = response.data?.items || []
          
          // 如果有未读通知，加入队列
          if (unreadNotifications.length > 0) {
            console.log(`登录后发现 ${unreadNotifications.length} 条未读通知`)
            setUnreadQueue(unreadNotifications)
          }
        } catch (error) {
          console.error('检查未读通知失败:', error)
        }
      }, 1000) // 延迟1秒，避免与其他初始化逻辑冲突

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, loading])

  // WebSocket 连接管理
  useEffect(() => {
    if (isAuthenticated) {
      // 用户登录后建立 WebSocket 连接
      webSocketService.connect()

      // 注册 WebSocket 事件监听器
      const unsubscribeNotification = webSocketService.onNotification(data => {
        // 收到新通知时更新 store
        addNewNotification(data)
        // 刷新SWR缓存以确保通知弹窗和通知中心数据同步
        mutate(getNewNotificationsKey({ page: 1, limit: 999 }))
        mutate(getNotificationListKey({ page: 1, limit: 50 }))
        
        // 构建通知对象并加入队列
        const newNotification: Notification = {
          id: data.id,
          notificationId: data.id,
          title: data.title,
          content: data.content,
          type: data.type,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          readStatus: 0, // 新通知默认未读
          readAt: null,
        }
        
        // 加入通知队列
        setUnreadQueue(prev => [...prev, newNotification])
        
        console.log('收到新通知:', data.title)
      })

      const unsubscribeConnect = webSocketService.onConnect(() => {
        setWebSocketConnected(true)
        console.log('WebSocket 连接成功')
      })

      const unsubscribeDisconnect = webSocketService.onDisconnect(() => {
        setWebSocketConnected(false)
        console.log('WebSocket 连接断开')
      })

      const unsubscribeError = webSocketService.onError(error => {
        console.error('WebSocket 连接错误:', error)
      })

      // 清理函数
      return () => {
        unsubscribeNotification()
        unsubscribeConnect()
        unsubscribeDisconnect()
        unsubscribeError()
        webSocketService.disconnect()
      }
    } else {
      // 用户未登录时断开 WebSocket 连接并重置通知状态
      webSocketService.disconnect()
      setWebSocketConnected(false)
      resetNotificationStore()
    }
  }, [isAuthenticated, addNewNotification, setWebSocketConnected, resetNotificationStore])

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

        {/* 新通知弹窗 */}
        {isAuthenticated && (
          <NotificationDetail
            visible={notificationModalVisible}
            notification={currentNotification}
            onClose={() => {
              setNotificationModalVisible(false)
              setCurrentNotification(null)
            }}
            onMarkAsRead={async notificationId => {
              const success = await markAsReadAction(notificationId)
              if (success) {
                updateStats()
              }
              return success
            }}
            showCopyButton={true}
          />
        )}
      </Suspense>
    </ConfigProvider>
  )
}

export default App
