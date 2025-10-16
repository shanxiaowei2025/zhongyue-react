import React from 'react'
import { Card, Descriptions, Divider, Typography, Tag } from 'antd'
import { CalculatorOutlined } from '@ant-design/icons'
import type { SalaryRecord } from '../../../types/salaryIntegrated'

const { Title, Text } = Typography

interface SalaryCalculatorProps {
  salary: SalaryRecord
  className?: string
}

const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({ salary, className }) => {
  // 安全的数值转换函数
  const toNumber = (value: any): number => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(num) ? 0 : num
  }

  const formatAmount = (amount: number | any) => {
    const safeAmount = toNumber(amount)
    return (
      <Text strong className={safeAmount >= 0 ? 'text-green-600' : 'text-red-500'}>
        {safeAmount >= 0 ? '+' : ''}¥{safeAmount.toFixed(2)}
      </Text>
    )
  }

  const formatDeduction = (amount: number | any) => {
    const safeAmount = toNumber(amount)
    return (
      <Text strong className="text-red-500">
        -¥{safeAmount.toFixed(2)}
      </Text>
    )
  }

  return (
    <Card
      className={`${className || ''}`}
      title={
        <div className="flex items-center">
          <CalculatorOutlined className="mr-2" />
          <span>薪资明细</span>
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
              {formatAmount(salary.basicSalaryPayable)}
            </Descriptions.Item>
            <Descriptions.Item label="补贴津贴">
              {formatAmount(
                toNumber(salary.fullAttendance) +
                  toNumber(salary.totalSubsidy) +
                  toNumber(salary.seniority)
              )}
              <div className="text-xs text-gray-500 ml-2">
                (全勤:{toNumber(salary.fullAttendance)} + 补贴:{toNumber(salary.totalSubsidy)} +
                工龄:{toNumber(salary.seniority)})
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="提成奖金">
              {formatAmount(
                toNumber(salary.agencyFeeCommission) +
                  toNumber(salary.performanceCommission) +
                  toNumber(salary.businessCommission)
              )}
              <div className="text-xs text-gray-500 ml-2">
                (代理费:{toNumber(salary.agencyFeeCommission)} + 绩效:
                {toNumber(salary.performanceCommission)} + 业务:
                {toNumber(salary.businessCommission)})
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
              {formatDeduction(salary.personalInsuranceTotal)}
              <div className="text-xs text-gray-500 ml-2">
                (医疗:{toNumber(salary.personalMedical)} + 养老:{toNumber(salary.personalPension)} +
                失业:{toNumber(salary.personalUnemployment)})
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="个人所得税">
              {formatDeduction(salary.personalIncomeTax)}
            </Descriptions.Item>
            <Descriptions.Item label="朋友圈扣款">
              {formatDeduction(
                toNumber(salary.attendanceDeduction) +
                  toNumber(salary.otherDeductions) +
                  toNumber(salary.depositDeduction)
              )}
              <div className="text-xs text-gray-500 ml-2">
                (考勤:{toNumber(salary.attendanceDeduction)} + 其他:
                {toNumber(salary.otherDeductions)} + 保证金:
                {toNumber(salary.depositDeduction)})
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider className="my-3" />

        {/* 应发合计 */}
        <div className="bg-blue-50 p-3 rounded">
          <div className="flex justify-between items-center">
            <Title level={5} className="mb-0">
              应发合计:
            </Title>
            <Text className="text-2xl font-bold text-blue-600">
              ¥{toNumber(salary.totalPayable).toFixed(2)}
            </Text>
          </div>

          <div className="mt-2 text-xs text-gray-600">
            注：应发合计由后端根据完整薪资公式计算得出
          </div>
        </div>

        {/* 发放信息 */}
        <div className="bg-gray-50 p-3 rounded">
          <Title level={5} className="mb-2">
            发放明细:
          </Title>
          <Descriptions column={1} size="small" colon={false}>
            <Descriptions.Item label="银行卡/微信">
              ¥{toNumber(salary.bankCardOrWechat).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="对公转账">
              ¥{toNumber(salary.corporatePayment).toFixed(2)}
            </Descriptions.Item>
          </Descriptions>

          {/* 发放状态 */}
          <div className="mt-2">
            <Tag color={salary.isPaid ? 'green' : 'orange'}>
              {salary.isPaid ? '已发放' : '未发放'}
            </Tag>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default SalaryCalculator
