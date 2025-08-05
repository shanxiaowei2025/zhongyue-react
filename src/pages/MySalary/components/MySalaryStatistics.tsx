import React from 'react'
import { Card, Statistic, Row, Col, Progress, Typography } from 'antd'
import {
  DollarOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type { MySalaryStatistics as MySalaryStatisticsType } from '../../../types/mySalary'

const { Text } = Typography

interface MySalaryStatisticsProps {
  statistics: MySalaryStatisticsType
  loading?: boolean
}

const MySalaryStatistics: React.FC<MySalaryStatisticsProps> = ({ statistics, loading = false }) => {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
  }

  const confirmationRate =
    statistics.yearToDate.totalCount > 0
      ? (statistics.yearToDate.confirmedCount / statistics.yearToDate.totalCount) * 100
      : 0

  return (
    <div className="space-y-4">
      {/* 当月薪资 */}
      <Card
        title="本月薪资"
        extra={
          statistics.currentMonth.isConfirmed ? (
            <CheckCircleOutlined className="text-green-500" />
          ) : (
            <Text type="secondary">待确认</Text>
          )
        }
        loading={loading}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="应发工资"
              value={statistics.currentMonth.totalPayable}
              formatter={value => `¥${formatCurrency(Number(value))}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="实发工资"
              value={statistics.currentMonth.netSalary}
              formatter={value => `¥${formatCurrency(Number(value))}`}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BankOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* 年度统计 */}
      <Card title="年度累计" loading={loading}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="累计应发"
              value={statistics.yearToDate.totalPayable}
              formatter={value => `¥${formatCurrency(Number(value))}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="累计个税"
              value={statistics.yearToDate.totalTax}
              formatter={value => `¥${formatCurrency(Number(value))}`}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="累计实发"
              value={statistics.yearToDate.netSalary}
              formatter={value => `¥${formatCurrency(Number(value))}`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <Text type="secondary">薪资确认进度</Text>
            <Text>
              {statistics.yearToDate.confirmedCount}/{statistics.yearToDate.totalCount}
            </Text>
          </div>
          <Progress
            percent={confirmationRate}
            status={confirmationRate === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
      </Card>

      {/* 快速操作提示 */}
      {!statistics.currentMonth.isConfirmed && statistics.currentMonth.totalPayable > 0 && (
        <Card>
          <div className="text-center py-2">
            <CalendarOutlined className="text-2xl text-orange-500 mb-2" />
            <div>
              <Text strong>本月薪资待确认</Text>
            </div>
            <Text type="secondary" className="text-sm">
              请查看薪资详情并确认无误
            </Text>
          </div>
        </Card>
      )}
    </div>
  )
}

export default MySalaryStatistics
