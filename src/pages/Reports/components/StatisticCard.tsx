import React from 'react'
import { Card, Statistic, Tooltip } from 'antd'
import {
  ArrowDownOutlined,
  ExclamationCircleOutlined,
  UserDeleteOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'

interface StatisticCardProps {
  title: string
  value: number | string
  type: 'decrease' | 'expiry' | 'churn' | 'revenue'
  loading?: boolean
  tooltip?: string
  suffix?: string
  precision?: number
}

const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  type,
  loading = false,
  tooltip,
  suffix,
  precision = 0,
}) => {
  // 根据类型选择图标和颜色 - 更加活泼明亮的设计
  const getIconAndColor = () => {
    switch (type) {
      case 'decrease':
        return {
          icon: <ArrowDownOutlined />,
          color: '#ffffff',
          gradient: 'linear-gradient(135deg, #ff6b7a 0%, #ff4757 100%)',
          shadowColor: 'rgba(255, 71, 87, 0.3)',
          emoji: '📉',
        }
      case 'expiry':
        return {
          icon: <ExclamationCircleOutlined />,
          color: '#ffffff',
          gradient: 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)',
          shadowColor: 'rgba(255, 152, 0, 0.3)',
          emoji: '⏰',
        }
      case 'churn':
        return {
          icon: <UserDeleteOutlined />,
          color: '#ffffff',
          gradient: 'linear-gradient(135deg, #ab47bc 0%, #9c27b0 100%)',
          shadowColor: 'rgba(156, 39, 176, 0.3)',
          emoji: '👋',
        }
      case 'revenue':
        return {
          icon: <DollarOutlined />,
          color: '#ffffff',
          gradient: 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)',
          shadowColor: 'rgba(76, 175, 80, 0.3)',
          emoji: '💰',
        }
      default:
        return {
          icon: <InfoCircleOutlined />,
          color: '#ffffff',
          gradient: 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)',
          shadowColor: 'rgba(33, 150, 243, 0.3)',
          emoji: 'ℹ️',
        }
    }
  }

  const { icon, color, gradient, shadowColor, emoji } = getIconAndColor()

  return (
    <Card
      loading={loading}
      style={{
        borderRadius: 20,
        boxShadow: `0 8px 32px ${shadowColor}`,
        transition: 'all 0.3s ease',
        border: 'none',
        background: '#ffffff',
        overflow: 'hidden',
      }}
      bodyStyle={{ padding: '24px' }}
      hoverable
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 12,
              fontSize: 14,
              color: '#8c8c8c',
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: 16 }}>{emoji}</span>
            <span style={{ marginLeft: 8 }}>{title}</span>
            {tooltip && (
              <Tooltip title={tooltip}>
                <InfoCircleOutlined
                  style={{
                    marginLeft: 6,
                    color: '#bfbfbf',
                    cursor: 'help',
                    fontSize: 12,
                  }}
                />
              </Tooltip>
            )}
          </div>
          <Statistic
            value={value}
            precision={precision}
            suffix={suffix}
            valueStyle={{
              color: '#262626',
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          />
        </div>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: color,
            boxShadow: `0 4px 16px ${shadowColor}`,
            transform: 'rotate(-5deg)',
            transition: 'all 0.3s ease',
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  )
}

export default StatisticCard
