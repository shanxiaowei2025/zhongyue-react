import React, { useEffect, useState } from 'react'
import { Badge, Dropdown, Button, List, Typography, Empty, Spin, Tooltip, Tag } from 'antd'
import { BellOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useNotificationStore } from '../store/notification'
import { useNewNotifications, useNotificationActions } from '../hooks/useNotification'
import { mutate } from 'swr'
import { getNewNotificationsKey } from '../hooks/useNotification'
import NotificationDetail from './NotificationDetail'

const { Text, Paragraph } = Typography

interface NotificationBellProps {
  className?: string
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const navigate = useNavigate()
  const { stats, isWebSocketConnected, updateStats } = useNotificationStore()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)

  const { newNotifications, isLoading } = useNewNotifications()
  const { markAsReadAction, deleteNotificationAction } = useNotificationActions()

  // 初始化时更新统计
  useEffect(() => {
    updateStats()
  }, [updateStats])

  // 监听WebSocket新通知变化，刷新数据
  useEffect(() => {
    // 当未读通知数量变化时，刷新SWR缓存以获取最新数据
    // App.tsx中已经处理了WebSocket新通知的缓存刷新，这里作为备用机制
    if (stats.unread > 0) {
      mutate(getNewNotificationsKey({ page: 1, limit: 999 }))
    }
  }, [stats.unread])

  // 处理标记已读
  const handleMarkAsRead = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    const success = await markAsReadAction(notificationId)
    if (success) {
      // 刷新统计 - SWR缓存已在markAsReadAction中刷新
      updateStats()
    }
  }

  // 处理删除通知
  const handleDelete = async (recordId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    const success = await deleteNotificationAction(recordId)
    if (success) {
      // 刷新统计 - SWR缓存已在deleteNotificationAction中刷新
      updateStats()
    }
  }

  // 处理查看通知详情
  const handleViewNotification = (notification: any) => {
    setSelectedNotification(notification)
    setDetailModalVisible(true)
  }

  // 跳转到通知中心
  const handleViewAll = () => {
    // 使用全局函数创建tab并导航
    if (window.addTab) {
      window.addTab({
        key: '/notifications',
        label: '通知中心',
        icon: <BellOutlined />,
        closable: true,
      })
    } else {
      // 降级处理：直接导航
      navigate('/notifications')
    }
  }

  // 构建下拉菜单内容
  const dropdownContent = (
    <div className="w-80 max-h-96 overflow-hidden">
      {/* 头部 */}
      <div className="p-3 border-b border-gray-200 flex justify-between items-center">
        <Text strong>通知中心</Text>
        <div className="flex items-center gap-2">
          {/* WebSocket连接状态指示器 */}
          <Tooltip title={isWebSocketConnected ? '实时连接正常' : '实时连接断开'}>
            <div
              className={`w-2 h-2 rounded-full ${
                isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </Tooltip>
          <Button type="link" size="small" onClick={handleViewAll}>
            查看全部
          </Button>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <Spin size="small" />
          </div>
        ) : newNotifications.length === 0 ? (
          <div className="p-4">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无未读通知"
              className="my-2"
            />
          </div>
        ) : (
          <List
            size="small"
            dataSource={newNotifications}
            renderItem={notification => (
              <List.Item
                className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                  notification.readStatus === 0
                    ? notification.type === '客户'
                      ? 'bg-green-50'
                      : notification.type === '费用'
                        ? 'bg-yellow-50'
                        : 'bg-blue-50'
                    : ''
                }`}
                onClick={() => handleViewNotification(notification)}
                actions={[
                  notification.readStatus === 0 && (
                    <Tooltip title="标记已读">
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={e => handleMarkAsRead(notification.notificationId, e)}
                      />
                    </Tooltip>
                  ),
                  <Tooltip title="删除">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={e => handleDelete(notification.id, e)}
                    />
                  </Tooltip>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-2">
                      <Text
                        strong={notification.readStatus === 0}
                        className={notification.readStatus === 0 ? 'text-blue-600' : ''}
                      >
                        {notification.title}
                      </Text>
                      {/* 通知类型标签 */}
                      <Tag
                        color={
                          notification.type === '客户'
                            ? 'success'
                            : notification.type === '费用'
                              ? 'warning'
                              : 'processing'
                        }
                      >
                        {notification.type || '系统'}
                      </Tag>
                      {notification.readStatus === 0 && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  }
                  description={
                    <div>
                      <Paragraph ellipsis={{ rows: 2 }} className="text-gray-600 text-xs mb-1">
                        {notification.content}
                      </Paragraph>
                      <Text type="secondary" className="text-xs">
                        {dayjs(notification.createdAt).format('MM-DD HH:mm')}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  )

  return (
    <>
      <Dropdown
        dropdownRender={() => dropdownContent}
        placement="bottomRight"
        arrow={{ pointAtCenter: true }}
        trigger={['click']}
        overlayClassName="notification-dropdown"
        overlayStyle={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className={`cursor-pointer ${className}`}>
          <Badge count={stats.unread} size="small" overflowCount={99}>
            <BellOutlined className="text-lg" />
          </Badge>
        </div>
      </Dropdown>

      {/* 通知详情弹窗 */}
      <NotificationDetail
        visible={detailModalVisible}
        notification={selectedNotification}
        onClose={() => {
          setDetailModalVisible(false)
          setSelectedNotification(null)
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

export default NotificationBell
