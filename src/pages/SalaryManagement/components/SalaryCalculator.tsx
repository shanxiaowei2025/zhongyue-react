import React, { useState, useEffect } from 'react'
import { Card, Descriptions, Divider, Typography, Tag } from 'antd'
import { CalculatorOutlined } from '@ant-design/icons'
import type { SalaryRecord } from '../../../types/salaryIntegrated'

const { Title, Text } = Typography

interface SalaryCalculatorProps {
  salary: SalaryRecord
  className?: string
}

interface CalculationBreakdown {
  basicPay: number
  allowances: number
  commissions: number
  deductions: number
  socialInsurance: number
  tax: number
  netPay: number
}

const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({ salary, className }) => {
  const [breakdown, setBreakdown] = useState<CalculationBreakdown | null>(null)

  useEffect(() => {
    if (salary) {
      calculateBreakdown()
    }
  }, [salary])

  const calculateBreakdown = () => {
    // 基础工资计算
    const basicPay = salary.basicSalaryPayable

    // 补贴合计
    const allowances = salary.fullAttendance + salary.totalSubsidy + salary.seniority

    // 提成合计
    const commissions =
      salary.agencyFeeCommission + salary.performanceCommission + salary.businessCommission

    // 其他扣除
    const deductions =
      salary.otherDeductions + salary.depositDeduction + salary.attendanceDeduction + salary.other

    // 社保扣除
    const socialInsurance = salary.personalInsuranceTotal

    // 个税
    const tax = salary.personalIncomeTax

    // 实发工资
    const netPay = basicPay + allowances + commissions - deductions - socialInsurance - tax

    setBreakdown({
      basicPay,
      allowances,
      commissions,
      deductions,
      socialInsurance,
      tax,
      netPay,
    })
  }

  if (!breakdown) return null

  const formatAmount = (amount: number) => {
    return (
      <Text strong className={amount >= 0 ? 'text-green-600' : 'text-red-500'}>
        {amount >= 0 ? '+' : ''}¥{amount.toFixed(2)}
      </Text>
    )
  }

  const formatDeduction = (amount: number) => {
    return (
      <Text strong className="text-red-500">
        -¥{amount.toFixed(2)}
      </Text>
    )
  }

  return (
    <Card
      className={`${className || ''}`}
      title={
        <div className="flex items-center">
          <CalculatorOutlined className="mr-2" />
          <span>薪资计算明细</span>
        </div>
      }
      size="small"
    >
      <div className="space-y-4">
        {/* 收入部分 */}
        <div>
          <Title level={5} className="mb-2 text-green-600">
            <Tag color="green">收入</Tag>
          </Title>
          <Descriptions column={1} size="small" colon={false}>
            <Descriptions.Item label="基础工资">
              {formatAmount(breakdown.basicPay)}
            </Descriptions.Item>
            <Descriptions.Item label="补贴津贴">
              {formatAmount(breakdown.allowances)}
              <div className="text-xs text-gray-500 ml-2">
                (全勤:{salary.fullAttendance} + 补贴:{salary.totalSubsidy} + 工龄:{salary.seniority}
                )
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="提成奖金">
              {formatAmount(breakdown.commissions)}
              <div className="text-xs text-gray-500 ml-2">
                (代理费:{salary.agencyFeeCommission} + 绩效:{salary.performanceCommission} + 业务:
                {salary.businessCommission})
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider className="my-3" />

        {/* 扣除部分 */}
        <div>
          <Title level={5} className="mb-2 text-red-600">
            <Tag color="red">扣除</Tag>
          </Title>
          <Descriptions column={1} size="small" colon={false}>
            <Descriptions.Item label="社保个人部分">
              {formatDeduction(breakdown.socialInsurance)}
              <div className="text-xs text-gray-500 ml-2">
                (医疗:{salary.personalMedical} + 养老:{salary.personalPension} + 失业:
                {salary.personalUnemployment})
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="个人所得税">
              {formatDeduction(breakdown.tax)}
            </Descriptions.Item>
            <Descriptions.Item label="其他扣款">
              {formatDeduction(breakdown.deductions)}
              <div className="text-xs text-gray-500 ml-2">
                (考勤:{salary.attendanceDeduction} + 其他:{salary.otherDeductions} + 保证金:
                {salary.depositDeduction})
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider className="my-3" />

        {/* 计算结果 */}
        <div className="bg-blue-50 p-3 rounded">
          <div className="flex justify-between items-center">
            <Title level={5} className="mb-0">
              实发工资:
            </Title>
            <Text className="text-2xl font-bold text-blue-600">¥{breakdown.netPay.toFixed(2)}</Text>
          </div>

          {/* 计算公式 */}
          <div className="mt-2 text-xs text-gray-600">
            计算公式: 基础工资 + 补贴津贴 + 提成奖金 - 社保扣除 - 个税 - 其他扣款
          </div>
          <div className="text-xs text-gray-600">
            = {breakdown.basicPay.toFixed(2)} + {breakdown.allowances.toFixed(2)} +{' '}
            {breakdown.commissions.toFixed(2)}- {breakdown.socialInsurance.toFixed(2)} -{' '}
            {breakdown.tax.toFixed(2)} - {breakdown.deductions.toFixed(2)}={' '}
            {breakdown.netPay.toFixed(2)}
          </div>
        </div>

        {/* 发放信息 */}
        <div className="bg-gray-50 p-3 rounded">
          <Title level={5} className="mb-2">
            发放明细:
          </Title>
          <Descriptions column={1} size="small" colon={false}>
            <Descriptions.Item label="银行卡/微信">
              ¥{salary.bankCardOrWechat.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="现金发放">¥{salary.cashPaid.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="对公转账">
              ¥{salary.corporatePayment.toFixed(2)}
            </Descriptions.Item>
          </Descriptions>

          {/* 发放状态 */}
          <div className="mt-2">
            <Tag
              color={
                salary.bankCardOrWechat > 0 || salary.cashPaid > 0 || salary.corporatePayment > 0
                  ? 'green'
                  : 'orange'
              }
            >
              {salary.bankCardOrWechat > 0 || salary.cashPaid > 0 || salary.corporatePayment > 0
                ? '已发放'
                : '待发放'}
            </Tag>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default SalaryCalculator
