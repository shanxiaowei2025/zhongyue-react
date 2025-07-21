import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Typography,
  InputNumber,
  Switch,
  Cascader,
  message,
  Spin,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
// import MultiFileUpload from '../../components/MultiFileUpload'
import { useDepartments } from '../../hooks/useDepartments'
import { useEmployeeDetail, useCreateEmployee, useUpdateEmployee } from '../../hooks/useEmployee'
import type { CreateEmployeeDto, UpdateEmployeeDto, ResumeFile } from '../../types/employee'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

// 预定义选项
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

const roleOptions = [
  { label: '销售专员', value: '销售专员' },
  { label: '顾问会计', value: '顾问会计' },
  { label: '记账会计', value: '记账会计' },
  { label: '税务专员', value: '税务专员' },
  { label: '客户经理', value: '客户经理' },
  { label: '项目经理', value: '项目经理' },
  { label: '主管', value: '主管' },
  { label: '经理', value: '经理' },
]

const EmployeeForm: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [resumeFiles, setResumeFiles] = useState<ResumeFile[]>([])

  // 获取部门数据
  const { departments } = useDepartments()

  // 员工详情数据
  const { employee, isLoading: employeeLoading } = useEmployeeDetail(isEdit ? parseInt(id!) : null)

  // API hooks
  const { createEmployee } = useCreateEmployee()
  const { updateEmployee } = useUpdateEmployee()

  // 初始化表单数据
  useEffect(() => {
    if (isEdit && employee) {
      const formData = {
        ...employee,
        birthday: employee.birthday ? dayjs(employee.birthday) : undefined,
        hireDate: employee.hireDate ? dayjs(employee.hireDate) : undefined,
        departmentIds: employee.departmentId
          ? [employee.departmentId] // 简化处理，实际可能需要完整路径
          : undefined,
      }

      form.setFieldsValue(formData)
      setResumeFiles(employee.resume || [])
    }
  }, [employee, form, isEdit])

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)

      // 处理部门ID
      const departmentId = values.departmentIds?.length
        ? values.departmentIds[values.departmentIds.length - 1]
        : undefined

      // 构建提交数据
      const submitData = {
        ...values,
        departmentId,
        birthday: values.birthday?.format('YYYY-MM-DD'),
        hireDate: values.hireDate?.format('YYYY-MM-DD'),
        resume: resumeFiles,
      }

      // 移除不需要的字段
      delete (submitData as any).departmentIds

      if (isEdit) {
        // 更新员工
        const updateData: UpdateEmployeeDto = submitData
        await updateEmployee(parseInt(id!), updateData)
        message.success('员工信息更新成功')
      } else {
        // 创建员工
        const createData: CreateEmployeeDto = submitData
        await createEmployee(createData)
        message.success('员工创建成功')
      }

      // 返回员工列表页面
      navigate('/employees')
    } catch (error: any) {
      console.error('提交失败:', error)
      // 错误信息已在 hook 中处理
    } finally {
      setLoading(false)
    }
  }

  // 返回按钮
  const handleBack = () => {
    navigate('/employees')
  }

  // 身份证号验证
  const validateIdCard = (_: any, value: string) => {
    if (!value) return Promise.resolve()

    const idCardPattern = /^\d{17}[\dXx]$/
    if (!idCardPattern.test(value)) {
      return Promise.reject(new Error('身份证号格式不正确'))
    }
    return Promise.resolve()
  }

  // 银行卡号验证
  const validateBankCard = (_: any, value: string) => {
    if (!value) return Promise.resolve()

    const bankCardPattern = /^\d{16,19}$/
    if (!bankCardPattern.test(value)) {
      return Promise.reject(new Error('银行卡号格式不正确'))
    }
    return Promise.resolve()
  }

  if (employeeLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="mr-4">
            返回
          </Button>
          <Title level={2} className="m-0">
            {isEdit ? '编辑员工' : '新增员工'}
          </Title>
        </div>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={loading}>
          <Row gutter={[24, 0]}>
            {/* 基本信息 */}
            <Col span={24}>
              <Title level={4}>基本信息</Title>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="员工姓名"
                name="name"
                rules={[
                  { required: true, message: '请输入员工姓名' },
                  { max: 100, message: '姓名不能超过100个字符' },
                ]}
              >
                <Input placeholder="请输入员工姓名" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
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

            <Col xs={24} sm={12} md={8}>
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

            <Col xs={24} sm={12} md={8}>
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

            <Col xs={24} sm={12} md={8}>
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

            <Col xs={24} sm={12} md={8}>
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

            <Col xs={24} sm={12} md={8}>
              <Form.Item label="角色" name="roles">
                <Select mode="multiple" placeholder="请选择角色" allowClear>
                  {roleOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="在职状态"
                name="isResigned"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch checkedChildren="已离职" unCheckedChildren="在职" />
              </Form.Item>
            </Col>

            {/* 薪资信息 */}
            <Col span={24}>
              <Title level={4}>薪资信息</Title>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item label="基础工资" name="baseSalary">
                <InputNumber
                  placeholder="请输入基础工资"
                  style={{ width: '100%' }}
                  precision={2}
                  min={0}
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value?: string) => {
                    const parsed = parseFloat(value?.replace(/\¥\s?|(,*)/g, '') || '0')
                    return parsed || 0
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item label="工龄（年）" name="workYears">
                <InputNumber
                  placeholder="工龄"
                  style={{ width: '100%' }}
                  min={0}
                  max={50}
                  precision={1}
                />
              </Form.Item>
            </Col>

            {/* 个人信息 */}
            <Col span={24}>
              <Title level={4}>个人信息</Title>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="身份证号"
                name="idCardNumber"
                rules={[{ validator: validateIdCard }]}
                extra={isEdit ? '注意：身份证号创建后不能修改' : ''}
              >
                <Input placeholder="请输入身份证号" disabled={isEdit} maxLength={18} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="银行卡号"
                name="bankCardNumber"
                rules={[{ validator: validateBankCard }]}
              >
                <Input placeholder="请输入银行卡号" maxLength={19} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item label="生日" name="birthday">
                <DatePicker
                  placeholder="请选择生日"
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item label="实际生日" name="actualBirthday">
                <Input placeholder="如：农历1990年正月初一" maxLength={20} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item label="入职时间" name="hireDate">
                <DatePicker
                  placeholder="请选择入职时间"
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>

            {/* 简历文件 */}
            <Col span={24}>
              <Title level={4}>简历文件</Title>
            </Col>

            <Col span={24}>
              <Form.Item label="简历附件">
                <TextArea
                  placeholder="暂不支持文件上传，请填写简历文件说明"
                  rows={3}
                  value={resumeFiles.length > 0 ? resumeFiles.map(f => f.fileName).join(', ') : ''}
                  onChange={(e) => {
                    // 简化处理，暂时不支持文件上传
                    if (e.target.value) {
                      setResumeFiles([{
                        fileName: e.target.value,
                        fileUrl: '',
                        fileSize: 0,
                        fileType: 'text/plain',
                        uploadTime: new Date().toISOString()
                      }])
                    } else {
                      setResumeFiles([])
                    }
                  }}
                />
              </Form.Item>
            </Col>

            {/* 提交按钮 */}
            <Col span={24}>
              <div className="flex justify-end space-x-4 mt-8">
                <Button onClick={handleBack}>取消</Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  {isEdit ? '更新' : '创建'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  )
}

export default EmployeeForm
