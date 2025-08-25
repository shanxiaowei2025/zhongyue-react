import React from 'react'
import { Badge, Tooltip } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { SalaryRecord } from '../../../types/salaryIntegrated'

interface CompactEmployeeListProps {
  salaryData: SalaryRecord[]
  selectedEmployee: SalaryRecord | null
  onSelectEmployee: (employee: SalaryRecord) => void
}

const CompactEmployeeList: React.FC<CompactEmployeeListProps> = ({
  salaryData,
  selectedEmployee,
  onSelectEmployee,
}) => {
  const formatCurrency = (amount: number) =>
    `¥${amount.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  const toNumber = (value: any): number => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(num) ? 0 : num
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 - 紧凑版本 */}
      <div className="flex-shrink-0 p-1 border-b bg-gray-50">
        <div className="text-center">
          <div className="text-xs font-medium text-gray-700">员工</div>
          <Badge count={salaryData.length} showZero size="small" className="mt-1" />
        </div>
      </div>

      {/* 员工列表 - 紧凑版本 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-1 space-y-1">
          {salaryData.map(employee => (
            <Tooltip
              key={employee.id}
              title={
                <div className="text-xs">
                  <div className="font-medium mb-2">
                    {employee.name} - {employee.department}
                  </div>
                  <div className="mb-1">
                    应发: {formatCurrency(toNumber(employee.totalPayable))}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center">
                      {employee.isConfirmed ? (
                        <CheckCircleOutlined className="text-green-500 text-xs mr-1" />
                      ) : (
                        <ClockCircleOutlined className="text-orange-500 text-xs mr-1" />
                      )}
                      <span>{employee.isConfirmed ? '已确认' : '待确认'}</span>
                    </div>
                    <div className="flex items-center">
                      {employee.isPaid ? (
                        <CheckCircleOutlined className="text-green-500 text-xs mr-1" />
                      ) : (
                        <ClockCircleOutlined className="text-orange-500 text-xs mr-1" />
                      )}
                      <span>{employee.isPaid ? '已发放' : '待发放'}</span>
                    </div>
                  </div>
                </div>
              }
              placement="right"
            >
              <div
                className={`
                  cursor-pointer p-2 rounded transition-all duration-200 border text-center
                  ${
                    selectedEmployee?.id === employee.id
                      ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium shadow-sm'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }
                `}
                onClick={() => onSelectEmployee(employee)}
              >
                {/* 员工姓名 - 垂直显示 */}
                <div className="text-xs font-medium mb-1 leading-tight">{employee.name}</div>

                {/* 状态指示器 - 简化版 */}
                <div className="flex items-center justify-center space-x-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      employee.isConfirmed ? 'bg-green-400' : 'bg-orange-400'
                    }`}
                    title={employee.isConfirmed ? '已确认' : '待确认'}
                  ></div>
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      employee.isPaid ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                    title={employee.isPaid ? '已发放' : '待发放'}
                  ></div>
                </div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CompactEmployeeList
