import React from 'react'
import { Table, Tag, Badge, Button, Progress } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { SalaryRecord, SalaryStatistics } from '../../../types/salaryIntegrated'

interface SalaryOverviewProps {
  salaryData: SalaryRecord[]
  loading: boolean
  selectedEmployee: SalaryRecord | null
  onSelectEmployee: (employee: SalaryRecord) => void
  onRefresh: () => void
  statistics: SalaryStatistics
}

const SalaryOverview: React.FC<SalaryOverviewProps> = ({
  salaryData,
  loading,
  selectedEmployee,
  onSelectEmployee,
  onRefresh,
  statistics,
}) => {
  const columns: ColumnsType<SalaryRecord> = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100,
      fixed: 'left',
      render: (text, record) => (
        <div
          className={`cursor-pointer p-2 rounded transition-colors ${
            selectedEmployee?.id === record.id
              ? 'bg-blue-100 text-blue-600 font-medium'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelectEmployee(record)}
        >
          {text}
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      width: 120,
      ellipsis: true,
    },
    {
      title: '应发合计',
      dataIndex: 'totalPayable',
      width: 120,
      render: value => {
        const amount = toNumber(value)
        return (
          <span className="font-mono text-green-600 font-medium">
            ¥
            {amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )
      },
      align: 'right',
    },
    {
      title: '社保扣除',
      dataIndex: 'personalInsuranceTotal',
      width: 100,
      render: value => {
        const amount = toNumber(value)
        return (
          <span className="font-mono text-orange-500">
            ¥
            {amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )
      },
      align: 'right',
    },
    {
      title: '个税',
      dataIndex: 'personalIncomeTax',
      width: 100,
      render: value => {
        const amount = toNumber(value)
        return (
          <span className="font-mono text-red-500">
            ¥
            {amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )
      },
      align: 'right',
    },
    {
      title: '实发金额',
      width: 120,
      render: (_, record) => {
        const totalPayable = toNumber(record.totalPayable)
        const socialInsurance = toNumber(record.personalInsuranceTotal)
        const tax = toNumber(record.personalIncomeTax)
        const actualAmount = totalPayable - socialInsurance - tax
        return (
          <span className="font-mono font-bold text-blue-600">
            ¥
            {actualAmount.toLocaleString('zh-CN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        )
      },
      align: 'right',
    },
    {
      title: '发放状态',
      key: 'status',
      width: 90,
      render: (_, record) => {
        const isPaid =
          toNumber(record.bankCardOrWechat) > 0 ||
          toNumber(record.cashPaid) > 0 ||
          toNumber(record.corporatePayment) > 0
        return (
          <Tag color={isPaid ? 'green' : 'orange'} className="text-xs">
            {isPaid ? '已发放' : '待发放'}
          </Tag>
        )
      },
      align: 'center',
    },
    {
      title: '确认状态',
      key: 'confirmation',
      width: 90,
      render: (_, record) => {
        return record.isConfirmed ? (
          <Tag icon={<CheckCircleOutlined />} color="success" className="text-xs">
            已确认
          </Tag>
        ) : (
          <Tag icon={<ClockCircleOutlined />} color="warning" className="text-xs">
            待确认
          </Tag>
        )
      },
      align: 'center',
    },
  ]

  // 安全的数值转换函数
  const toNumber = (value: any): number => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(num) ? 0 : num
  }

  const formatCurrency = (amount: number) =>
    `¥${amount.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  return (
    <div className="h-full flex flex-col">
      {/* 头部标题和操作 - 固定高度 */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50" style={{ height: '80px' }}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">薪资总览</h3>
          <div className="flex items-center space-x-2">
            <Button size="small" onClick={onRefresh} loading={loading}>
              刷新
            </Button>
            <Badge count={salaryData.length} showZero>
              <span className="text-sm text-gray-500">员工数量</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* 薪资列表表格 - 弹性高度 */}
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          dataSource={salaryData}
          loading={loading}
          pagination={false}
          scroll={{ y: 500, x: 800 }}
          rowKey="id"
          size="small"
          className="h-full"
          rowClassName={record => (selectedEmployee?.id === record.id ? 'bg-blue-50' : '')}
          onRow={record => ({
            onClick: () => onSelectEmployee(record),
            className: 'cursor-pointer hover:bg-gray-50',
          })}
        />
      </div>

      {/* 底部汇总 - 固定高度 */}
      <div className="flex-shrink-0 p-4 border-t bg-gray-50" style={{ height: '140px' }}>
        <div className="grid grid-cols-4 gap-4 text-sm mb-4">
          <div className="text-center">
            <div className="text-gray-500 mb-1">应发总额</div>
            <div className="font-bold text-green-600">
              {formatCurrency(statistics.totalPayable)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">社保总额</div>
            <div className="font-bold text-orange-600">
              {formatCurrency(statistics.totalSocialInsurance)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">个税总额</div>
            <div className="font-bold text-red-600">{formatCurrency(statistics.totalTax)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">实发总额</div>
            <div className="font-bold text-blue-600">{formatCurrency(statistics.totalActual)}</div>
          </div>
        </div>

        {/* 确认进度 */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 font-medium">员工确认进度</span>
            <span className="text-sm text-gray-500">
              {statistics.confirmedCount}/{statistics.employeeCount} 已确认
            </span>
          </div>
          <Progress
            percent={statistics.confirmationRate}
            status={statistics.confirmationRate === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#ff7875',
              '50%': '#ffa940',
              '100%': '#52c41a',
            }}
            format={percent => `${percent?.toFixed(0)}%`}
          />
        </div>
      </div>
    </div>
  )
}

export default SalaryOverview
