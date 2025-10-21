import React, { useState, useEffect, useMemo } from 'react'
import {
  Tabs,
  Descriptions,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Empty,
  Tag,
  Spin,
  Table,
} from 'antd'
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons'

import dayjs from 'dayjs'
import type { SalaryRecord, UpdateSalaryDto } from '../../../types/salaryIntegrated'
import type { Expense } from '../../../types/expense'
import { useExpenseList } from '../../../hooks/useExpense'
import SalaryCalculator from './SalaryCalculator'
import AmountInput from './AmountInput'
import PerformanceDeductionsEditor from './PerformanceDeductionsEditor'

interface SalaryDetailsProps {
  employee: SalaryRecord | null
  yearMonth: string
  onUpdate: (id: number, data: UpdateSalaryDto) => Promise<SalaryRecord>
}

// 发放公司选项配置
const payrollCompanyOptions = [
  { label: '中岳会计', value: '中岳会计' },
  { label: '雄安分公司', value: '雄安分公司' },
  { label: '高碑店分公司', value: '高碑店分公司' },
  { label: '金盾', value: '金盾' },
  { label: '如你心意', value: '如你心意' },
  { label: '脉信', value: '脉信' },
  { label: '鼎兴', value: '鼎兴' },
]

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

// 安全的数值转换函数
const toNumber = (value: any): number => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  return isNaN(num) ? 0 : num
}

// 格式化货币函数
const formatCurrency = (value: any): string => {
  const amount = toNumber(value)
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const SalaryDetails: React.FC<SalaryDetailsProps> = ({ employee, yearMonth, onUpdate }) => {
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fullscreenTable, setFullscreenTable] = useState(false)
  const [currentExpenseType, setCurrentExpenseType] = useState<'new-or-empty' | 'renewal'>('new-or-empty')

  // 构建费用查询参数
  const expenseParams = useMemo(() => {
    if (!employee?.name || !yearMonth) {
      return null
    }

    // 时间范围：当月1号到当月月底
    const monthStart = dayjs(yearMonth).startOf('month').format('YYYY-MM-DD')
    const monthEnd = dayjs(yearMonth).endOf('month').format('YYYY-MM-DD')

    return {
      page: 1,
      pageSize: 1000,
      salesperson: employee.name,
      status: 1, // 已审核
      chargeDateStart: monthStart,
      chargeDateEnd: monthEnd,
    }
  }, [employee?.name, yearMonth])

  // 使用 hook 获取费用数据
  const { expenses, isLoading: expenseLoading } = useExpenseList(
    expenseParams || {
      page: 1,
      pageSize: 10,
    }
  )

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

  // 根据业务类型过滤收据 - 必须在早期返回之前调用
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
             ((businessType === '' || businessType === '-') && socialInsuranceBusinessType === '续费')
    })
  }, [expenses])

  // 数据透视转换：将费用列表转换为表格数据（不按公司汇总，显示每条收据明细）
  const transformToTableData = (expenseList: Expense[]) => {
    // 记录哪些列有数据
    const columnsWithData = new Set<string>()
    // 必须显示的列
    const requiredColumns = [
      'businessCommissionOwn', 'businessCommissionOutsource', 'specialBusinessCommission', 
      'agencyCommission', 'basicBusinessPerformance', 'outsourcingBusinessPerformance'
    ]

    // 直接将每个expense转换为表格行，不汇总
    const tableData = expenseList.map(expense => {
      const row: any = {
        companyName: expense.companyName,
        totalAmount: 0,
      }

      // 遍历所有费用类型
      Object.entries(FEE_TYPE_MAP).forEach(([key]) => {
        const amount = toNumber((expense as any)[key])
        
        if (amount !== 0) {
          row[key] = amount
          row.totalAmount += amount
          columnsWithData.add(key) // 记录有数据的列
        }
      })

      // 遍历所有提成类型
      Object.entries(COMMISSION_TYPE_MAP).forEach(([key]) => {
        const amount = toNumber((expense as any)[key])
        
        if (amount !== 0) {
          row[key] = amount
          columnsWithData.add(key) // 记录有数据的列
          // 提成不计入总费用
        }
      })

      // 处理基础业务业绩
      const basicBusinessPerformance = toNumber(expense.basicBusinessPerformance)
      if (basicBusinessPerformance !== 0) {
        row.basicBusinessPerformance = basicBusinessPerformance
        columnsWithData.add('basicBusinessPerformance')
      }

      // 处理外包业务业绩
      const outsourcingBusinessPerformance = toNumber(expense.outsourcingBusinessPerformance)
      if (outsourcingBusinessPerformance !== 0) {
        row.outsourcingBusinessPerformance = outsourcingBusinessPerformance
        columnsWithData.add('outsourcingBusinessPerformance')
      }

      // 处理业务类型字段
      if (expense.businessType && expense.businessType.trim()) {
        row.businessType = expense.businessType
        columnsWithData.add('businessType')
      }

      if (expense.socialInsuranceBusinessType && expense.socialInsuranceBusinessType.trim()) {
        row.socialInsuranceBusinessType = expense.socialInsuranceBusinessType
        columnsWithData.add('socialInsuranceBusinessType')
      }

      // 处理赠送代理时长字段
      if (expense.giftAgencyDuration && expense.giftAgencyDuration.trim()) {
        row.giftAgencyDuration = expense.giftAgencyDuration
        columnsWithData.add('giftAgencyDuration')
      }

      return row
    })

    // 将必须显示的列添加到columnsWithData中
    requiredColumns.forEach(col => columnsWithData.add(col))
    
    return { 
      tableData,
      columnsWithData
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
    const feeColumns: any[] = []

    Object.entries(FEE_TYPE_MAP).forEach(([key, label]) => {
      // 如果该列没有数据，则跳过
      if (!columnsWithData.has(key)) {
        return
      }
      
      // 在代理费前插入代理费业务类型列和赠送代理时长列
      if (key === 'agencyFee') {
        // 只有当businessType列有数据时才添加
        if (columnsWithData.has('businessType')) {
          feeColumns.push({
            title: '代理费业务类型',
            dataIndex: 'businessType',
            key: 'businessType',
            width: 150,
            render: (value: string) => value || '-',
            align: 'center' as const,
          })
        }
        
        // 只有当giftAgencyDuration列有数据时才添加
        if (columnsWithData.has('giftAgencyDuration')) {
          feeColumns.push({
            title: '赠送代理时长',
            dataIndex: 'giftAgencyDuration',
            key: 'giftAgencyDuration',
            width: 150,
            render: (value: string) => value || '-',
            align: 'center' as const,
          })
        }
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
        render: (value: number) => (value !== 0 && value !== undefined ? formatCurrency(value) : '-'),
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
      render: (value: number) => (value !== 0 && value !== undefined ? formatCurrency(value) : '-'),
      align: 'right' as const,
    }

    // 外包业务业绩列 - 必须显示
    const outsourcingBusinessPerformanceColumn = {
      title: '外包业务业绩',
      dataIndex: 'outsourcingBusinessPerformance',
      key: 'outsourcingBusinessPerformance',
      width: 130,
      render: (value: number) => (value !== 0 && value !== undefined ? formatCurrency(value) : '-'),
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
        render: (value: number) => (value !== 0 && value !== undefined ? formatCurrency(value) : '-'),
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
  const calculateSummaryRow = (tableData: any[]) => {
    const summary: any = {
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

  if (!employee) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty description="请选择员工查看关联数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  const handleEdit = () => {
    // 已发放的薪资不允许编辑
    if (employee.isPaid) {
      message.warning('该员工薪资已发放，不允许修改')
      return
    }

    form.setFieldsValue({
      temporaryIncrease: employee.temporaryIncrease,
      temporaryIncreaseItem: employee.temporaryIncreaseItem,
      basicSalaryPayable: employee.basicSalaryPayable,
      fullAttendance: employee.fullAttendance,
      totalSubsidy: employee.totalSubsidy,
      seniority: employee.seniority,
      agencyFeeCommission: employee.agencyFeeCommission,
      performanceCommission: employee.performanceCommission,
      performanceDeductions: employee.performanceDeductions || new Array(14).fill(0),
      businessCommission: employee.businessCommission,
      attendanceDeduction: employee.attendanceDeduction,
      otherDeductions: employee.otherDeductions,
      personalMedical: employee.personalMedical,
      personalPension: employee.personalPension,
      personalUnemployment: employee.personalUnemployment,
      personalInsuranceTotal: employee.personalInsuranceTotal,
      companyInsuranceTotal: employee.companyInsuranceTotal,
      personalIncomeTax: employee.personalIncomeTax,
      other: employee.other,
      depositDeduction: employee.depositDeduction,
      totalPayable: employee.totalPayable,
      bankCardNumber: employee.bankCardNumber,
      payrollCompany: employee.payrollCompany,
      bankCardOrWechat: employee.bankCardOrWechat,
      corporatePayment: employee.corporatePayment,
      taxDeclaration: employee.taxDeclaration,
    })
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // 再次检查是否已发放（防止在编辑过程中状态被改变）
      if (employee.isPaid) {
        message.error('该员工薪资已发放，无法保存修改')
        setEditing(false)
        return
      }

      const values = await form.validateFields()

      // 确保绩效扣除数组是完整的14个数字
      const safePerformanceDeductions = new Array(14).fill(0).map((_, index) => {
        const val = values.performanceDeductions?.[index]
        return typeof val === 'number' ? val : 0
      })

      // 计算基础薪资应发和个人社保合计，应发合计由后端计算
      await onUpdate(employee.id, {
        ...values,
        performanceDeductions: safePerformanceDeductions,
        basicSalaryPayable: toNumber(employee.baseSalary) - toNumber(values.attendanceDeduction),
        personalInsuranceTotal:
          toNumber(values.personalMedical) +
          toNumber(values.personalPension) +
          toNumber(values.personalUnemployment),
      })

      setEditing(false)
      message.success('薪资信息已更新')
    } catch (error: any) {
      console.error('保存失败:', error)
      // 处理后端返回的已发放状态错误
      if (error?.response?.data?.message?.includes('已发放')) {
        message.error('该薪资已发放，不允许修改')
      } else {
        message.error('保存失败，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    form.resetFields()
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
            {employee.name} - {title}
            <span className="text-sm text-gray-500 ml-2">
              ({dayjs(yearMonth).format('YYYY年MM月')})
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

  return (
    <div style={{ height: '100%' }}>
      <Tabs
        className="scrollable-tabs"
        items={[
          {
            key: 'basic',
            label: '基础信息',
            children: (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">{employee.name} - 基础信息</h3>
                </div>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="姓名">{employee.name}</Descriptions.Item>
                  <Descriptions.Item label="部门">{employee.department}</Descriptions.Item>
                  <Descriptions.Item label="身份证号">{employee.idCard}</Descriptions.Item>
                  <Descriptions.Item label="类型">{employee.type}</Descriptions.Item>
                  <Descriptions.Item label="年月">
                    {dayjs(employee.yearMonth).format('YYYY年MM月')}
                  </Descriptions.Item>
                  <Descriptions.Item label="银行卡号">{employee.bankCardNumber}</Descriptions.Item>
                  <Descriptions.Item label="薪资发放公司">
                    {employee.payrollCompany || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="发放状态">
                    <Tag
                      icon={employee.isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      color={employee.isPaid ? 'success' : 'warning'}
                    >
                      {employee.isPaid ? '已发放' : '未发放'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ),
          },
          {
            key: 'salary',
            label: '工资构成',
            children: (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">{employee.name} - 工资构成</h3>
                  <Space>
                    {editing ? (
                      <>
                        <Button
                          icon={<SaveOutlined />}
                          type="primary"
                          onClick={handleSave}
                          loading={loading}
                        >
                          保存
                        </Button>
                        <Button icon={<CloseOutlined />} onClick={handleCancel}>
                          取消
                        </Button>
                      </>
                    ) : (
                      <Button 
                        icon={<EditOutlined />} 
                        onClick={handleEdit}
                        disabled={employee.isPaid}
                        title={employee.isPaid ? '已发放的薪资不允许修改' : '编辑薪资信息'}
                      >
                        编辑
                      </Button>
                    )}
                  </Space>
                </div>
                {editing ? (
                  <Form form={form} layout="vertical">
                    <div className="space-y-8">
                      {/* 收入区域 */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-4 text-green-600 text-lg">收入项目</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <Form.Item label="临时增加" name="temporaryIncrease">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="临时增加项目" name="temporaryIncreaseItem">
                            <Input placeholder="请输入临时增加项目名称" />
                          </Form.Item>
                          <Form.Item label="基础薪资应发" name="basicSalaryPayable">
                            <AmountInput disabled />
                          </Form.Item>
                          <Form.Item label="全勤奖励" name="fullAttendance">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="部门负责人补贴" name="departmentHeadSubsidy">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="岗位津贴" name="positionAllowance">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="油补" name="oilSubsidy">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="餐补" name="mealSubsidy">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="工龄津贴" name="seniority">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="代理费提成" name="agencyFeeCommission">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="绩效提成" name="performanceCommission">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="业务提成" name="businessCommission">
                            <AmountInput />
                          </Form.Item>
                        </div>
                      </div>

                      {/* 扣除区域 */}
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-4 text-red-600 text-lg">扣除项目</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <Form.Item label="考勤扣款" name="attendanceDeduction">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="朋友圈扣款" name="otherDeductions">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="个人医疗" name="personalMedical">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="个人养老" name="personalPension">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="个人失业" name="personalUnemployment">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="个人社保合计" name="personalInsuranceTotal">
                            <AmountInput disabled />
                          </Form.Item>
                          <Form.Item label="公司承担合计" name="companyInsuranceTotal">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="个人所得税" name="personalIncomeTax">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="其他" name="other">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="保证金扣除" name="depositDeduction">
                            <AmountInput />
                          </Form.Item>
                        </div>

                        {/* 绩效扣除区域 */}
                        <div className="col-span-3 mt-4">
                          <Form.Item label="绩效扣除" name="performanceDeductions">
                            <PerformanceDeductionsEditor />
                          </Form.Item>
                        </div>
                      </div>

                      {/* 发放区域 */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-4 text-blue-600 text-lg">发放明细</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <Form.Item label="银行卡号" name="bankCardNumber">
                            <Input placeholder="请输入银行卡号" />
                          </Form.Item>
                          <Form.Item label="薪资发放公司" name="payrollCompany">
                            <Select
                              placeholder="请选择薪资发放公司"
                              allowClear
                              showSearch
                              options={payrollCompanyOptions}
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                            />
                          </Form.Item>
                          <Form.Item label="应发合计" name="totalPayable">
                            <AmountInput disabled />
                          </Form.Item>
                          <Form.Item label="银行卡/微信" name="bankCardOrWechat">
                            <AmountInput />
                          </Form.Item>
                          <Form.Item label="对公转账" name="corporatePayment">
                            <AmountInput disabled />
                          </Form.Item>
                          <Form.Item label="个税申报" name="taxDeclaration">
                            <AmountInput disabled />
                          </Form.Item>
                        </div>
                      </div>
                    </div>
                  </Form>
                ) : (
                  <div className="space-y-8">
                    {/* 收入区域 */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-4 text-green-600 text-lg">收入项目</h4>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h5 className="font-medium mb-3 text-green-700">基础收入</h5>
                          <Descriptions column={1} size="small">
                            <Descriptions.Item label="工资基数">
                              ¥{formatCurrency(employee.baseSalary)}
                            </Descriptions.Item>
                            <Descriptions.Item label="临时增加">
                              ¥{formatCurrency(employee.temporaryIncrease)}
                            </Descriptions.Item>
                            <Descriptions.Item label="临时增加项目">
                              {employee.temporaryIncreaseItem || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="全勤奖励">
                              ¥{formatCurrency(employee.fullAttendance)}
                            </Descriptions.Item>
                            <Descriptions.Item label="部门负责人补贴">
                              ¥{formatCurrency(employee.departmentHeadSubsidy)}
                            </Descriptions.Item>
                            <Descriptions.Item label="岗位津贴">
                              ¥{formatCurrency(employee.positionAllowance)}
                            </Descriptions.Item>
                            <Descriptions.Item label="油补">
                              ¥{formatCurrency(employee.oilSubsidy)}
                            </Descriptions.Item>
                            <Descriptions.Item label="餐补">
                              ¥{formatCurrency(employee.mealSubsidy)}
                            </Descriptions.Item>
                            <Descriptions.Item label="工龄津贴">
                              ¥{formatCurrency(employee.seniority)}
                            </Descriptions.Item>
                          </Descriptions>
                        </div>
                        <div>
                          <h5 className="font-medium mb-3 text-blue-700">提成项目</h5>
                          <Descriptions column={1} size="small">
                            <Descriptions.Item label="代理费提成">
                              ¥{formatCurrency(employee.agencyFeeCommission)}
                            </Descriptions.Item>
                            <Descriptions.Item label="绩效提成">
                              ¥{formatCurrency(employee.performanceCommission)}
                            </Descriptions.Item>
                            <Descriptions.Item label="业务提成">
                              ¥{formatCurrency(employee.businessCommission)}
                            </Descriptions.Item>
                          </Descriptions>
                        </div>
                      </div>
                    </div>

                    {/* 扣除区域 */}
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-4 text-red-600 text-lg">扣除项目</h4>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h5 className="font-medium mb-3 text-red-700">社保扣除</h5>
                          <Descriptions column={1} size="small">
                            <Descriptions.Item label="个人医疗">
                              ¥{formatCurrency(employee.personalMedical)}
                            </Descriptions.Item>
                            <Descriptions.Item label="个人养老">
                              ¥{formatCurrency(employee.personalPension)}
                            </Descriptions.Item>
                            <Descriptions.Item label="个人失业">
                              ¥{formatCurrency(employee.personalUnemployment)}
                            </Descriptions.Item>
                            <Descriptions.Item label="社保合计">
                              <strong>¥{formatCurrency(employee.personalInsuranceTotal)}</strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="公司承担合计">
                              ¥{formatCurrency(employee.companyInsuranceTotal)}
                            </Descriptions.Item>
                          </Descriptions>
                        </div>
                        <div>
                          <h5 className="font-medium mb-3 text-orange-700">其他扣除</h5>
                          <Descriptions column={1} size="small">
                            <Descriptions.Item label="考勤扣款">
                              ¥{formatCurrency(employee.attendanceDeduction)}
                            </Descriptions.Item>
                            <Descriptions.Item label="朋友圈扣款">
                              ¥{formatCurrency(employee.otherDeductions)}
                            </Descriptions.Item>
                            <Descriptions.Item label="保证金扣除">
                              ¥{formatCurrency(employee.depositDeduction)}
                            </Descriptions.Item>
                            <Descriptions.Item label="个人所得税">
                              <strong>¥{formatCurrency(employee.personalIncomeTax)}</strong>
                            </Descriptions.Item>
                          </Descriptions>
                        </div>
                      </div>

                      {/* 绩效扣除区域 */}
                      <div className="col-span-2 mt-4">
                        <h5 className="font-medium mb-3 text-purple-700">绩效扣除</h5>
                        <div className="bg-white p-3 rounded border">
                          <PerformanceDeductionsEditor
                            value={employee.performanceDeductions || new Array(14).fill(0)}
                            disabled={true}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 发放区域 */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-4 text-blue-600 text-lg">发放明细</h4>
                      <Descriptions column={2} size="small" className="mb-4">
                        <Descriptions.Item label="应发合计">
                          <span className="text-2xl font-bold text-blue-600">
                            ¥{formatCurrency(employee.totalPayable)}
                          </span>
                        </Descriptions.Item>
                      </Descriptions>
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="银行卡/微信">
                          ¥{formatCurrency(employee.bankCardOrWechat)}
                        </Descriptions.Item>
                        <Descriptions.Item label="对公转账">
                          ¥{formatCurrency(employee.corporatePayment)}
                        </Descriptions.Item>
                        <Descriptions.Item label="个税申报">
                          ¥{formatCurrency(employee.taxDeclaration)}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'calculator',
            label: '计算明细',
            children: (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">{employee.name} - 计算明细</h3>
                </div>
                <SalaryCalculator salary={employee} />
              </div>
            ),
          },
          {
            key: 'related-expenses',
            label: '关联收据',
            children: (
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
              />
            ),
          },
        ]}
        size="small"
        tabBarStyle={{
          margin: 0,
          paddingLeft: 16,
          borderBottom: '1px solid #f0f0f0',
        }}
      />

      {/* 全屏表格模态框 */}
      <Modal
        title={
          <div className="flex justify-between items-center">
            <span>
              {employee.name} - {currentExpenseType === 'new-or-empty' ? '新增收据' : '续费收据'} ({dayjs(yearMonth).format('YYYY年MM月')})
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

export default SalaryDetails
