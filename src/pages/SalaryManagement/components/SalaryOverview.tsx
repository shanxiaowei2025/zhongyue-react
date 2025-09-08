import React, { useState, useEffect, useRef } from 'react'
import { Table, Tag, Badge, Button, Tooltip, InputNumber, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { SalaryRecord, SalaryStatistics } from '../../../types/salaryIntegrated'
import { salaryApi } from '../../../api/salaryIntegrated'

interface SalaryOverviewProps {
  salaryData: SalaryRecord[]
  loading: boolean
  selectedEmployee: SalaryRecord | null
  onSelectEmployee: (employee: SalaryRecord) => void
  onRefresh: () => void
  statistics: SalaryStatistics
  onMarkPaid?: (id: number) => Promise<void>
}

const SalaryOverview: React.FC<SalaryOverviewProps> = ({
  salaryData,
  loading,
  selectedEmployee,
  onSelectEmployee,
  onRefresh,
  statistics,
  onMarkPaid,
}) => {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, number>>({})
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [tableScrollY, setTableScrollY] = useState<number>(400)

  // 计算表格滚动区域高度
  useEffect(() => {
    const calculateScrollHeight = () => {
      if (tableContainerRef.current) {
        const containerHeight = tableContainerRef.current.clientHeight
        // 减去表头高度(约40px) + 底部边距(约20px) + 安全边距(约20px)
        setTableScrollY(containerHeight - 40)
      }
    }

    calculateScrollHeight()
    const resizeObserver = new ResizeObserver(calculateScrollHeight)

    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

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
      <div ref={tableContainerRef} className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          dataSource={salaryData}
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

      {/* 底部汇总 - 固定高度 */}
      <div className="flex-shrink-0 p-4 border-t bg-gray-50" style={{ height: '100px' }}>
        <div className="grid grid-cols-3 gap-4 text-sm">
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
        </div>
      </div>
    </div>
  )
}

export default SalaryOverview
