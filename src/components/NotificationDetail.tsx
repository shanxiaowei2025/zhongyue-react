import React, { useState } from 'react'
import { Modal, Button, Typography, Badge, message, Tag } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Notification } from '../types/notification'

const { Text } = Typography

interface NotificationDetailProps {
  visible: boolean
  notification: Notification | null
  onClose: () => void
  showCopyButton?: boolean
  onMarkAsRead?: (notificationId: number) => Promise<boolean>
}

const NotificationDetail: React.FC<NotificationDetailProps> = ({
  visible,
  notification,
  onClose,
  showCopyButton = true,
  onMarkAsRead,
}) => {
  const [loading, setLoading] = useState(false)
  // 复制通知内容
  const handleCopyNotification = async () => {
    if (!notification) return

    try {
      await navigator.clipboard.writeText(notification.content)
      message.success('通知内容已复制到剪贴板')
    } catch (error) {
      message.error('复制失败，请手动选择复制')
    }
  }

  // 处理已读并关闭
  const handleMarkAsReadAndClose = async () => {
    if (!notification || !onMarkAsRead) return

    setLoading(true)
    try {
      const success = await onMarkAsRead(notification.notificationId)
      if (success) {
        // 关闭模态框
        onClose()
      }
    } catch (error) {
      // 错误处理已在onMarkAsRead中处理
    } finally {
      setLoading(false)
    }
  }

  const footer = [
    ...(showCopyButton
      ? [
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyNotification}>
            复制内容
          </Button>,
        ]
      : []),
    notification?.readStatus === 0 ? (
      <Button
        key="markAsReadAndClose"
        type="primary"
        loading={loading}
        onClick={handleMarkAsReadAndClose}
      >
        已读并关闭
      </Button>
    ) : (
      <Button key="close" type="primary" onClick={onClose}>
        关闭
      </Button>
    ),
  ]

  return (
    <Modal
      title="通知详情"
      open={visible}
      onCancel={onClose}
      footer={footer}
      width={600}
      zIndex={2000}
    >
      {notification && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Text type="secondary">状态：</Text>
            <div className="flex items-center gap-2">
              {notification.readStatus === 0 ? (
                <>
                  <Badge status="processing" />
                  <Text strong className="text-blue-600">
                    未读
                  </Text>
                </>
              ) : (
                <>
                  <Badge status="default" />
                  <Text>已读</Text>
                </>
              )}
            </div>
          </div>

          <div>
            <Text type="secondary">标题：</Text>
            <Text strong className="ml-2 text-lg">
              {notification.title}
            </Text>
          </div>

          <div>
            <Text type="secondary">类型：</Text>
            <Tag
              color={
                notification.type === '客户'
                  ? 'green'
                  : notification.type === '费用'
                    ? 'yellow'
                    : 'blue'
              }
            >
              {notification.type === 'system' ? '系统通知' : notification.type || '系统'}
            </Tag>
          </div>

          <div>
            <Text type="secondary">内容：</Text>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
              <Text className="whitespace-pre-wrap">{notification.content}</Text>
            </div>
          </div>

          <div>
            <Text type="secondary">创建时间：</Text>
            <Text className="ml-2">
              {dayjs(notification.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </div>

          {notification.readAt && (
            <div>
              <Text type="secondary">阅读时间：</Text>
              <Text className="ml-2">
                {dayjs(notification.readAt).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default NotificationDetail
