import React from 'react'
import { Card, Statistic } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

interface SalaryCardProps {
  title: string
  value: string | number
  precision?: number
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  trend?: 'up' | 'down'
  trendValue?: number
  loading?: boolean
  className?: string
  onClick?: () => void
}

const SalaryCard: React.FC<SalaryCardProps> = ({
  title,
  value,
  precision = 2,
  prefix,
  suffix,
  trend,
  trendValue,
  loading = false,
  className,
  onClick,
}) => {
  const renderTrend = () => {
    if (!trend || trendValue === undefined) return null

    const isUp = trend === 'up'
    const Icon = isUp ? ArrowUpOutlined : ArrowDownOutlined
    const color = isUp ? '#3f8600' : '#cf1322'

    return (
      <div className="mt-2 text-sm" style={{ color }}>
        <Icon className="mr-1" />
        <span>{Math.abs(trendValue)}%</span>
        <span className="ml-1 text-gray-500">vs 上月</span>
      </div>
    )
  }

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className || ''}`}
      loading={loading}
      onClick={onClick}
      size="small"
    >
      <Statistic
        title={title}
        value={value}
        precision={precision}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
      />
      {renderTrend()}
    </Card>
  )
}

export default SalaryCard
