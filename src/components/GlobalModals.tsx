import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mutate } from 'swr'
import { useAuthStore } from '../store/auth'
import { useNotificationStore } from '../store/notification'
import { getNewNotificationsKey, getNotificationListKey, useNotificationActions } from '../hooks/useNotification'
import { getNewNotifications } from '../api/notification'
import PasswordExpiredModal from './PasswordExpiredModal'
import NotificationDetail from './NotificationDetail'
import NotificationSummaryModal from './NotificationSummaryModal'
import type { Notification } from '../types/notification'

/**
 * 全局模态框组件
 * 必须在 Router 内部渲染，以便可以使用 useNavigate
 */
const GlobalModals: React.FC = () => {
  const navigate = useNavigate()
  const [notificationModalVisible, setNotificationModalVisible] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)
  const [summaryModalVisible, setSummaryModalVisible] = useState(false)
  const [notificationSummary, setNotificationSummary] = useState<Record<string, number>>({})
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const [hasCheckedNotifications, setHasCheckedNotifications] = useState(false)

  const { isAuthenticated, passwordModalVisible } = useAuthStore()
  const { updateStats } = useNotificationStore()
  const { markAsReadAction } = useNotificationActions()

  // 登录后检查未读通知并显示汇总弹窗
  useEffect(() => {
    if (isAuthenticated && !hasCheckedNotifications) {
      // 延迟检查，确保页面加载完成
      const timer = setTimeout(async () => {
        try {
          // 获取所有未读通知
          const response = await getNewNotifications({ page: 1, limit: 999 })
          const unreadNotifications = response.data?.items || []

          // 如果有未读通知，按类型统计
          if (unreadNotifications.length > 0) {
            console.log(`登录后发现 ${unreadNotifications.length} 条未读通知`)

            // 按类型统计
            const summary: Record<string, number> = {}
            unreadNotifications.forEach((notification: Notification) => {
              const type = notification.type || 'system'
              summary[type] = (summary[type] || 0) + 1
            })

            setNotificationSummary(summary)
            setTotalUnreadCount(unreadNotifications.length)
            setSummaryModalVisible(true)
          }
          
          setHasCheckedNotifications(true)
        } catch (error) {
          console.error('检查未读通知失败:', error)
        }
      }, 1000) // 延迟1秒，避免与其他初始化逻辑冲突

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, hasCheckedNotifications])

  // 重置检查状态当用户登出时
  useEffect(() => {
    if (!isAuthenticated) {
      setHasCheckedNotifications(false)
      setSummaryModalVisible(false)
      setNotificationModalVisible(false)
      setCurrentNotification(null)
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {/* 密码过期强制修改弹窗 */}
      <PasswordExpiredModal visible={passwordModalVisible} />

      {/* 登录时的通知汇总弹窗 */}
      <NotificationSummaryModal
        visible={summaryModalVisible}
        summary={notificationSummary}
        totalCount={totalUnreadCount}
        onClose={() => setSummaryModalVisible(false)}
        onViewNotifications={() => navigate('/notifications')}
      />

      {/* 实时接收的新通知详情弹窗 */}
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
    </>
  )
}

export default GlobalModals
