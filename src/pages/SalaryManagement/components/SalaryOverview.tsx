import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Table, Tag, Badge, Button, Tooltip, InputNumber, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  EditOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import type { SalaryRecord, SalaryStatistics, SalaryQueryParams } from '../../../types/salaryIntegrated'
import { salaryApi } from '../../../api/salaryIntegrated'
import ColumnFilter from '../../../components/ColumnFilter'

interface SalaryOverviewProps {
  salaryData: SalaryRecord[]
  loading: boolean
  selectedEmployee: SalaryRecord | null
  onSelectEmployee: (employee: SalaryRecord) => void
  onRefresh: () => void
  statistics: SalaryStatistics
  onMarkPaid?: (id: number) => Promise<void>
  onFilter?: (params: SalaryQueryParams) => void
  onResetFilter?: () => void
}

const SalaryOverview: React.FC<SalaryOverviewProps> = ({
  salaryData,
  loading,
  selectedEmployee,
  onSelectEmployee,
  onRefresh,
  statistics,
  onMarkPaid,
  onFilter,
  onResetFilter,
}) => {
  // 安全的数值转换函数
  const toNumber = (value: any): number => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(num) ? 0 : num
  }

  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, number>>({})
  // 添加列筛选状态
  const [columnFilters, setColumnFilters] = useState<Record<string, any[]>>({})
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [tableScrollY, setTableScrollY] = useState<number>(400)
  
  // 当 salaryData 更新时，清理已经过期的 editedValues
  useEffect(() => {
    // 清理所有临时编辑值，让新数据生效
    setEditedValues({})
  }, [salaryData])
  
  // 拖拽调整高度的状态
  const [tableHeight, setTableHeight] = useState<number>(260)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 固定表格高度 - 显示5条数据
  useEffect(() => {
    // 表头高度40px + 5行数据(每行32px) + 横向滚动条20px = 220px
    setTableScrollY(220)
  }, [])

  // 处理拖拽时的全局样式
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  // 前端筛选逻辑 - 只使用列筛选
  const filteredSalaryData = useMemo(() => {
    let result = salaryData

    // 应用列筛选条件
    if (Object.keys(columnFilters).length > 0) {
      result = result.filter(item => {
        for (const [dataIndex, filterValues] of Object.entries(columnFilters)) {
          if (filterValues && filterValues.length > 0) {
            // 检查是否为范围筛选
            if (Array.isArray(filterValues[0]) && filterValues[0].length === 2) {
              // 范围筛选逻辑
              const itemValue = toNumber(item[dataIndex as keyof SalaryRecord])
              for (const [operator, value] of filterValues) {
                if (operator === '>=' && itemValue < value) {
                  return false
                }
                if (operator === '<=' && itemValue > value) {
                  return false
                }
              }
            } else {
              // 普通值筛选
              const itemValue = item[dataIndex as keyof SalaryRecord]
              
              // 支持空值筛选：检查筛选值中是否包含空字符串
              const hasEmptyFilter = filterValues.includes('')
              const isEmptyValue = itemValue === null || itemValue === undefined || itemValue === ''
              
              // 如果筛选值中包含空字符串，且当前值为空，则匹配成功
              if (hasEmptyFilter && isEmptyValue) {
                continue // 继续检查其他筛选条件
              }
              
              // 如果筛选值中包含空字符串，但当前值不为空，检查是否匹配其他筛选值
              if (hasEmptyFilter && !isEmptyValue) {
                const nonEmptyFilters = filterValues.filter(v => v !== '')
                if (nonEmptyFilters.length === 0 || !nonEmptyFilters.includes(itemValue)) {
                  return false
                }
              } else if (!hasEmptyFilter && !filterValues.includes(itemValue)) {
                // 如果筛选值中不包含空字符串，使用原有逻辑
                return false
              }
            }
          }
        }
        return true
      })
    }

    return result
  }, [salaryData, columnFilters])

  // 计算筛选后数据的统计信息
  const filteredStatistics = useMemo(() => {
    const data = filteredSalaryData // 使用筛选后的数据
    
    return {
      employeeCount: data.length,
      confirmedCount: data.filter(item => item.isConfirmed).length,
      paidCount: data.filter(item => item.isPaid).length,
      confirmationRate: data.length > 0 ? (data.filter(item => item.isConfirmed).length / data.length) * 100 : 0,
      paidRate: data.length > 0 ? (data.filter(item => item.isPaid).length / data.length) * 100 : 0,
      
      // 详细薪酬项目统计 - 使用安全的数值转换
      totalBaseSalary: data.reduce((sum, item) => sum + toNumber(item.baseSalary), 0), // 工资基数
      totalAttendanceDeduction: data.reduce((sum, item) => sum + toNumber(item.attendanceDeduction), 0), // 考勤扣款
      totalTemporaryIncrease: data.reduce((sum, item) => sum + toNumber(item.temporaryIncrease), 0), // 临时增加
      totalFullAttendance: data.reduce((sum, item) => sum + toNumber(item.fullAttendance), 0), // 全勤奖励
      totalDepartmentHeadSubsidy: data.reduce((sum, item) => sum + toNumber(item.departmentHeadSubsidy), 0), // 部门负责人补贴
      totalPositionAllowance: data.reduce((sum, item) => sum + toNumber(item.positionAllowance), 0), // 岗位津贴
      totalOilSubsidy: data.reduce((sum, item) => sum + toNumber(item.oilSubsidy), 0), // 油补
      totalMealSubsidy: data.reduce((sum, item) => sum + toNumber(item.mealSubsidy), 0), // 餐补
      totalSeniority: data.reduce((sum, item) => sum + toNumber(item.seniority), 0), // 工龄津贴
      totalAgencyFeeCommission: data.reduce((sum, item) => sum + toNumber(item.agencyFeeCommission), 0), // 代理费提成
      totalPerformanceCommission: data.reduce((sum, item) => sum + toNumber(item.performanceCommission), 0), // 绩效提成
      totalBusinessCommission: data.reduce((sum, item) => sum + toNumber(item.businessCommission), 0), // 业务提成
      totalOtherDeductions: data.reduce((sum, item) => sum + toNumber(item.otherDeductions), 0), // 朋友圈扣款
      totalPersonalInsurance: data.reduce((sum, item) => sum + toNumber(item.personalInsuranceTotal), 0), // 社保合计
      totalCompanyInsurance: data.reduce((sum, item) => sum + toNumber(item.companyInsuranceTotal), 0), // 公司承担合计
      totalDepositDeduction: data.reduce((sum, item) => sum + toNumber(item.depositDeduction), 0), // 保证金扣除
      totalPersonalIncomeTax: data.reduce((sum, item) => sum + toNumber(item.personalIncomeTax), 0), // 个税
      totalPayable: data.reduce((sum, item) => sum + toNumber(item.totalPayable), 0), // 应发合计
      totalBankCardOrWechat: data.reduce((sum, item) => sum + toNumber(item.bankCardOrWechat), 0), // 银行卡/微信
      totalCorporatePayment: data.reduce((sum, item) => sum + toNumber(item.corporatePayment), 0), // 对公转账
      totalTaxDeclaration: data.reduce((sum, item) => sum + toNumber(item.taxDeclaration), 0), // 个税申报
    }
  }, [filteredSalaryData])

  // 重置筛选
  const handleResetFilter = () => {
    setColumnFilters({}) // 重置列筛选
    if (onResetFilter) {
      onResetFilter()
    }
  }

  // 列筛选处理函数
  const handleColumnFilter = (dataIndex: string, filteredValue: any[] | null) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev }
      if (filteredValue && filteredValue.length > 0) {
        newFilters[dataIndex] = filteredValue
      } else {
        delete newFilters[dataIndex]
      }
      return newFilters
    })
  }

  // 创建带筛选器的列标题
  const createFilterTitle = (
    title: string | React.ReactNode, 
    dataIndex: string, 
    type: 'text' | 'select' | 'number' | 'range' = 'select',
    supportEmptyFilter: boolean = false
  ) => {
    return (
      <div 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span>{title}</span>
        <div>
          <ColumnFilter
            type={type}
            data={salaryData}
            dataIndex={dataIndex}
            filteredValue={columnFilters[dataIndex]}
            onFilter={(filteredValue) => handleColumnFilter(dataIndex, filteredValue)}
            maxOptions={50}
            supportEmptyFilter={supportEmptyFilter}
          />
        </div>
      </div>
    )
  }

  // 可编辑单元格组件
  const EditableCell: React.FC<{
    value: number
    recordId: number
    field: 'bankCardOrWechat'
    onSave: (recordId: number, field: string, value: number) => Promise<void>
  }> = React.memo(({ value, recordId, field, onSave }) => {
    const cellKey = `${recordId}-${field}`
    const isEditing = editingCell === cellKey

    // 获取要显示的值：如果有编辑过的值就显示编辑过的，否则显示原始值
    const displayValue = editedValues[cellKey] !== undefined ? editedValues[cellKey] : value
    const [inputValue, setInputValue] = useState(displayValue)

    // 当displayValue变化时，如果不在编辑状态，则同步更新inputValue
    useEffect(() => {
      if (!isEditing) {
        setInputValue(displayValue)
      }
    }, [displayValue, isEditing])

    const handleEdit = async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isEditing) return

      // 直接切换到新的编辑状态，设置输入值为当前显示值
      setEditingCell(cellKey)
      setInputValue(displayValue) // 重要：使用当前显示的值，而不是原始值
    }

    const handleBlur = async () => {
      // 失去焦点时保存
      if (inputValue === displayValue) {
        setEditingCell(null)
        return
      }

      try {
        setEditingCell(null)
        // 先临时保存编辑值，以便在数据刷新前显示
        setEditedValues(prev => ({
          ...prev,
          [cellKey]: inputValue,
        }))
        await onSave(recordId, field, inputValue)
        message.success('保存成功')
        // 数据会通过 onRefresh 自动刷新，不需要手动处理
      } catch (error) {
        console.error('保存失败:', error)
        message.error('保存失败')
        setInputValue(displayValue) // 恢复为当前显示值
        // 移除临时保存的编辑值
        setEditedValues(prev => {
          const newValues = { ...prev }
          delete newValues[cellKey]
          return newValues
        })
      }
    }

    const handleInputChange = (val: number | null) => {
      setInputValue(val !== null ? val : 0)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleBlur()
      } else if (e.key === 'Escape') {
        setEditingCell(null)
        setInputValue(displayValue) // 恢复为当前显示值
      }
    }

    if (isEditing) {
      return (
        <div onClick={e => e.stopPropagation()}>
          <InputNumber
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyPress}
            min={0}
            precision={2}
            style={{ width: '100%' }}
            autoFocus
            placeholder="请输入金额"
          />
        </div>
      )
    }

    return (
      <div
        className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors"
        onClick={handleEdit}
      >
        {formatCurrency(toNumber(displayValue))}
      </div>
    )
  })

  // 保存编辑的函数
  const handleSaveField = async (recordId: number, field: string, value: number) => {
    await salaryApi.updateSalary(recordId, { [field]: value })
    // 保存成功后刷新数据，以获取后端计算的对公转账等字段
    onRefresh()
  }
  const columns: ColumnsType<SalaryRecord> = [
    {
      title: createFilterTitle('姓名', 'name'),
      dataIndex: 'name',
      width: 90,
      fixed: 'left',
      render: (text, record) => (
        <div
          className={`cursor-pointer p-1 rounded transition-colors text-xs ${
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
      title: createFilterTitle('部门', 'department'),
      dataIndex: 'department',
      width: 100,
      ellipsis: true,
    },
    {
      title: createFilterTitle('员工类型', 'type'),
      dataIndex: 'type',
      width: 90,
      ellipsis: true,
    },
    {
      title: createFilterTitle('薪资发放公司', 'payrollCompany', 'select', true),
      dataIndex: 'payrollCompany',
      width: 120,
      ellipsis: true,
      render: (text) => (
        <span className="text-gray-700 text-xs">
          {text || '-'}
        </span>
      ),
    },
    {
      title: createFilterTitle('工资基数', 'baseSalary', 'range'),
      dataIndex: 'baseSalary',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('考勤扣款', 'attendanceDeduction', 'range'),
      dataIndex: 'attendanceDeduction',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: createFilterTitle('临时增加', 'temporaryIncrease', 'range'),
      dataIndex: 'temporaryIncrease',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('全勤奖励', 'fullAttendance', 'range'),
      dataIndex: 'fullAttendance',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('部门负责人补贴', 'departmentHeadSubsidy', 'range'),
      dataIndex: 'departmentHeadSubsidy',
      width: 130,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('岗位津贴', 'positionAllowance', 'range'),
      dataIndex: 'positionAllowance',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('油补', 'oilSubsidy', 'range'),
      dataIndex: 'oilSubsidy',
      width: 80,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('餐补', 'mealSubsidy', 'range'),
      dataIndex: 'mealSubsidy',
      width: 80,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('工龄津贴', 'seniority', 'range'),
      dataIndex: 'seniority',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle(
        <span>
          代理费提成{' '}
          <Tooltip
            title={
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>代理费提成比例</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #d9d9d9' }}>
                        续费
                      </td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #d9d9d9' }}>1%</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px' }}>软件费、地址费</td>
                      <td style={{ padding: '4px 8px' }}>10%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            }
            placement="top"
          >
            <QuestionCircleOutlined style={{ fontSize: '12px', color: '#999' }} />
          </Tooltip>
        </span>,
        'agencyFeeCommission',
        'range'
      ),
      dataIndex: 'agencyFeeCommission',
      width: 110,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('绩效提成', 'performanceCommission', 'range'),
      dataIndex: 'performanceCommission',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('业务提成', 'businessCommission', 'range'),
      dataIndex: 'businessCommission',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('朋友圈扣款', 'otherDeductions', 'range'),
      dataIndex: 'otherDeductions',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: createFilterTitle('个人医疗', 'personalMedical', 'range'),
      dataIndex: 'personalMedical',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: createFilterTitle('个人养老', 'personalPension', 'range'),
      dataIndex: 'personalPension',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: createFilterTitle('个人失业', 'personalUnemployment', 'range'),
      dataIndex: 'personalUnemployment',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: createFilterTitle('社保合计', 'personalInsuranceTotal', 'range'),
      dataIndex: 'personalInsuranceTotal',
      width: 100,
      render: value => (
        <span className="font-medium text-red-500">-{formatCurrency(toNumber(value))}</span>
      ),
      align: 'right',
    },
    {
      title: createFilterTitle('公司承担合计', 'companyInsuranceTotal', 'range'),
      dataIndex: 'companyInsuranceTotal',
      width: 110,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('保证金扣除', 'depositDeduction', 'range'),
      dataIndex: 'depositDeduction',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: createFilterTitle('个税', 'personalIncomeTax', 'range'),
      dataIndex: 'personalIncomeTax',
      width: 100,
      render: value => (
        <span className="font-medium text-red-500">-{formatCurrency(toNumber(value))}</span>
      ),
      align: 'right',
    },
    {
      title: createFilterTitle('应发合计', 'totalPayable', 'range'),
      dataIndex: 'totalPayable',
      width: 120,
      render: value => (
        <span className="font-mono font-bold text-green-600">
          {formatCurrency(toNumber(value))}
        </span>
      ),
      align: 'right',
    },
    {
      title: (
        <span>
          银行卡/微信 <EditOutlined style={{ fontSize: '12px', color: '#1890ff', opacity: 0.8 }} />
        </span>
      ),
      dataIndex: 'bankCardOrWechat',
      width: 110,
      render: (value, record) => (
        <EditableCell
          value={toNumber(value)}
          recordId={record.id}
          field="bankCardOrWechat"
          onSave={handleSaveField}
        />
      ),
      align: 'right',
      onCell: () => ({
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
      }),
    },
    {
      title: createFilterTitle('对公转账', 'corporatePayment', 'range'),
      dataIndex: 'corporatePayment',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: createFilterTitle('个税申报', 'taxDeclaration', 'range'),
      dataIndex: 'taxDeclaration',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: (
        <div 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span>确认状态</span>
          <div>
            <ColumnFilter
              type="select"
              data={salaryData}
              dataIndex="isConfirmed"
              filteredValue={columnFilters.isConfirmed}
              onFilter={(filteredValue) => handleColumnFilter('isConfirmed', filteredValue)}
              formatter={(value) => value ? '已确认' : '待确认'}
              maxOptions={50}
            />
          </div>
        </div>
      ),
      key: 'confirmation',
      dataIndex: 'isConfirmed',
      width: 120,
      render: (_, record) => (
        <div className="flex flex-col items-center space-y-1">
          <Tag
            icon={record.isConfirmed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            color={record.isConfirmed ? 'success' : 'warning'}
            className="text-xs"
          >
            {record.isConfirmed ? '已确认' : '待确认'}
          </Tag>
          {record.isConfirmed && (
            <Tag
              icon={<CloseCircleOutlined />}
              color="default"
              className="text-xs cursor-pointer"
              onClick={async (e) => {
                e.stopPropagation()
                try {
                  await salaryApi.unconfirmSalary(record.id)
                  message.success('已取消确认')
                  onRefresh()
                } catch (error) {
                  console.error('取消确认失败:', error)
                  message.error('取消确认失败')
                }
              }}
            >
              取消确认
            </Tag>
          )}
        </div>
      ),
      align: 'center',
    },
    {
      title: (
        <div 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span>发放状态</span>
          <div>
            <ColumnFilter
              type="select"
              data={salaryData}
              dataIndex="isPaid"
              filteredValue={columnFilters.isPaid}
              onFilter={(filteredValue) => handleColumnFilter('isPaid', filteredValue)}
              formatter={(value) => value ? '已发放' : '待发放'}
              maxOptions={50}
            />
          </div>
        </div>
      ),
      key: 'paymentStatus',
      dataIndex: 'isPaid',
      width: 120,
      render: (_, record) => (
        <div className="flex flex-col items-center space-y-1">
          <Tag
            icon={record.isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            color={record.isPaid ? 'green' : 'orange'}
            className="text-xs"
          >
            {record.isPaid ? '已发放' : '待发放'}
          </Tag>
          {!record.isPaid && onMarkPaid && (
            <Tag
              icon={<CheckCircleOutlined />}
              color="green"
              className="text-xs cursor-pointer"
              onClick={e => {
                e.stopPropagation()
                onMarkPaid(record.id)
              }}
            >
              已发放
            </Tag>
          )}
        </div>
      ),
      align: 'center',
    },
  ]

  // 拖拽处理函数
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    const startY = e.clientY
    const startHeight = tableHeight
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY
      const newHeight = Math.max(200, Math.min(600, startHeight + deltaY)) // 限制最小200px，最大600px
      setTableHeight(newHeight)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [tableHeight])

  const formatCurrency = (amount: number | string | undefined | null): string => {
    const num = toNumber(amount)
    return `¥${num.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div 
      ref={containerRef} 
      className={`h-full flex flex-col ${isDragging ? 'select-none' : ''}`}
      style={{ cursor: isDragging ? 'row-resize' : 'default' }}
    >
      {/* 头部标题和操作 - 固定高度 */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50" style={{ height: '60px' }}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">薪资总览</h3>
          <div className="flex items-center space-x-2">
            {Object.keys(columnFilters).length > 0 && (
              <Button 
                size="small" 
                onClick={() => setColumnFilters({})}
                type="dashed"
              >
                清除列筛选
              </Button>
            )}
            <Button size="small" onClick={onRefresh} loading={loading}>
              刷新
            </Button>
            <Badge count={filteredSalaryData.length} showZero>
              <span className="text-sm text-gray-500">显示数量</span>
            </Badge>
            <Badge count={salaryData.length} showZero color="blue">
              <span className="text-sm text-gray-500">总数量</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* 薪资列表表格 - 可调整高度 */}
      <div ref={tableContainerRef} className="flex-shrink-0" style={{ height: `${tableHeight}px` }}>
        <Table
          columns={columns}
          dataSource={filteredSalaryData}
          loading={loading}
          pagination={false}
          scroll={{
            x: 2920,
            y: tableHeight - 40, // 减去表头高度
          }}
          rowKey="id"
          size="small"
          rowClassName={record => (selectedEmployee?.id === record.id ? 'bg-blue-50' : '')}
          onRow={record => ({
            onClick: () => onSelectEmployee(record),
            className: 'cursor-pointer hover:bg-gray-50',
          })}
        />
      </div>

      {/* 可拖拽的分隔条 */}
      <div
        className={`flex-shrink-0 border-t border-b bg-gray-200 hover:bg-gray-300 cursor-row-resize transition-colors duration-200 ${
          isDragging ? 'bg-blue-300' : ''
        }`}
        style={{ 
          height: '6px',
          position: 'relative'
        }}
        onMouseDown={handleMouseDown}
      >
        {/* 拖拽指示器 */}
        <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* 底部汇总 - 使用剩余空间 */}
      <div className="flex-1 p-3 bg-gray-50 overflow-y-auto" style={{ minHeight: '160px' }}>
        {/* 汇总标题栏 */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">数据总计</h3>
        </div>

        {/* 薪酬汇总统计 - 紧凑显示 */}
        <div className="space-y-2">
          {/* 第一行：基础薪酬（6个字段） */}
          <div className="grid grid-cols-6 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-500 mb-1">工资基数</div>
              <div className="font-bold text-blue-600">
                {formatCurrency(filteredStatistics.totalBaseSalary)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">考勤扣款</div>
              <div className="font-bold text-red-600">
                {formatCurrency(filteredStatistics.totalAttendanceDeduction)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">临时增加</div>
              <div className="font-bold text-green-600">
                {formatCurrency(filteredStatistics.totalTemporaryIncrease)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">全勤奖励</div>
              <div className="font-bold text-green-600">
                {formatCurrency(filteredStatistics.totalFullAttendance)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">部门负责人补贴</div>
              <div className="font-bold text-blue-600">
                {formatCurrency(filteredStatistics.totalDepartmentHeadSubsidy)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">岗位津贴</div>
              <div className="font-bold text-blue-600">
                {formatCurrency(filteredStatistics.totalPositionAllowance)}
              </div>
            </div>
          </div>

          {/* 第二行：津贴提成（6个字段） */}
          <div className="grid grid-cols-6 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-500 mb-1">油补</div>
              <div className="font-bold text-blue-600">
                {formatCurrency(filteredStatistics.totalOilSubsidy)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">餐补</div>
              <div className="font-bold text-blue-600">
                {formatCurrency(filteredStatistics.totalMealSubsidy)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">工龄津贴</div>
              <div className="font-bold text-blue-600">
                {formatCurrency(filteredStatistics.totalSeniority)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">代理费提成</div>
              <div className="font-bold text-green-600">
                {formatCurrency(filteredStatistics.totalAgencyFeeCommission)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">绩效提成</div>
              <div className="font-bold text-green-600">
                {formatCurrency(filteredStatistics.totalPerformanceCommission)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">业务提成</div>
              <div className="font-bold text-green-600">
                {formatCurrency(filteredStatistics.totalBusinessCommission)}
              </div>
            </div>
          </div>

          {/* 第三行：扣除项目（6个字段） */}
          <div className="grid grid-cols-6 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-500 mb-1">朋友圈扣款</div>
              <div className="font-bold text-red-600">
                {formatCurrency(filteredStatistics.totalOtherDeductions)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">社保合计</div>
              <div className="font-bold text-orange-600">
                {formatCurrency(filteredStatistics.totalPersonalInsurance)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">公司承担合计</div>
              <div className="font-bold text-orange-600">
                {formatCurrency(filteredStatistics.totalCompanyInsurance)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">保证金扣除</div>
              <div className="font-bold text-red-600">
                {formatCurrency(filteredStatistics.totalDepositDeduction)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">个税</div>
              <div className="font-bold text-red-600">
                {formatCurrency(filteredStatistics.totalPersonalIncomeTax)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">应发合计</div>
              <div className="font-bold text-green-600">
                {formatCurrency(filteredStatistics.totalPayable)}
              </div>
            </div>
          </div>

          {/* 第四行：发放方式（5个字段） */}
          <div className="grid grid-cols-6 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-500 mb-1">银行卡/微信</div>
              <div className="font-bold text-blue-600">
                {formatCurrency(filteredStatistics.totalBankCardOrWechat)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">对公转账</div>
              <div className="font-bold text-blue-600">
                {formatCurrency(filteredStatistics.totalCorporatePayment)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">个税申报</div>
              <div className="font-bold text-purple-600">
                {formatCurrency(filteredStatistics.totalTaxDeclaration)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">总条目</div>
              <div className="font-bold text-gray-600">
                {filteredStatistics.employeeCount} 条
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1"></div>
              <div className="font-bold text-gray-600">
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1"></div>
              <div className="font-bold text-gray-600">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalaryOverview
