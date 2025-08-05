import React from 'react'
import { Card, Descriptions, Typography, Tag, Button, Alert } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { MySalaryRecord } from '../../../types/mySalary'

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
  if (!detail) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          <Text>请选择一条薪资记录查看详情</Text>
        </div>
      </Card>
    )
  }

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return '¥0.00'
    }
    const numAmount = Number(amount)
    return `¥${numAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
  }

  const formatYearMonth = (yearMonth: string) => {
    return dayjs(yearMonth).format('YYYY年MM月')
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

  const canConfirm = !detail.isConfirmed && detail.totalPayable > 0

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
          <Descriptions.Item label="银行卡号">{detail.bankCardNumber}</Descriptions.Item>
          <Descriptions.Item label="对应公司">{detail.company}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 薪资结构 */}
      <Card title="薪资结构">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="工资基数">
            {formatCurrency(detail.baseSalary)}
          </Descriptions.Item>
          <Descriptions.Item label="底薪临时增加">
            {formatCurrency(detail.temporaryIncrease)}
          </Descriptions.Item>
          {detail.temporaryIncreaseItem && (
            <Descriptions.Item label="临时增加项目" span={2}>
              {detail.temporaryIncreaseItem}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="考勤扣款">
            <Text className="text-red-600">-{formatCurrency(detail.attendanceDeduction)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="应发基本工资">
            {formatCurrency(detail.basicSalaryPayable)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 补贴与提成 */}
      <Card title="补贴与提成">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="全勤">
            {formatCurrency(detail.fullAttendance)}
          </Descriptions.Item>
          <Descriptions.Item label="补贴合计">
            {formatCurrency(detail.totalSubsidy)}
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
          <Descriptions.Item label="其他扣款">
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
          <Descriptions.Item label="个人所得税">
            <Text className="text-red-600">-{formatCurrency(detail.personalIncomeTax)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="其他">
            <Text className="text-red-600">-{formatCurrency(detail.other)}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 发放汇总 */}
      <Card title="发放汇总">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="应发合计">
            <Text strong className="text-green-600 text-lg">
              {formatCurrency(detail.totalPayable)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="银行卡/微信">
            {formatCurrency(detail.bankCardOrWechat)}
          </Descriptions.Item>
          <Descriptions.Item label="已发现金">{formatCurrency(detail.cashPaid)}</Descriptions.Item>
          <Descriptions.Item label="对公">
            {formatCurrency(detail.corporatePayment)}
          </Descriptions.Item>
          <Descriptions.Item label="个税申报">
            {formatCurrency(detail.taxDeclaration)}
          </Descriptions.Item>
          <Descriptions.Item label="发放状态">
            <Tag color={detail.isPaid ? 'success' : 'warning'}>
              {detail.isPaid ? '已发放' : '未发放'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
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
    </div>
  )
}

export default MySalaryDetails
