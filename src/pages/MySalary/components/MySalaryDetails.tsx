import React, { useState, useEffect, useMemo } from 'react'
import { Card, Descriptions, Typography, Tag, Button, Alert, Table, Spin, Empty, Modal, Tabs } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { MySalaryRecord } from '../../../types/mySalary'
import type { Expense } from '../../../types/expense'
import { useExpenseList } from '../../../hooks/useExpense'
import PerformanceDeductionsEditor from '../../SalaryManagement/components/PerformanceDeductionsEditor'

const { Title, Text } = Typography

interface MySalaryDetailsProps {
  detail: MySalaryRecord | null
  onConfirm?: () => void
  loading?: boolean
}

const MySalaryDetails: React.FC<MySalaryDetailsProps> = ({
  detail,
  onConfirm,
  loading = false,
}) => {
  const [fullscreenTable, setFullscreenTable] = useState(false)
  const [currentExpenseType, setCurrentExpenseType] = useState<'new-or-empty' | 'renewal'>('new-or-empty')

  // 构建费用查询参数
  const expenseParams = useMemo(() => {
    if (!detail?.name || !detail?.yearMonth) {
      return null
    }

    // 时间范围：当月1号到当月月底
    const monthStart = dayjs(detail.yearMonth).startOf('month').format('YYYY-MM-DD')
    const monthEnd = dayjs(detail.yearMonth).endOf('month').format('YYYY-MM-DD')

    return {
      page: 1,
      pageSize: 1000,
      salesperson: detail.name,
      status: 1, // 已审核
      chargeDateStart: monthStart,
      chargeDateEnd: monthEnd,
    }
  }, [detail?.name, detail?.yearMonth])

  // 使用 hook 获取费用数据
  const { expenses, isLoading: expenseLoading } = useExpenseList(
    expenseParams || {
      page: 1,
      pageSize: 10,
    }
  )

  // 根据业务类型过滤收据
  const newOrEmptyExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const businessType = expense.businessType?.trim() || ''
      const socialInsuranceBusinessType = expense.socialInsuranceBusinessType?.trim() || ''
      return (businessType === '' || businessType === '-' || businessType === '新增') && 
             (socialInsuranceBusinessType === '' || socialInsuranceBusinessType === '-' || socialInsuranceBusinessType === '新增')
    })
  }, [expenses])

  const renewalExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const businessType = expense.businessType?.trim() || ''
      const socialInsuranceBusinessType = expense.socialInsuranceBusinessType?.trim() || ''
      return (businessType === '续费' && (socialInsuranceBusinessType === '' || socialInsuranceBusinessType === '-' || socialInsuranceBusinessType === '续费')) || 
             (businessType === '' || businessType === '-') && socialInsuranceBusinessType === '续费'
    })
  }, [expenses])

  // 全屏时阻止body滚动
  useEffect(() => {
    if (fullscreenTable) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // 清理函数
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [fullscreenTable])

  if (!detail) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          <Text>请选择一条薪资记录查看详情</Text>
        </div>
      </Card>
    )
  }

  const formatCurrency = (amount: string | number | undefined | null) => {
    if (amount === undefined || amount === null || amount === '' || isNaN(Number(amount))) {
      return '¥0.00'
    }
    const numAmount = Number(amount)
    return `¥${numAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
  }

  // 安全的数值转换函数
  const toNumber = (value: unknown): number => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(num) ? 0 : num
  }

  // 费用类型映射
  const FEE_TYPE_MAP = {
    agencyFee: '代理费',
    addressFee: '地址费',
    accountingSoftwareFee: '记账软件费',
    socialInsuranceAgencyFee: '社保代理费',
    housingFundAgencyFee: '公积金代理费',
    licenseFee: '行政许可证',
    brandFee: '牌子费',
    recordSealFee: '备案章费',
    generalSealFee: '一般刻章费',
    invoiceSoftwareFee: '开票软件费',
    statisticalReportFee: '统计局报表费',
    customerDataOrganizationFee: '客户资料整理费',
    changeFee: '变更收费',
    administrativeLicenseFee: '行政许可收费',
      otherBusinessFee: '其他业务收费（基础）',
    otherBusinessOutsourcingFee: '其他业务收费',
    otherBusinessSpecialFee: '其他业务收费(特殊)',
  }

  // 提成类型映射
  const COMMISSION_TYPE_MAP = {
    businessCommissionOwn: '基础业务提成',
    businessCommissionOutsource: '外包业务提成',
    specialBusinessCommission: '特殊业务提成',
    agencyCommission: '代理费提成',
  }

  // 数据透视转换：将费用列表转换为表格数据
  const transformToTableData = (expenseList: Expense[]) => {
    // 按公司分组
    const companyMap = new Map<string, Record<string, any>>()
    // 记录哪些列有数据
    const columnsWithData = new Set<string>()
    // 必须显示的列
    const requiredColumns = [
      'businessCommissionOwn', 'businessCommissionOutsource', 'specialBusinessCommission', 
      'agencyCommission', 'basicBusinessPerformance', 'outsourcingBusinessPerformance'
    ]

    expenseList.forEach(expense => {
      const companyName = expense.companyName
      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, {
          companyName,
          totalAmount: 0,
        })
      }

      const company = companyMap.get(companyName)!

      // 遍历所有费用类型
      Object.entries(FEE_TYPE_MAP).forEach(([key]) => {
        const amount = toNumber((expense as Record<string, any>)[key])
        if (amount > 0) {
          company[key] = (company[key] || 0) + amount
          company.totalAmount += amount
          columnsWithData.add(key) // 记录有数据的列
        }
      })

      // 遍历所有提成类型
      Object.entries(COMMISSION_TYPE_MAP).forEach(([key]) => {
        const amount = toNumber((expense as Record<string, any>)[key])
        if (amount > 0) {
          company[key] = (company[key] || 0) + amount
          columnsWithData.add(key) // 记录有数据的列
          // 提成不计入总费用
        }
      })
      
      // 处理基础业务业绩
      const basicBusinessPerformance = toNumber((expense as Record<string, any>).basicBusinessPerformance)
      if (basicBusinessPerformance > 0) {
        company.basicBusinessPerformance = (company.basicBusinessPerformance || 0) + basicBusinessPerformance
        columnsWithData.add('basicBusinessPerformance') // 记录有数据的列
      }
      
      // 处理外包业务业绩
      const outsourcingBusinessPerformance = toNumber((expense as Record<string, any>).outsourcingBusinessPerformance)
      if (outsourcingBusinessPerformance > 0) {
        company.outsourcingBusinessPerformance = (company.outsourcingBusinessPerformance || 0) + outsourcingBusinessPerformance
        columnsWithData.add('outsourcingBusinessPerformance') // 记录有数据的列
      }

      // 处理业务类型字段（文本字段，取第一个非空值或合并多个值）
      if (expense.businessType && expense.businessType.trim()) {
        if (!company.businessType) {
          company.businessType = expense.businessType
        } else if (company.businessType !== expense.businessType) {
          // 如果有多个不同的业务类型，用逗号分隔
          const types = company.businessType.split(',').map((s: string) => s.trim())
          if (!types.includes(expense.businessType.trim())) {
            company.businessType += `, ${expense.businessType.trim()}`
          }
        }
        columnsWithData.add('businessType') // 记录有数据的列
      }

      if (expense.socialInsuranceBusinessType && expense.socialInsuranceBusinessType.trim()) {
        if (!company.socialInsuranceBusinessType) {
          company.socialInsuranceBusinessType = expense.socialInsuranceBusinessType
        } else if (company.socialInsuranceBusinessType !== expense.socialInsuranceBusinessType) {
          // 如果有多个不同的社保业务类型，用逗号分隔
          const types = company.socialInsuranceBusinessType.split(',').map((s: string) => s.trim())
          if (!types.includes(expense.socialInsuranceBusinessType.trim())) {
            company.socialInsuranceBusinessType += `, ${expense.socialInsuranceBusinessType.trim()}`
          }
        }
        columnsWithData.add('socialInsuranceBusinessType') // 记录有数据的列
      }
    })

    // 将必须显示的列添加到columnsWithData中
    requiredColumns.forEach(col => columnsWithData.add(col))

    return { 
      tableData: Array.from(companyMap.values()),
      columnsWithData: columnsWithData
    }
  }

  // 生成表格列定义
  const generateTableColumns = (columnsWithData: Set<string>) => {
    // 基础列
    const columns = [
      {
        title: '公司名称',
        dataIndex: 'companyName',
        key: 'companyName',
        fixed: 'left' as const,
        width: 200,
        render: (text: string) => (
          <div style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>{text}</div>
        ),
      },
    ]

    // 手动构建费用类型列，在特定位置插入业务类型列
    const feeColumns: Array<Record<string, unknown>> = []

    Object.entries(FEE_TYPE_MAP).forEach(([key, label]) => {
      // 如果该列没有数据，则跳过
      if (!columnsWithData.has(key)) {
        return
      }

      // 在代理费前插入代理费业务类型列
      if (key === 'agencyFee' && columnsWithData.has('businessType')) {
        feeColumns.push({
          title: '代理费业务类型',
          dataIndex: 'businessType',
          key: 'businessType',
          width: 150,
          render: (value: string) => value || '-',
          align: 'center' as const,
        })
      }

      // 在社保代理费前插入社保代理业务类型列
      if (key === 'socialInsuranceAgencyFee' && columnsWithData.has('socialInsuranceBusinessType')) {
        feeColumns.push({
          title: '社保代理业务类型',
          dataIndex: 'socialInsuranceBusinessType',
          key: 'socialInsuranceBusinessType',
          width: 180,
          render: (value: string) => value || '-',
          align: 'center' as const,
        })
      }

      // 添加费用列
      feeColumns.push({
        title: label,
        dataIndex: key,
        key,
        width: 100,
        render: (value: number) => (value > 0 ? formatCurrency(value) : '-'),
        align: 'right' as const,
      })
    })

    // 合计列
    const totalColumn = {
      title: '合计',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (value: number) => (
        <strong style={{ color: '#1890ff' }}>{formatCurrency(value)}</strong>
      ),
      align: 'right' as const,
    }

    // 基础业务业绩列 - 必须显示
    const basicBusinessPerformanceColumn = {
      title: '基础业务业绩',
      dataIndex: 'basicBusinessPerformance',
      key: 'basicBusinessPerformance',
      width: 130,
      render: (value: number) => (value > 0 ? formatCurrency(value) : '-'),
      align: 'right' as const,
    }

    // 外包业务业绩列 - 必须显示
    const outsourcingBusinessPerformanceColumn = {
      title: '外包业务业绩',
      dataIndex: 'outsourcingBusinessPerformance',
      key: 'outsourcingBusinessPerformance',
      width: 130,
      render: (value: number) => (value > 0 ? formatCurrency(value) : '-'),
      align: 'right' as const,
    }

    // 过滤出有数据的提成列
    const commissionColumns = Object.entries(COMMISSION_TYPE_MAP)
      .filter(([key]) => columnsWithData.has(key))
      .map(([key, label]) => ({
        title: label,
        dataIndex: key,
        key,
        width: 120,
        render: (value: number) => (value > 0 ? formatCurrency(value) : '-'),
        align: 'right' as const,
      }))

    // 只有当至少有一个提成列有数据时，才添加提成主列
    const finalColumns = [...columns, ...feeColumns, totalColumn, basicBusinessPerformanceColumn, outsourcingBusinessPerformanceColumn]
    
    if (commissionColumns.length > 0) {
      finalColumns.push({
        title: '提成',
        key: 'commission',
        children: commissionColumns,
      })
    }

    return finalColumns
  }

  // 计算合计行
  const calculateSummaryRow = (tableData: Array<Record<string, any>>) => {
    const summary: Record<string, any> = {
      companyName: '合计',
      totalAmount: 0,
    }

    // 计算费用类型合计
    Object.keys(FEE_TYPE_MAP).forEach(key => {
      summary[key] = tableData.reduce((sum, row) => sum + (row[key] || 0), 0)
      summary.totalAmount += summary[key]
    })

    // 计算提成类型合计（不计入总费用）
    Object.keys(COMMISSION_TYPE_MAP).forEach(key => {
      summary[key] = tableData.reduce((sum, row) => sum + (row[key] || 0), 0)
    })

    // 计算基础业务业绩合计
    summary.basicBusinessPerformance = tableData.reduce((sum, row) => sum + (row.basicBusinessPerformance || 0), 0)

    // 计算外包业务业绩合计
    summary.outsourcingBusinessPerformance = tableData.reduce((sum, row) => sum + (row.outsourcingBusinessPerformance || 0), 0)

    // 业务类型字段在合计行中显示为"-"
    summary.businessType = '-'
    summary.socialInsuranceBusinessType = '-'
    summary.giftAgencyDuration = '-'

    return summary
  }

  const formatYearMonth = (yearMonth: string) => {
    return dayjs(yearMonth).format('YYYY年MM月')
  }

  // 渲染收据表格的辅助函数
  const renderExpenseTable = (filteredExpenses: Expense[], title: string, expenseType: 'new-or-empty' | 'renewal') => {
    // 提前计算表格数据，避免在条件渲染中使用 Hook
    let tableData: Array<Record<string, any>> = []
    let columnsWithData = new Set<string>()
    let summaryRow: Record<string, any> = { companyName: '合计' }
    let columns: Array<Record<string, any>> = []
    let dataWithSummary: Array<Record<string, any>> = []
    
    if (filteredExpenses.length > 0) {
      const transformResult = transformToTableData(filteredExpenses)
      tableData = transformResult.tableData
      columnsWithData = transformResult.columnsWithData
      summaryRow = calculateSummaryRow(tableData)
      columns = generateTableColumns(columnsWithData)
      dataWithSummary = [...tableData, summaryRow]
    }
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">
            {detail.name} - {title}
            <span className="text-sm text-gray-500 ml-2">
              ({formatYearMonth(detail.yearMonth)})
            </span>
          </h3>
          {filteredExpenses.length > 0 && (
            <Button
              type="text"
              icon={<FullscreenOutlined />}
              onClick={() => {
                setCurrentExpenseType(expenseType)
                setFullscreenTable(true)
              }}
              title="全屏显示表格"
            >
              全屏
            </Button>
          )}
        </div>
        <Spin spinning={expenseLoading}>
          {filteredExpenses.length > 0 ? (
            <Table
              columns={columns}
              dataSource={dataWithSummary}
              rowKey="companyName"
              pagination={false}
              scroll={{ x: 'max-content' }}
              size="small"
              bordered
              rowClassName={(_, index) =>
                index === dataWithSummary.length - 1 ? 'bg-gray-50 font-bold' : ''
              }
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <Empty description={`本月暂无${title}`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </Spin>
      </div>
    )
  }

  const getStatusTag = () => {
    if (detail.isConfirmed) {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          已确认
        </Tag>
      )
    }
    return (
      <Tag icon={<ClockCircleOutlined />} color="warning">
        待确认
      </Tag>
    )
  }

  const canConfirm = !detail.isConfirmed && Number(detail.totalPayable) > 0

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={3} className="!mb-2">
              {formatYearMonth(detail.yearMonth)} 薪资详情
            </Title>
            <Text type="secondary">
              {detail.name} - {detail.department}
            </Text>
          </div>
          <div className="flex items-center space-x-3">{getStatusTag()}</div>
        </div>

        {/* 确认提示 */}
        {!detail.isConfirmed && (
          <Alert
            message="温馨提示"
            description="请仔细核对薪资明细，确认无误后点击确认薪资按钮"
            type="info"
            showIcon
            className="mb-4"
          />
        )}

        {/* 已确认信息 */}
        {detail.isConfirmed && detail.confirmedAt && (
          <Alert
            message="已确认"
            description={`确认时间：${dayjs(detail.confirmedAt).format('YYYY-MM-DD HH:mm:ss')}`}
            type="success"
            showIcon
            className="mb-4"
          />
        )}
      </Card>

      {/* 员工基本信息 */}
      <Card title="员工信息">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="姓名">{detail.name}</Descriptions.Item>
          <Descriptions.Item label="部门">{detail.department}</Descriptions.Item>
          <Descriptions.Item label="员工类型">{detail.type}</Descriptions.Item>
          <Descriptions.Item label="发薪公司">{detail.payrollCompany}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 薪资结构 */}
      <Card title="薪资结构">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="应发基本工资">
            {formatCurrency(detail.basicSalaryPayable)}
          </Descriptions.Item>
          <Descriptions.Item label="工资基数">
            {formatCurrency(detail.baseSalary)}
          </Descriptions.Item>
          <Descriptions.Item label="底薪临时增加">
            {formatCurrency(detail.temporaryIncrease)}
          </Descriptions.Item>
          <Descriptions.Item label="临时增加项目">
            {detail.temporaryIncreaseItem && detail.temporaryIncreaseItem}
          </Descriptions.Item>
          <Descriptions.Item label="考勤扣款">
            <Text className="text-red-600">-{formatCurrency(detail.attendanceDeduction)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="考勤扣款备注">
            {detail.attendanceRemark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 补贴与提成 */}
      <Card title="补贴与提成">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="全勤">
            {formatCurrency(detail.fullAttendance)}
          </Descriptions.Item>
          <Descriptions.Item label="部门负责人补贴">
            {formatCurrency(detail.departmentHeadSubsidy)}
          </Descriptions.Item>
          <Descriptions.Item label="岗位津贴">
            {formatCurrency(detail.positionAllowance)}
          </Descriptions.Item>
          <Descriptions.Item label="油补">
            {formatCurrency(detail.oilSubsidy)}
          </Descriptions.Item>
          <Descriptions.Item label="餐补">
            {formatCurrency(detail.mealSubsidy)}
          </Descriptions.Item>
          <Descriptions.Item label="工龄">{formatCurrency(detail.seniority)}</Descriptions.Item>
          <Descriptions.Item label="代理费提成">
            {formatCurrency(detail.agencyFeeCommission)}
          </Descriptions.Item>
          <Descriptions.Item label="绩效提成">
            {formatCurrency(detail.performanceCommission)}
          </Descriptions.Item>
          <Descriptions.Item label="业务提成">
            {formatCurrency(detail.businessCommission)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 扣款明细 */}
      <Card title="扣款明细">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="朋友圈扣款">
            <Text className="text-red-600">-{formatCurrency(detail.otherDeductions)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="个人医疗">
            <Text className="text-red-600">-{formatCurrency(detail.personalMedical)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="个人养老">
            <Text className="text-red-600">-{formatCurrency(detail.personalPension)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="个人失业">
            <Text className="text-red-600">-{formatCurrency(detail.personalUnemployment)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="社保个人合计">
            <Text className="text-red-600">-{formatCurrency(detail.personalInsuranceTotal)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="公司承担合计">
            {formatCurrency(detail.companyInsuranceTotal)}
          </Descriptions.Item>
          <Descriptions.Item label="保证金扣除">
            <Text className="text-red-600">-{formatCurrency(detail.depositDeduction)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="保证金合计">
            {formatCurrency(detail.depositTotal)}
          </Descriptions.Item>
          <Descriptions.Item label="个人所得税">
            <Text className="text-red-600">-{formatCurrency(detail.personalIncomeTax)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="其他">
            <Text className="text-red-600">-{formatCurrency(detail.other)}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 绩效扣除明细 */}
      {detail.performanceDeductions && (
        <Card>
          <PerformanceDeductionsEditor value={detail.performanceDeductions} disabled={true} />
        </Card>
      )}

      {/* 发放汇总 */}
      <Card title="发放汇总">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="应发合计">
            <Text strong className="text-green-600 text-lg">
              {formatCurrency(detail.totalPayable)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="发放状态">
            <Tag color={detail.isPaid ? 'success' : 'warning'}>
              {detail.isPaid ? '已发放' : '未发放'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 关联收据 */}
      <Card title="关联收据" bodyStyle={{ padding: 0 }}>
        <Tabs
          defaultActiveKey="new-or-empty"
          items={[
            {
              key: 'new-or-empty',
              label: `新增 (${newOrEmptyExpenses.length})`,
              children: renderExpenseTable(newOrEmptyExpenses, '新增收据', 'new-or-empty'),
            },
            {
              key: 'renewal',
              label: `续费 (${renewalExpenses.length})`,
              children: renderExpenseTable(renewalExpenses, '续费收据', 'renewal'),
            },
          ]}
          size="small"
          tabBarStyle={{
            margin: 0,
            paddingLeft: 16,
            borderBottom: '1px solid #f0f0f0',
          }}
        />
      </Card>

      {/* 确认操作 */}
      {canConfirm && onConfirm && (
        <Card>
          <div className="text-center">
            <Button type="primary" size="large" loading={loading} onClick={onConfirm}>
              确认薪资
            </Button>
            <div className="mt-2 text-gray-500 text-sm">确认后将无法修改，请仔细核对后操作</div>
          </div>
        </Card>
      )}

      {/* 全屏表格模态框 */}
      <Modal
        title={
          <div className="flex justify-between items-center">
            <span>
              {detail.name} - {currentExpenseType === 'new-or-empty' ? '新增收据' : '续费收据'} ({formatYearMonth(detail.yearMonth)})
            </span>
            <Button
              type="text"
              icon={<FullscreenExitOutlined />}
              onClick={() => setFullscreenTable(false)}
              title="退出全屏"
            >
              退出全屏
            </Button>
          </div>
        }
        open={fullscreenTable}
        onCancel={() => setFullscreenTable(false)}
        width="100vw"
        height="100vh"
        style={{
          top: 0,
          left: 0,
          padding: 0,
          margin: 0,
          maxWidth: 'none',
          position: 'fixed',
        }}
        styles={{
          body: {
            padding: 0,
            height: 'calc(100vh - 55px)', // 减去标题栏高度
            overflow: 'hidden',
          },
          mask: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
          },
        }}
        footer={null}
        destroyOnClose
        centered={false}
        maskClosable={true}
      >
        <div
          style={{
            height: '100%',
            padding: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Spin spinning={expenseLoading} style={{ height: '100%' }}>
            {(() => {
              // 根据当前选择的类型获取对应的数据
              const currentExpenses = currentExpenseType === 'new-or-empty' ? newOrEmptyExpenses : renewalExpenses
              
              // 提前计算表格数据，避免在条件渲染中使用 Hook
              let tableData: Array<Record<string, any>> = []
              let columnsWithData = new Set<string>()
              let summaryRow: Record<string, any> = { companyName: '合计' }
              let columns: Array<Record<string, any>> = []
              let dataWithSummary: Array<Record<string, any>> = []
              
              if (currentExpenses.length > 0) {
                const transformResult = transformToTableData(currentExpenses)
                tableData = transformResult.tableData
                columnsWithData = transformResult.columnsWithData
                summaryRow = calculateSummaryRow(tableData)
                columns = generateTableColumns(columnsWithData)
                dataWithSummary = [...tableData, summaryRow]
              }
              
              return currentExpenses.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={dataWithSummary}
                  rowKey="companyName"
                  pagination={false}
                  scroll={{
                    x: 'max-content',
                    y: 'calc(100vh - 200px)', // 固定表头，可滚动内容，减少高度预留值
                  }}
                  size="middle"
                  bordered
                  rowClassName={(_, index) =>
                    index === dataWithSummary.length - 1 ? 'bg-gray-50 font-bold' : ''
                  }
                  sticky
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <Empty 
                    description={`本月暂无${currentExpenseType === 'new-or-empty' ? '新增' : '续费'}收据`} 
                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  />
                </div>
              )
            })()}
          </Spin>
        </div>
      </Modal>
    </div>
  )
}

export default MySalaryDetails
