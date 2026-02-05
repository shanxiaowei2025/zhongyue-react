import React from 'react'
import { Modal, Typography, Space, Badge, Button } from 'antd'
import {
  BellOutlined,
  FileTextOutlined,
  DollarOutlined,
  UserOutlined,
  SafetyOutlined,
} from '@ant-design/icons'

const { Text } = Typography

interface NotificationSummary {
  financial_self_inspection?: number // 账务自查
  费用?: number
  客户?: number
  行政到期?: number
  system?: number // 系统通知
  [key: string]: number | undefined // 其他类型
}

interface NotificationSummaryModalProps {
  visible: boolean
  summary: NotificationSummary
  totalCount: number
  onClose: () => void
  onViewNotifications?: () => void // 新增：可选的导航回调
}

const NotificationSummaryModal: React.FC<NotificationSummaryModalProps> = ({
  visible,
  summary,
  totalCount,
  onClose,
  onViewNotifications,
}) => {
  // 处理查看通知中心
  const handleViewNotifications = () => {
    onClose()
    if (onViewNotifications) {
      onViewNotifications()
    }
  }

  // 获取图标和颜色
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'financial_self_inspection':
        return {
          icon: <FileTextOutlined />,
          color: '#fa8c16',
          label: '账务自查',
        }
      case '费用':
        return {
          icon: <DollarOutlined />,
          color: '#faad14',
          label: '费用',
        }
      case '客户':
        return {
          icon: <UserOutlined />,
          color: '#52c41a',
          label: '客户',
        }
      case '行政到期':
        return {
          icon: <SafetyOutlined />,
          color: '#ff4d4f',
          label: '行政到期',
        }
      case 'system':
        return {
          icon: <BellOutlined />,
          color: '#1890ff',
          label: '系统',
        }
      default:
        return {
          icon: <BellOutlined />,
          color: '#1890ff',
          label: type || '其他',
        }
    }
  }

  // 过滤出有数量的通知类型
  const notificationItems = Object.entries(summary)
    .filter(([_, count]) => count !== undefined && count > 0)
    .map(([type, count]) => ({
      type,
      count: count as number,
      ...getTypeConfig(type),
    }))

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <BellOutlined className="text-blue-500" />
          <span>未读通知提醒</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="view" type="primary" onClick={handleViewNotifications}>
          查看通知
        </Button>,
      ]}
      width={480}
      centered
    >
      <div className="py-4">
        {/* 总数提示 */}
        <div className="mb-6 text-center">
          <Text className="text-base">
            您有 <Text strong className="text-xl text-red-500">{totalCount}</Text> 条未读通知，请及时查看
          </Text>
        </div>

        {/* 分类统计 */}
        <Space direction="vertical" size="middle" className="w-full">
          {notificationItems.map(item => (
            <div
              key={item.type}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <span style={{ color: item.color, fontSize: '20px' }}>
                    {item.icon}
                  </span>
                </div>
                <Text strong className="text-base">
                  {item.label}
                </Text>
              </div>
              <Badge
                count={item.count}
                showZero
                style={{
                  backgroundColor: item.color,
                  fontSize: '14px',
                  height: '24px',
                  lineHeight: '24px',
                  minWidth: '24px',
                }}
              />
            </div>
          ))}
        </Space>

        {/* 底部提示 */}
        <div className="mt-6 text-center">
          <Text type="secondary" className="text-sm">
            点击"查看通知"按钮前往通知中心查看详情
          </Text>
        </div>
      </div>
    </Modal>
  )
}

export default NotificationSummaryModal
