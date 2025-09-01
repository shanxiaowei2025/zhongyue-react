import React from 'react'
import { Card, List, Tag, Empty, Spin, Button } from 'antd'
import { ExclamationCircleOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ExpiringCustomerItem } from '../types/reports'

interface ExpiringCustomersListProps {
  data: ExpiringCustomerItem[]
  loading?: boolean
  title?: string
  onViewMore?: () => void
}

const ExpiringCustomersList: React.FC<ExpiringCustomersListProps> = ({
  data = [],
  loading = false,
  title = '到期客户提醒',
  onViewMore,
}) => {
  // 计算到期天数
  const getDaysOverdue = (endDate: string) => {
    const today = dayjs()
    const expiry = dayjs(endDate)
    return today.diff(expiry, 'day')
  }

  // 获取到期状态标签
  const getExpiryTag = (endDate: string) => {
    const daysOverdue = getDaysOverdue(endDate)

    if (daysOverdue > 30) {
      return <Tag color="red">已到期{daysOverdue}天</Tag>
    } else if (daysOverdue > 0) {
      return <Tag color="orange">已到期{daysOverdue}天</Tag>
    } else if (daysOverdue > -7) {
      return <Tag color="yellow">即将到期</Tag>
    } else {
      return <Tag color="blue">正常</Tag>
    }
  }

  return (
    <Card
      title={<span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>⏰ {title}</span>}
      style={{
        height: 400,
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(255, 152, 0, 0.15)',
        border: 'none',
        background: '#ffffff',
      }}
      styles={{
        body: {
          padding: '24px',
          height: 'calc(100% - 57px)', // 减去标题高度
        },
      }}
      extra={
        onViewMore && (
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={onViewMore}>
            查看更多
          </Button>
        )
      }
    >
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Spin size="large" />
        </div>
      ) : data.length === 0 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Empty description="暂无到期客户" />
        </div>
      ) : (
        <List
          dataSource={data}
          renderItem={item => {
            const daysOverdue = getDaysOverdue(item.agencyEndDate)
            const isUrgent = daysOverdue > 0

            return (
              <List.Item
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: isUrgent ? '#fff2f0' : 'transparent',
                  borderRadius: isUrgent ? 4 : 0,
                  marginBottom: isUrgent ? 4 : 0,
                  paddingLeft: isUrgent ? 12 : 0,
                  paddingRight: isUrgent ? 12 : 0,
                }}
              >
                <div style={{ width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: 4,
                        }}
                      >
                        {isUrgent && (
                          <ExclamationCircleOutlined
                            style={{
                              color: '#ff4d4f',
                              marginRight: 4,
                              fontSize: 14,
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontWeight: 500,
                            fontSize: 14,
                            color: isUrgent ? '#ff4d4f' : '#262626',
                          }}
                        >
                          {item.companyName}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#8c8c8c',
                          marginBottom: 4,
                          fontFamily: 'monospace',
                        }}
                      >
                        信用代码:{' '}
                        {item.unifiedSocialCreditCode === '无'
                          ? '无'
                          : item.unifiedSocialCreditCode}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: 12,
                          color: '#8c8c8c',
                          marginBottom: 4,
                        }}
                      >
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        到期日期: {dayjs(item.agencyEndDate).format('YYYY-MM-DD')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>{getExpiryTag(item.agencyEndDate)}</div>
                  </div>
                </div>
              </List.Item>
            )
          }}
          style={{
            height: '100%',
            overflowY: 'auto',
          }}
        />
      )}
    </Card>
  )
}

export default ExpiringCustomersList
