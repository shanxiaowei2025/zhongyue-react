import React from 'react'
import { Table, Tag, Badge, Button } from 'antd'
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
      title: '补贴合计',
      dataIndex: 'totalSubsidy',
      width: 100,
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
      title: '代理费提成',
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
      title: '其他扣款',
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
      title: '银行卡/微信',
      dataIndex: 'bankCardOrWechat',
      width: 110,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
    },
    {
      title: '现金发放',
      dataIndex: 'cashPaid',
      width: 100,
      render: value => formatCurrency(toNumber(value)),
      align: 'right',
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
      width: 90,
      render: (_, record) => (
        <Tag
          icon={record.isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={record.isPaid ? 'green' : 'orange'}
          className="text-xs"
        >
          {record.isPaid ? '已发放' : '待发放'}
        </Tag>
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
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          dataSource={salaryData}
          loading={loading}
          pagination={false}
          scroll={{ y: 500, x: 2800 }}
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
