import React from 'react'
import { Modal, Button, Typography, Badge, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Notification } from '../types/notification'

const { Text } = Typography

interface NotificationDetailProps {
  visible: boolean
  notification: Notification | null
  onClose: () => void
  showCopyButton?: boolean
}

const NotificationDetail: React.FC<NotificationDetailProps> = ({
  visible,
  notification,
  onClose,
  showCopyButton = true,
}) => {
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

  const footer = [
    ...(showCopyButton
      ? [
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyNotification}>
            复制内容
          </Button>,
        ]
      : []),
    <Button key="close" type="primary" onClick={onClose}>
      关闭
    </Button>,
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
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
              {notification.type === 'system' ? '系统通知' : notification.type}
            </span>
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
