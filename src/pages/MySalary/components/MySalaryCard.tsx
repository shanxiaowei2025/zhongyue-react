import React from 'react'
import { Card, Typography, Tag, Button, Tooltip } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { MySalaryRecord } from '../../../types/mySalary'

const { Text, Title } = Typography

interface MySalaryCardProps {
  record: MySalaryRecord
  onView?: (record: MySalaryRecord) => void
  onConfirm?: (record: MySalaryRecord) => void
  loading?: boolean
}

const MySalaryCard: React.FC<MySalaryCardProps> = ({
  record,
  onView,
  onConfirm,
  loading = false,
}) => {
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return '¥0.00'
    }
    const numAmount = Number(amount)
    return `¥${numAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
  }

  const formatYearMonth = (yearMonth: string) => {
    return dayjs(yearMonth).format('YYYY年MM月')
  }

  const getStatusTag = () => {
    return (
      <div className="flex space-x-2">
        {/* 发放状态 */}
        <Tag
          icon={record.isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={record.isPaid ? 'green' : 'orange'}
        >
          {record.isPaid ? '已发放' : '未发放'}
        </Tag>
        {/* 确认状态 */}
        <Tag
          icon={record.isConfirmed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={record.isConfirmed ? 'success' : 'warning'}
        >
          {record.isConfirmed ? '已确认' : '待确认'}
        </Tag>
      </div>
    )
  }

  const canConfirm = !record.isConfirmed && record.totalPayable > 0

  return (
    <Card
      size="small"
      className="mb-4 hover:shadow-md transition-shadow"
      title={
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <FileTextOutlined className="mr-2 text-blue-600" />
            <span>{formatYearMonth(record.yearMonth)}</span>
          </div>
          {getStatusTag()}
        </div>
      }
      extra={
        <div className="flex space-x-2">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView?.(record)}
              size="small"
            />
          </Tooltip>
          {canConfirm && onConfirm && (
            <Tooltip title="确认薪资">
              <Button
                type="primary"
                size="small"
                loading={loading}
                onClick={() => onConfirm(record)}
              >
                确认
              </Button>
            </Tooltip>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {/* 薪资总览 */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Text type="secondary" className="text-sm">
              应发合计
            </Text>
            <div>
              <Title level={4} className="!mb-0 text-green-600">
                {formatCurrency(record.totalPayable)}
              </Title>
            </div>
          </div>
        </div>

        {/* 详细信息 */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Text type="secondary">基本工资:</Text>
              <Text>{formatCurrency(record.baseSalary)}</Text>
            </div>
            {record.temporaryIncrease > 0 && (
              <div className="flex justify-between">
                <Text type="secondary">
                  临时增加{record.temporaryIncreaseItem ? `(${record.temporaryIncreaseItem})` : ''}:
                </Text>
                <Text className="text-green-600">+{formatCurrency(record.temporaryIncrease)}</Text>
              </div>
            )}
            <div className="flex justify-between">
              <Text type="secondary">补贴合计:</Text>
              <Text>{formatCurrency(record.totalSubsidy)}</Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">绩效提成:</Text>
              <Text>{formatCurrency(record.performanceCommission)}</Text>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Text type="secondary">社保个人:</Text>
              <Text className="text-red-600">-{formatCurrency(record.personalInsuranceTotal)}</Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">个人所得税:</Text>
              <Text className="text-red-600">-{formatCurrency(record.personalIncomeTax)}</Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">银行卡/微信:</Text>
              <Text>{formatCurrency(record.bankCardOrWechat)}</Text>
            </div>
          </div>
        </div>

        {/* 确认信息 */}
        {record.isConfirmed && record.confirmedAt && (
          <div className="pt-3 border-t border-gray-100">
            <Text type="secondary" className="text-sm">
              确认时间: {dayjs(record.confirmedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </div>
        )}
      </div>
    </Card>
  )
}

export default MySalaryCard
