import React, { useState } from 'react'
import {
  Card,
  Tabs,
  Descriptions,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Empty,
  Tag,
} from 'antd'
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
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
      <div className="h-full flex items-center justify-center">
        <Empty description="请选择员工查看关联数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  const handleEdit = () => {
    form.setFieldsValue({
      temporaryIncrease: employee.temporaryIncrease,
      temporaryIncreaseItem: employee.temporaryIncreaseItem,
      basicSalaryPayable: employee.basicSalaryPayable,
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
      personalInsuranceTotal: employee.personalInsuranceTotal,
      companyInsuranceTotal: employee.companyInsuranceTotal,
      personalIncomeTax: employee.personalIncomeTax,
      other: employee.other,
      depositDeduction: employee.depositDeduction,
      totalPayable: employee.totalPayable,
      bankCardNumber: employee.bankCardNumber,
      payrollCompany: employee.payrollCompany,
      bankCardOrWechat: employee.bankCardOrWechat,
      cashPaid: employee.cashPaid,
      corporatePayment: employee.corporatePayment,
      taxDeclaration: employee.taxDeclaration,
    })
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      // 计算基础薪资应发和个人社保合计，应发合计由后端计算
      await onUpdate(employee.id, {
        ...values,
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
          {editing ? (
            <Form form={form} layout="vertical">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="临时增加" name="temporaryIncrease">
                  <AmountInput />
                </Form.Item>
                <Form.Item label="临时增加项目" name="temporaryIncreaseItem">
                  <Input placeholder="请输入临时增加项目名称" />
                </Form.Item>
                <Form.Item label="基础薪资应发" name="basicSalaryPayable">
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
                  <Descriptions.Item label="临时增加项目">
                    {employee.temporaryIncreaseItem || '-'}
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
                <Form.Item label="个人社保合计" name="personalInsuranceTotal">
                  <AmountInput />
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
                  <Input placeholder="请输入银行卡号" />
                </Form.Item>
                <Form.Item label="应发合计" name="totalPayable">
                  <AmountInput />
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
                <Form.Item label="个税申报" name="taxDeclaration">
                  <AmountInput />
                </Form.Item>
              </div>
            </Form>
          ) : (
            <>
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
                      <Button icon={<EditOutlined />} onClick={handleEdit}>
                        编辑
                      </Button>
                    )}
                  </Space>
                </div>
                {editing ? (
                  <Form form={form} layout="vertical">
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item label="临时增加" name="temporaryIncrease">
                        <AmountInput />
                      </Form.Item>
                      <Form.Item label="临时增加项目" name="temporaryIncreaseItem">
                        <Input placeholder="请输入临时增加项目名称" />
                      </Form.Item>
                      <Form.Item label="基础薪资应发" name="basicSalaryPayable">
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
                        <Descriptions.Item label="临时增加项目">
                          {employee.temporaryIncreaseItem || '-'}
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">{employee.name} - 扣除项目</h3>
                </div>
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
                      <Form.Item label="个人社保合计" name="personalInsuranceTotal">
                        <AmountInput />
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">{employee.name} - 发放明细</h3>
                </div>
                {editing ? (
                  <Form form={form} layout="vertical">
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item label="银行卡号" name="bankCardNumber">
                        <Input placeholder="请输入银行卡号" />
                      </Form.Item>
                      <Form.Item label="应发合计" name="totalPayable">
                        <AmountInput />
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
                      <Form.Item label="个税申报" name="taxDeclaration">
                        <AmountInput />
                      </Form.Item>
                    </div>
                  </Form>
                ) : (
                  <>
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">{employee.name} - 计算明细</h3>
                </div>
                <SalaryCalculator salary={employee} />
              </div>
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
    </div>
  )
}

export default SalaryDetails
