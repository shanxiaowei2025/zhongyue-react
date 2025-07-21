import React from 'react'
import { Form, Input, Select, DatePicker, Button, Row, Col, Cascader } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useDepartments } from '../hooks/useDepartments'
import type { QueryEmployeeDto } from '../types/employee'

const { Option } = Select
const { RangePicker } = DatePicker

interface EmployeeSearchProps {
  onSearch: (values: QueryEmployeeDto) => void
  onReset: () => void
  loading?: boolean
  initialValues?: QueryEmployeeDto
}

const employeeTypeOptions = [
  { label: '正式', value: '正式' },
  { label: '实习', value: '实习' },
  { label: '临时', value: '临时' },
  { label: '外包', value: '外包' },
]

const positionOptions = [
  { label: '项目经理', value: '项目经理' },
  { label: '会计师', value: '会计师' },
  { label: '记账会计', value: '记账会计' },
  { label: '顾问会计', value: '顾问会计' },
  { label: '税务专员', value: '税务专员' },
  { label: '客户经理', value: '客户经理' },
  { label: '销售专员', value: '销售专员' },
]

const rankOptions = [
  { label: 'P1', value: 'P1' },
  { label: 'P2', value: 'P2' },
  { label: 'P3', value: 'P3' },
  { label: 'P4', value: 'P4' },
  { label: 'P5', value: 'P5' },
  { label: 'M1', value: 'M1' },
  { label: 'M2', value: 'M2' },
  { label: 'M3', value: 'M3' },
]

const commissionRatePositionOptions = [
  { label: '初级顾问', value: '初级顾问' },
  { label: '中级顾问', value: '中级顾问' },
  { label: '高级顾问', value: '高级顾问' },
  { label: '资深顾问', value: '资深顾问' },
  { label: '首席顾问', value: '首席顾问' },
]

export const EmployeeSearch: React.FC<EmployeeSearchProps> = ({
  onSearch,
  onReset,
  loading,
  initialValues,
}) => {
  const [form] = Form.useForm()
  const { departments } = useDepartments()

  const handleFinish = (values: any) => {
    const searchParams: QueryEmployeeDto = {
      ...values,
      departmentId: values.departmentIds?.length
        ? values.departmentIds[values.departmentIds.length - 1]
        : undefined,
    }
    delete (searchParams as any).departmentIds
    onSearch(searchParams)
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={initialValues}
        className="employee-search-form"
      >
        <Row gutter={[16, 8]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="员工姓名" name="name">
              <Input placeholder="请输入员工姓名" allowClear />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="所属部门" name="departmentIds">
              <Cascader
                options={departments}
                fieldNames={{
                  label: 'name',
                  value: 'id',
                  children: 'children',
                }}
                placeholder="请选择部门"
                allowClear
                showSearch
                changeOnSelect={false}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="员工类型" name="employeeType">
              <Select placeholder="请选择员工类型" allowClear>
                {employeeTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="职位" name="position">
              <Select placeholder="请选择职位" allowClear showSearch>
                {positionOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="职级" name="rank">
              <Select placeholder="请选择职级" allowClear>
                {rankOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="提成比率职位" name="commissionRatePosition">
              <Select placeholder="请选择提成比率职位" allowClear>
                {commissionRatePositionOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="在职状态" name="isResigned">
              <Select placeholder="请选择在职状态" allowClear>
                <Option value={false}>在职</Option>
                <Option value={true}>已离职</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="身份证号" name="idCardNumber">
              <Input placeholder="请输入身份证号" allowClear />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="实际生日" name="actualBirthday">
              <Input placeholder="请输入实际生日描述" allowClear />
            </Form.Item>
          </Col>

          <Col xs={24} sm={24} md={24} lg={6}>
            <Form.Item label=" " className="mb-0">
              <div className="flex gap-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  loading={loading}
                >
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  )
}
