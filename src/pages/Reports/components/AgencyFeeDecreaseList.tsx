import React from 'react'
import { Card, List, Tag, Empty, Spin, Button } from 'antd'
import { ArrowDownOutlined, EyeOutlined } from '@ant-design/icons'
import type { AgencyFeeDecreaseCustomer } from '../types/reports'

interface AgencyFeeDecreaseListProps {
  data: AgencyFeeDecreaseCustomer[]
  loading?: boolean
  title?: string
  onViewMore?: () => void
}

const AgencyFeeDecreaseList: React.FC<AgencyFeeDecreaseListProps> = ({
  data = [],
  loading = false,
  title = '代理费减少客户',
  onViewMore,
}) => {
  return (
    <Card
      title={<span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>📉 {title}</span>}
      style={{
        height: 400,
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(255, 71, 87, 0.15)',
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
          <Empty description="暂无数据" />
        </div>
      ) : (
        <List
          dataSource={data}
          renderItem={item => (
            <List.Item
              style={{
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
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
                        fontWeight: 500,
                        fontSize: 14,
                        marginBottom: 4,
                        color: '#262626',
                      }}
                    >
                      {item.companyName}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#8c8c8c',
                        marginBottom: 4,
                      }}
                    >
                      {item.unifiedSocialCreditCode}
                    </div>
                    <div style={{ fontSize: 12, color: '#595959' }}>
                      顾问: {item.consultantAccountant || '未分配'} | 记账:{' '}
                      {item.bookkeepingAccountant || '未分配'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Tag color="red" icon={<ArrowDownOutlined />} style={{ marginBottom: 4 }}>
                      -¥{item.decreaseAmount.toLocaleString()}
                    </Tag>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#8c8c8c',
                      }}
                    >
                      减少 {item.decreaseRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: '#8c8c8c',
                  }}
                >
                  <span>今年: ¥{item.currentYearFee.toLocaleString()}</span>
                  <span>去年: ¥{item.previousYearFee.toLocaleString()}</span>
                </div>
              </div>
            </List.Item>
          )}
          style={{
            height: '100%',
            overflowY: 'auto',
          }}
        />
      )}
    </Card>
  )
}

export default AgencyFeeDecreaseList
