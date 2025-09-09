import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Table, Tag, Badge, Button, Tooltip, InputNumber, message, Drawer } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  EditOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import type { SalaryRecord, SalaryStatistics, SalaryQueryParams } from '../../../types/salaryIntegrated'
import { salaryApi } from '../../../api/salaryIntegrated'
import SalaryFilters from './SalaryFilters'

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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [clientFilters, setClientFilters] = useState<SalaryQueryParams>({})
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [tableScrollY, setTableScrollY] = useState<number>(400)

  // 计算表格滚动区域高度
  useEffect(() => {
    const calculateScrollHeight = () => {
      if (tableContainerRef.current) {
        const containerHeight = tableContainerRef.current.clientHeight
        // 只减去表头高度(约40px) - 让表格占满容器高度
        setTableScrollY(Math.max(containerHeight - 40, 300))
      }
    }

    calculateScrollHeight()
    const resizeObserver = new ResizeObserver(calculateScrollHeight)

    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  // 前端筛选逻辑
  const filteredSalaryData = useMemo(() => {
    if (!clientFilters || Object.keys(clientFilters).length === 0) {
      return salaryData
    }

    return salaryData.filter(item => {
      // 姓名筛选
      if (clientFilters.name && !item.name.toLowerCase().includes(clientFilters.name.toLowerCase())) {
        return false
      }

      // 部门筛选
      if (clientFilters.department && !item.department.toLowerCase().includes(clientFilters.department.toLowerCase())) {
        return false
      }

      // 类型筛选
      if (clientFilters.type && item.type !== clientFilters.type) {
        return false
      }

      // 发放公司筛选（前端筛选）
      if (clientFilters.payrollCompany) {
        // 优先使用payrollCompany字段，如果没有则使用company字段
        const companyField = item.payrollCompany || item.company
        if (!companyField || !companyField.toLowerCase().includes(clientFilters.payrollCompany.toLowerCase())) {
          return false
        }
      }

      // 发放状态筛选
      if (clientFilters.isPaid !== undefined && item.isPaid !== clientFilters.isPaid) {
        return false
      }

      // 确认状态筛选
      if (clientFilters.isConfirmed !== undefined && item.isConfirmed !== clientFilters.isConfirmed) {
        return false
      }

      // 年月筛选
      if (clientFilters.yearMonth && item.yearMonth !== clientFilters.yearMonth) {
        return false
      }

      // 数值范围筛选
      const numericFields = [
        { field: 'baseSalary', min: 'baseSalaryMin', max: 'baseSalaryMax' },
        { field: 'attendanceDeduction', min: 'attendanceDeductionMin', max: 'attendanceDeductionMax' },
        { field: 'temporaryIncrease', min: 'temporaryIncreaseMin', max: 'temporaryIncreaseMax' },
        { field: 'fullAttendance', min: 'fullAttendanceMin', max: 'fullAttendanceMax' },
        { field: 'departmentHeadSubsidy', min: 'departmentHeadSubsidyMin', max: 'departmentHeadSubsidyMax' },
        { field: 'positionAllowance', min: 'positionAllowanceMin', max: 'positionAllowanceMax' },
        { field: 'oilSubsidy', min: 'oilSubsidyMin', max: 'oilSubsidyMax' },
        { field: 'mealSubsidy', min: 'mealSubsidyMin', max: 'mealSubsidyMax' },
        { field: 'seniority', min: 'seniorityMin', max: 'seniorityMax' },
        { field: 'agencyFeeCommission', min: 'agencyFeeCommissionMin', max: 'agencyFeeCommissionMax' },
        { field: 'performanceCommission', min: 'performanceCommissionMin', max: 'performanceCommissionMax' },
        { field: 'businessCommission', min: 'businessCommissionMin', max: 'businessCommissionMax' },
        { field: 'otherDeductions', min: 'otherDeductionsMin', max: 'otherDeductionsMax' },
        { field: 'personalInsuranceTotal', min: 'personalInsuranceTotalMin', max: 'personalInsuranceTotalMax' },
        { field: 'companyInsuranceTotal', min: 'companyInsuranceTotalMin', max: 'companyInsuranceTotalMax' },
        { field: 'depositDeduction', min: 'depositDeductionMin', max: 'depositDeductionMax' },
        { field: 'personalIncomeTax', min: 'personalIncomeTaxMin', max: 'personalIncomeTaxMax' },
        { field: 'totalPayable', min: 'totalPayableMin', max: 'totalPayableMax' },
        { field: 'bankCardOrWechat', min: 'bankCardOrWechatMin', max: 'bankCardOrWechatMax' },
        { field: 'cashPaid', min: 'cashPaidMin', max: 'cashPaidMax' },
        { field: 'corporatePayment', min: 'corporatePaymentMin', max: 'corporatePaymentMax' },
        { field: 'taxDeclaration', min: 'taxDeclarationMin', max: 'taxDeclarationMax' },
      ]

      for (const { field, min, max } of numericFields) {
        const value = toNumber(item[field as keyof SalaryRecord])
        const minValue = clientFilters[min as keyof SalaryQueryParams] as number
        const maxValue = clientFilters[max as keyof SalaryQueryParams] as number
        
        if (minValue !== undefined && value < minValue) {
          return false
        }
        if (maxValue !== undefined && value > maxValue) {
          return false
        }
      }

      return true
    })
  }, [salaryData, clientFilters])

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
      totalCashPaid: data.reduce((sum, item) => sum + toNumber(item.cashPaid), 0), // 现金发放
      totalCorporatePayment: data.reduce((sum, item) => sum + toNumber(item.corporatePayment), 0), // 对公转账
      totalTaxDeclaration: data.reduce((sum, item) => sum + toNumber(item.taxDeclaration), 0), // 个税申报
    }
  }, [filteredSalaryData])

  // 筛选处理函数
  const handleFilter = (params: SalaryQueryParams) => {
    // 所有筛选条件都使用前端筛选，这样统计数据才能正确反映筛选后的结果
    setClientFilters(params)
    
    // 同时也发送给后端进行数据筛选（如果父组件需要）
    if (onFilter) {
      onFilter(params)
    }
    
    setFilterDrawerOpen(false)
  }

  const handleResetFilter = () => {
    setClientFilters({})
    if (onResetFilter) {
      onResetFilter()
    }
    // 重置时不关闭抽屉，保持筛选面板打开状态
  }

  // 可编辑单元格组件
  const EditableCell: React.FC<{
    value: number
    recordId: number
    field: 'bankCardOrWechat' | 'cashPaid'
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
        await onSave(recordId, field, inputValue)
        setEditingCell(null)
        // 保存成功后，更新编辑过的值记录
        setEditedValues(prev => ({
          ...prev,
          [cellKey]: inputValue,
        }))
        message.success('保存成功')
      } catch (error) {
        console.error('保存失败:', error)
        message.error('保存失败')
        setInputValue(displayValue) // 恢复为当前显示值
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
    // 不触发数据刷新，保持界面稳定
    message.success('保存成功')
  }
  const columns: ColumnsType<SalaryRecord> = [
    {
      title: '姓名',
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
      title: '部门',
      dataIndex: 'department',
      width: 100,
      ellipsis: true,
    },
    {
      title: '员工类型',
      dataIndex: 'type',
      width: 90,
      ellipsis: true,
    },
    {
      title: '发放公司',
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
      title: '工资基数',
      dataIndex: 'baseSalary',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '考勤扣款',
      dataIndex: 'attendanceDeduction',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: '临时增加',
      dataIndex: 'temporaryIncrease',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '全勤奖励',
      dataIndex: 'fullAttendance',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '部门负责人补贴',
      dataIndex: 'departmentHeadSubsidy',
      width: 130,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '岗位津贴',
      dataIndex: 'positionAllowance',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '油补',
      dataIndex: 'oilSubsidy',
      width: 80,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '餐补',
      dataIndex: 'mealSubsidy',
      width: 80,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '工龄津贴',
      dataIndex: 'seniority',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: (
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
        </span>
      ),
      dataIndex: 'agencyFeeCommission',
      width: 110,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '绩效提成',
      dataIndex: 'performanceCommission',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '业务提成',
      dataIndex: 'businessCommission',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '朋友圈扣款',
      dataIndex: 'otherDeductions',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: '个人医疗',
      dataIndex: 'personalMedical',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: '个人养老',
      dataIndex: 'personalPension',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: '个人失业',
      dataIndex: 'personalUnemployment',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: '社保合计',
      dataIndex: 'personalInsuranceTotal',
      width: 100,
      render: value => (
        <span className="font-medium text-red-500">-{formatCurrency(toNumber(value))}</span>
      ),
      align: 'right',
    },
    {
      title: '公司承担合计',
      dataIndex: 'companyInsuranceTotal',
      width: 110,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '保证金扣除',
      dataIndex: 'depositDeduction',
      width: 100,
      render: value => <span className="text-red-500">-{formatCurrency(toNumber(value))}</span>,
      align: 'right',
    },
    {
      title: '个税',
      dataIndex: 'personalIncomeTax',
      width: 100,
      render: value => (
        <span className="font-medium text-red-500">-{formatCurrency(toNumber(value))}</span>
      ),
      align: 'right',
    },
    {
      title: '应发合计',
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
      title: '银行卡号',
      dataIndex: 'bankCardNumber',
      width: 140,
      ellipsis: true,
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
      title: (
        <span>
          现金发放 <EditOutlined style={{ fontSize: '12px', color: '#1890ff', opacity: 0.8 }} />
        </span>
      ),
      dataIndex: 'cashPaid',
      width: 100,
      render: (value, record) => (
        <EditableCell
          value={toNumber(value)}
          recordId={record.id}
          field="cashPaid"
          onSave={handleSaveField}
        />
      ),
      align: 'right',
      onCell: () => ({
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
      }),
    },
    {
      title: '对公转账',
      dataIndex: 'corporatePayment',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '个税申报',
      dataIndex: 'taxDeclaration',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '确认状态',
      key: 'confirmation',
      width: 90,
      render: (_, record) => (
        <Tag
          icon={record.isConfirmed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={record.isConfirmed ? 'success' : 'warning'}
          className="text-xs"
        >
          {record.isConfirmed ? '已确认' : '待确认'}
        </Tag>
      ),
      align: 'center',
    },
    {
      title: '发放状态',
      key: 'paymentStatus',
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
            <Button
              type="link"
              size="small"
              className="text-xs p-0 h-auto"
              onClick={e => {
                e.stopPropagation()
                onMarkPaid(record.id)
              }}
            >
              已发放
            </Button>
          )}
        </div>
      ),
      align: 'center',
    },
  ]

  const formatCurrency = (amount: number | string | undefined | null): string => {
    const num = toNumber(amount)
    return `¥${num.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部标题和操作 - 固定高度 */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50" style={{ height: '80px' }}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">薪资总览</h3>
          <div className="flex items-center space-x-2">
            <Button 
              size="small" 
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerOpen(true)}
            >
              筛选
            </Button>
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
      <div ref={tableContainerRef} className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredSalaryData}
          loading={loading}
          pagination={false}
          scroll={{
            x: 2920,
            y: tableScrollY,
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

      {/* 底部汇总 */}
      <div className="flex-shrink-0 p-4 border-t bg-gray-50" style={{ height: '190px' }}>
                  {/* 汇总标题栏 */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700">数据总计</h3>
            <div className="flex items-center space-x-2">
            </div>
          </div>

        {/* 薪酬汇总统计 - 滚动区域 */}
        <div className="h-28 overflow-y-auto">
          <div className="space-y-3">
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

            {/* 第四行：发放方式（6个字段） */}
            <div className="grid grid-cols-6 gap-2 text-xs">
              <div className="text-center">
                <div className="text-gray-500 mb-1">银行卡/微信</div>
                <div className="font-bold text-blue-600">
                  {formatCurrency(filteredStatistics.totalBankCardOrWechat)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 mb-1">现金发放</div>
                <div className="font-bold text-blue-600">
                  {formatCurrency(filteredStatistics.totalCashPaid)}
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
            </div>
          </div>
        </div>
      </div>

      {/* 筛选抽屉 */}
      <Drawer
        title="薪资筛选"
        placement="right"
        onClose={() => setFilterDrawerOpen(false)}
        open={filterDrawerOpen}
        width={650}
      >
        <SalaryFilters
          onFilter={handleFilter}
          onReset={handleResetFilter}
          loading={loading}
        />
      </Drawer>
    </div>
  )
}

export default SalaryOverview
