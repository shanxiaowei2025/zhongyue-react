import React, { useState } from 'react'
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Collapse,
  Space,
  Divider,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'
import type { SalaryQueryParams } from '../../../types/salaryIntegrated'

const { Option } = Select
const { Panel } = Collapse

interface SalaryFiltersProps {
  onFilter: (params: SalaryQueryParams) => void
  onReset: () => void
  loading?: boolean
}

const SalaryFilters: React.FC<SalaryFiltersProps> = ({ onFilter, onReset, loading }) => {
  const [form] = Form.useForm()
  const [collapsed, setCollapsed] = useState(true)

  const handleSubmit = (values: any) => {
    // 过滤掉空值
    const filteredValues = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value
      }
      return acc
    }, {} as any)
    
    onFilter(filteredValues)
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  const toggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  return (
    <Card size="small" className="mb-4">
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        {/* 基础筛选 - 始终显示 */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="department" label="部门">
              <Input placeholder="输入部门名称" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="name" label="姓名">
              <Input placeholder="输入员工姓名" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="type" label="类型">
              <Select placeholder="选择员工类型" allowClear>
                <Option value="正式">正式</Option>
                <Option value="实习">实习</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="isPaid" label="是否已发放">
              <Select placeholder="选择发放状态" allowClear>
                <Option value={true}>已发放</Option>
                <Option value={false}>未发放</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="payrollCompany" label="薪资发放公司">
              <Input placeholder="请输入薪资发放公司名称" allowClear />
            </Form.Item>
          </Col>
        </Row>

        {/* 操作按钮和展开/收起按钮 */}
        <div className="flex justify-between items-center">
          <Space>
            <Button type="primary" icon={<SearchOutlined />} htmlType="submit" loading={loading}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
          <Button 
            type="link" 
            icon={collapsed ? <DownOutlined /> : <UpOutlined />}
            onClick={toggleCollapse}
          >
            {collapsed ? '展开高级筛选' : '收起高级筛选'}
          </Button>
        </div>

        {/* 高级筛选 - 可折叠 */}
        {!collapsed && (
          <div style={{ marginTop: 16 }}>
            <Divider orientation="left">高级筛选</Divider>
            
            {/* 基本工资范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">基本工资</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="baseSalaryMin" label="最小值">
                    <InputNumber
                      placeholder="基本工资最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="baseSalaryMax" label="最大值">
                    <InputNumber
                      placeholder="基本工资最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 考勤扣款范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">考勤扣款</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="attendanceDeductionMin" label="最小值">
                    <InputNumber
                      placeholder="考勤扣款最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="attendanceDeductionMax" label="最大值">
                    <InputNumber
                      placeholder="考勤扣款最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 临时增加范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">临时增加</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="temporaryIncreaseMin" label="最小值">
                    <InputNumber
                      placeholder="临时增加最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="temporaryIncreaseMax" label="最大值">
                    <InputNumber
                      placeholder="临时增加最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 全勤奖范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">全勤奖</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="fullAttendanceMin" label="最小值">
                    <InputNumber
                      placeholder="全勤奖最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="fullAttendanceMax" label="最大值">
                    <InputNumber
                      placeholder="全勤奖最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 部门主管补贴范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">部门主管补贴</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="departmentHeadSubsidyMin" label="最小值">
                    <InputNumber
                      placeholder="部门主管补贴最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="departmentHeadSubsidyMax" label="最大值">
                    <InputNumber
                      placeholder="部门主管补贴最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 职务津贴范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">职务津贴</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="positionAllowanceMin" label="最小值">
                    <InputNumber
                      placeholder="职务津贴最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="positionAllowanceMax" label="最大值">
                    <InputNumber
                      placeholder="职务津贴最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 油费补贴范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">油费补贴</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="oilSubsidyMin" label="最小值">
                    <InputNumber
                      placeholder="油费补贴最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="oilSubsidyMax" label="最大值">
                    <InputNumber
                      placeholder="油费补贴最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 餐费补贴范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">餐费补贴</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="mealSubsidyMin" label="最小值">
                    <InputNumber
                      placeholder="餐费补贴最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="mealSubsidyMax" label="最大值">
                    <InputNumber
                      placeholder="餐费补贴最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 工龄工资范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">工龄工资</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="seniorityMin" label="最小值">
                    <InputNumber
                      placeholder="工龄工资最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="seniorityMax" label="最大值">
                    <InputNumber
                      placeholder="工龄工资最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 代理费提成范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">代理费提成</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="agencyFeeCommissionMin" label="最小值">
                    <InputNumber
                      placeholder="代理费提成最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="agencyFeeCommissionMax" label="最大值">
                    <InputNumber
                      placeholder="代理费提成最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 绩效提成范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">绩效提成</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="performanceCommissionMin" label="最小值">
                    <InputNumber
                      placeholder="绩效提成最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="performanceCommissionMax" label="最大值">
                    <InputNumber
                      placeholder="绩效提成最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 业务提成范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">业务提成</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="businessCommissionMin" label="最小值">
                    <InputNumber
                      placeholder="业务提成最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="businessCommissionMax" label="最大值">
                    <InputNumber
                      placeholder="业务提成最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 其他扣款范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">朋友圈扣款</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="otherDeductionsMin" label="最小值">
                    <InputNumber
                      placeholder="朋友圈扣款最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="otherDeductionsMax" label="最大值">
                    <InputNumber
                      placeholder="朋友圈扣款最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 个人保险合计范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">个人保险合计</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="personalInsuranceTotalMin" label="最小值">
                    <InputNumber
                      placeholder="个人保险合计最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="personalInsuranceTotalMax" label="最大值">
                    <InputNumber
                      placeholder="个人保险合计最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 公司保险合计范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">公司保险合计</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="companyInsuranceTotalMin" label="最小值">
                    <InputNumber
                      placeholder="公司保险合计最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="companyInsuranceTotalMax" label="最大值">
                    <InputNumber
                      placeholder="公司保险合计最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 押金扣款范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">保证金扣除</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="depositDeductionMin" label="最小值">
                    <InputNumber
                      placeholder="保证金扣除最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="depositDeductionMax" label="最大值">
                    <InputNumber
                      placeholder="保证金扣除最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 个人所得税范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">个税</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="personalIncomeTaxMin" label="最小值">
                    <InputNumber
                      placeholder="个税最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="personalIncomeTaxMax" label="最大值">
                    <InputNumber
                      placeholder="个税最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 应付合计范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">应发合计</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="totalPayableMin" label="最小值">
                    <InputNumber
                      placeholder="应发合计最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="totalPayableMax" label="最大值">
                    <InputNumber
                      placeholder="应发合计最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 银行卡/微信范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">银行卡/微信</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="bankCardOrWechatMin" label="最小值">
                    <InputNumber
                      placeholder="银行卡/微信最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="bankCardOrWechatMax" label="最大值">
                    <InputNumber
                      placeholder="银行卡/微信最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 企业代付范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">对公转账</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="corporatePaymentMin" label="最小值">
                    <InputNumber
                      placeholder="对公转账最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="corporatePaymentMax" label="最大值">
                    <InputNumber
                      placeholder="对公转账最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* 税务申报范围 */}
            <div className="mb-4">
              <div className="font-medium mb-2">个税申报</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="taxDeclarationMin" label="最小值">
                    <InputNumber
                      placeholder="个税申报最小值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="taxDeclarationMax" label="最大值">
                    <InputNumber
                      placeholder="个税申报最大值"
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Form>
    </Card>
  )
}

export default SalaryFilters 