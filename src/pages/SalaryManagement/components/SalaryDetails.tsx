import React, { useState } from 'react'
import { Card, Tabs, Descriptions, Button, Space, Modal, Form, message } from 'antd'
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { SalaryRecord, UpdateSalaryDto } from '../../../types/salaryIntegrated'
import SalaryCalculator from './SalaryCalculator'
import AmountInput from './AmountInput'

interface SalaryDetailsProps {
  employee: SalaryRecord | null
  yearMonth: string
  onUpdate: (id: number, data: UpdateSalaryDto) => Promise<SalaryRecord>
}

const SalaryDetails: React.FC<SalaryDetailsProps> = ({ employee, yearMonth, onUpdate }) => {
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 安全的数值转换和格式化函数
  const toNumber = (value: any): number => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(num) ? 0 : num
  }

  const formatCurrency = (value: any): string => {
    const amount = toNumber(value)
    return amount.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  if (!employee) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-2">请选择员工</div>
          <div className="text-sm">选择左侧员工查看详细薪资信息</div>
        </div>
      </div>
    )
  }

  const handleEdit = () => {
    form.setFieldsValue({
      baseSalary: employee.baseSalary,
      temporaryIncrease: employee.temporaryIncrease,
      fullAttendance: employee.fullAttendance,
      totalSubsidy: employee.totalSubsidy,
      seniority: employee.seniority,
      agencyFeeCommission: employee.agencyFeeCommission,
      performanceCommission: employee.performanceCommission,
      businessCommission: employee.businessCommission,
      attendanceDeduction: employee.attendanceDeduction,
      otherDeductions: employee.otherDeductions,
      personalMedical: employee.personalMedical,
      personalPension: employee.personalPension,
      personalUnemployment: employee.personalUnemployment,
      personalIncomeTax: employee.personalIncomeTax,
      depositDeduction: employee.depositDeduction,
      bankCardNumber: employee.bankCardNumber,
      bankCardOrWechat: employee.bankCardOrWechat,
      cashPaid: employee.cashPaid,
      corporatePayment: employee.corporatePayment,
    })
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      // 重新计算应发合计
      const totalPayable =
        (values.baseSalary || 0) +
        (values.temporaryIncrease || 0) +
        (values.fullAttendance || 0) +
        (values.totalSubsidy || 0) +
        (values.seniority || 0) +
        (values.agencyFeeCommission || 0) +
        (values.performanceCommission || 0) +
        (values.businessCommission || 0) -
        (values.attendanceDeduction || 0) -
        (values.otherDeductions || 0) -
        (values.depositDeduction || 0)

      await onUpdate(employee.id, {
        ...values,
        totalPayable,
        basicSalaryPayable: (values.baseSalary || 0) - (values.attendanceDeduction || 0),
        personalInsuranceTotal:
          (values.personalMedical || 0) +
          (values.personalPension || 0) +
          (values.personalUnemployment || 0),
      })

      setEditing(false)
      message.success('薪资信息已更新')
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    form.resetFields()
  }

  const items = [
    {
      key: 'basic',
      label: '基础信息',
      children: (
        <div className="p-4">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="姓名">{employee.name}</Descriptions.Item>
            <Descriptions.Item label="部门">{employee.department}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{employee.idCard}</Descriptions.Item>
            <Descriptions.Item label="类型">{employee.type}</Descriptions.Item>
            <Descriptions.Item label="年月">
              {dayjs(employee.yearMonth).format('YYYY年MM月')}
            </Descriptions.Item>
            <Descriptions.Item label="银行卡号">{employee.bankCardNumber}</Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
    {
      key: 'salary',
      label: '工资构成',
      children: (
        <div className="p-4">
          {editing ? (
            <Form form={form} layout="vertical">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="工资基数" name="baseSalary">
                  <AmountInput />
                </Form.Item>
                <Form.Item label="临时增加" name="temporaryIncrease">
                  <AmountInput />
                </Form.Item>
                <Form.Item label="全勤奖励" name="fullAttendance">
                  <AmountInput />
                </Form.Item>
                <Form.Item label="补贴合计" name="totalSubsidy">
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
            </Form>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-3 text-green-600">收入项目</h4>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="工资基数">
                    ¥{formatCurrency(employee.baseSalary)}
                  </Descriptions.Item>
                  <Descriptions.Item label="临时增加">
                    ¥{formatCurrency(employee.temporaryIncrease)}
                  </Descriptions.Item>
                  <Descriptions.Item label="全勤奖励">
                    ¥{formatCurrency(employee.fullAttendance)}
                  </Descriptions.Item>
                  <Descriptions.Item label="补贴合计">
                    ¥{formatCurrency(employee.totalSubsidy)}
                  </Descriptions.Item>
                  <Descriptions.Item label="工龄津贴">
                    ¥{formatCurrency(employee.seniority)}
                  </Descriptions.Item>
                </Descriptions>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-blue-600">提成项目</h4>
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
          )}
        </div>
      ),
    },
    {
      key: 'deductions',
      label: '扣除项目',
      children: (
        <div className="p-4">
          {editing ? (
            <Form form={form} layout="vertical">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="考勤扣款" name="attendanceDeduction">
                  <AmountInput />
                </Form.Item>
                <Form.Item label="其他扣款" name="otherDeductions">
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
                <Form.Item label="个人所得税" name="personalIncomeTax">
                  <AmountInput />
                </Form.Item>
                <Form.Item label="保证金扣除" name="depositDeduction">
                  <AmountInput />
                </Form.Item>
              </div>
            </Form>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-3 text-red-600">社保扣除</h4>
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
                </Descriptions>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-orange-600">其他扣除</h4>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="考勤扣款">
                    ¥{formatCurrency(employee.attendanceDeduction)}
                  </Descriptions.Item>
                  <Descriptions.Item label="其他扣款">
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
          )}
        </div>
      ),
    },
    {
      key: 'payment',
      label: '发放明细',
      children: (
        <div className="p-4">
          {editing ? (
            <Form form={form} layout="vertical">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="银行卡号" name="bankCardNumber">
                  <input className="ant-input" />
                </Form.Item>
                <div></div>
                <Form.Item label="银行卡/微信" name="bankCardOrWechat">
                  <AmountInput />
                </Form.Item>
                <Form.Item label="现金发放" name="cashPaid">
                  <AmountInput />
                </Form.Item>
                <Form.Item label="对公转账" name="corporatePayment">
                  <AmountInput />
                </Form.Item>
              </div>
            </Form>
          ) : (
            <>
              <Descriptions column={2} size="small" className="mb-4">
                <Descriptions.Item label="应发合计">
                  <span className="text-2xl font-bold text-green-600">
                    ¥{formatCurrency(employee.totalPayable)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="实发金额">
                  <span className="text-2xl font-bold text-blue-600">
                    ¥
                    {formatCurrency(
                      toNumber(employee.totalPayable) -
                        toNumber(employee.personalInsuranceTotal) -
                        toNumber(employee.personalIncomeTax)
                    )}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Descriptions column={2} size="small">
                <Descriptions.Item label="银行卡/微信">
                  ¥{formatCurrency(employee.bankCardOrWechat)}
                </Descriptions.Item>
                <Descriptions.Item label="现金发放">
                  ¥{formatCurrency(employee.cashPaid)}
                </Descriptions.Item>
                <Descriptions.Item label="对公转账">
                  ¥{formatCurrency(employee.corporatePayment)}
                </Descriptions.Item>
                <Descriptions.Item label="个税申报">
                  ¥{formatCurrency(employee.taxDeclaration)}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'calculator',
      label: '计算明细',
      children: (
        <div className="p-4">
          <SalaryCalculator salary={employee} />
        </div>
      ),
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">{employee.name} - 薪资详情</h3>
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
              <Button icon={<EditOutlined />} onClick={handleEdit}>
                编辑
              </Button>
            )}
          </Space>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs
          items={items}
          size="small"
          style={{ height: '100%' }}
          tabBarStyle={{
            margin: 0,
            paddingLeft: 16,
            borderBottom: '1px solid #f0f0f0',
          }}
        />
      </div>
    </div>
  )
}

export default SalaryDetails
