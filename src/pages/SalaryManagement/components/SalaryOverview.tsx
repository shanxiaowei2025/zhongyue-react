import React from 'react'
import { Table, Tag, Badge, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
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
      {/* 头部标题和操作 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center mb-4">
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

      {/* 薪资列表表格 */}
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          dataSource={salaryData}
          loading={loading}
          pagination={false}
          scroll={{ y: 'calc(100vh - 280px)', x: 800 }}
          rowKey="id"
          size="small"
          rowClassName={record => (selectedEmployee?.id === record.id ? 'bg-blue-50' : '')}
          onRow={record => ({
            onClick: () => onSelectEmployee(record),
            className: 'cursor-pointer hover:bg-gray-50',
          })}
        />
      </div>

      {/* 底部汇总 */}
      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500 mb-1">应发总额</div>
            <div className="font-bold text-green-600">
              {formatCurrency(
                salaryData.reduce((sum, item) => sum + toNumber(item.totalPayable), 0)
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">社保总额</div>
            <div className="font-bold text-orange-600">
              {formatCurrency(
                salaryData.reduce((sum, item) => sum + toNumber(item.personalInsuranceTotal), 0)
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">个税总额</div>
            <div className="font-bold text-red-600">
              {formatCurrency(
                salaryData.reduce((sum, item) => sum + toNumber(item.personalIncomeTax), 0)
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 mb-1">实发总额</div>
            <div className="font-bold text-blue-600">
              {formatCurrency(
                salaryData.reduce((sum, item) => {
                  const totalPayable = toNumber(item.totalPayable)
                  const socialInsurance = toNumber(item.personalInsuranceTotal)
                  const tax = toNumber(item.personalIncomeTax)
                  return sum + (totalPayable - socialInsurance - tax)
                }, 0)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalaryOverview
