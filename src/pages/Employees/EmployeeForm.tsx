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
  AutoComplete,
  message,
  Spin,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import MultiFileUpload from '../../components/MultiFileUpload'
import { useDepartments, getDepartmentPath } from '../../hooks/useDepartments'
import { useEmployeeDetail, useCreateEmployee, useUpdateEmployee } from '../../hooks/useEmployee'
import { useEmployeeFormStore } from '../../store/employeeForm'
import { useAuthStore } from '../../store/auth'
import type { CreateEmployeeDto, UpdateEmployeeDto, ResumeFile } from '../../types/employee'
import type { ImageType } from '../../types'

// 声明全局的标签页管理函数
declare global {
  interface Window {
    closeTab?: (tabKey: string) => boolean
  }
}

const { Title } = Typography
const { Option } = Select

// 预定义选项
const employeeTypeOptions = [
  { label: '正式', value: '正式' },
  { label: '实习', value: '实习' },
  { label: '临时', value: '临时' },
  { label: '外包', value: '外包' },
]

const positionOptions = [
  { label: '账务部主管', value: '账务部主管' },
  { label: '内账部主管', value: '内账部主管' },
  { label: '顾问会计', value: '顾问会计' },
  { label: '记账会计', value: '记账会计' },
  { label: '开票员', value: '开票员' },
  { label: '行政部主管', value: '行政部主管' },
  { label: '行政文员', value: '行政文员' },
  { label: '行政专员', value: '行政专员' },
  { label: '社保专员', value: '社保专员' },
  { label: '注册外勤', value: '注册外勤' },
  { label: '销售专员', value: '销售专员' },
  { label: '业务专员', value: '业务专员' },
  { label: '雄安分公司负责人', value: '雄安分公司负责人' },
  { label: '高碑店分公司负责人', value: '高碑店分公司负责人' },
]

// 生成职级选项 P0-1 到 P7-4，每个级别都有4个子级别
const generateRankOptions = () => {
  const options = []
  for (let i = 0; i <= 7; i++) {
    for (let j = 1; j <= 4; j++) {
      options.push({ label: `P${i}-${j}`, value: `P${i}-${j}` })
    }
  }
  return options
}

const rankOptions = generateRankOptions()

const commissionRatePositionOptions = [
  { label: '顾问', value: '顾问' },
  { label: '销售', value: '销售' },
  { label: '其他', value: '其他' },
]

const payrollCompanyOptions = [
  { label: '中岳会计', value: '中岳会计' },
  { label: '雄安分公司', value: '雄安分公司' },
  { label: '高碑店分公司', value: '高碑店分公司' },
  { label: '金盾', value: '金盾' },
  { label: '如你心意', value: '如你心意' },
  { label: '脉信', value: '脉信' },
  { label: '锦朝', value: '锦朝' },
  { label: '乾韵', value: '乾韵' },
  { label: '卓艺', value: '卓艺' },
]

const EmployeeForm: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)

  // 检查用户是否有权限编辑基础工资
  const canEditSalary =
    user?.roles?.includes('super_admin') || user?.roles?.includes('salary_admin')
  const [resumeFiles, setResumeFiles] = useState<Record<string, ImageType>>({})
  const [isResigned, setIsResigned] = useState(false)

  // 表单状态管理
  const currentPath = isEdit ? `/employees/edit/${id}` : '/employees/create'
  const { batchUpdateFormData, clearFormData, getFormData, hasFormData, setRestoring } =
    useEmployeeFormStore()

  // 获取部门数据
  const { departments, rawDepartments } = useDepartments()

  // 员工详情数据
  const { employee, isLoading: employeeLoading } = useEmployeeDetail(isEdit ? parseInt(id!) : null)

  // API hooks
  const { createEmployee } = useCreateEmployee()
  const { updateEmployee } = useUpdateEmployee()

  // 恢复或初始化表单数据
  useEffect(() => {
    // 避免在数据加载期间重复初始化
    if (isEdit && (!employee || rawDepartments.length === 0)) {
      return
    }

    const initializeForm = () => {
      setRestoring(true)

      // 检查是否有缓存的表单数据
      const cachedData = getFormData(currentPath)
      const hasCachedData = hasFormData(currentPath)

      if (hasCachedData && !isEdit) {
        // 创建页面：优先使用缓存数据，确保日期字段安全处理
        // 恢复创建员工表单缓存数据

        // 安全的日期处理函数
        const safeDayjs = (dateValue: any) => {
          if (!dateValue) return undefined

          // 如果已经是有效的dayjs对象，直接返回
          if (
            dateValue &&
            typeof dateValue.format === 'function' &&
            typeof dateValue.isValid === 'function'
          ) {
            return dateValue.isValid() ? dateValue : undefined
          }

          // 如果是字符串，尝试解析
          if (typeof dateValue === 'string') {
            try {
              const date = dayjs(dateValue)
              return date.isValid() ? date : undefined
            } catch {
              console.warn('Invalid date string:', dateValue)
              return undefined
            }
          }

          // 如果是其他类型（可能是序列化后的对象），尝试转换
          try {
            const date = dayjs(dateValue)
            return date.isValid() ? date : undefined
          } catch {
            console.warn('Invalid date value:', dateValue)
            return undefined
          }
        }

        const safeData = {
          ...cachedData,
          birthday: cachedData.birthday ? safeDayjs(cachedData.birthday) : undefined,
          hireDate: cachedData.hireDate ? safeDayjs(cachedData.hireDate) : undefined,
        }

        form.setFieldsValue(safeData)

        if (cachedData.isResigned !== undefined) {
          setIsResigned(cachedData.isResigned)
        }

        if (cachedData.resumeFiles) {
          setResumeFiles(cachedData.resumeFiles)
        }
      } else if (isEdit && employee && rawDepartments.length > 0) {
        // 编辑页面：使用服务器数据，但如果有缓存则合并
        const deptPath = getDepartmentPath(employee.departmentId, rawDepartments)

        // 安全的日期处理函数
        const safeDayjs = (dateValue: any) => {
          if (!dateValue) return undefined

          // 如果已经是有效的dayjs对象，直接返回
          if (
            dateValue &&
            typeof dateValue.format === 'function' &&
            typeof dateValue.isValid === 'function'
          ) {
            return dateValue.isValid() ? dateValue : undefined
          }

          // 如果是字符串，尝试解析
          if (typeof dateValue === 'string') {
            try {
              const date = dayjs(dateValue)
              return date.isValid() ? date : undefined
            } catch {
              console.warn('Invalid date string:', dateValue)
              return undefined
            }
          }

          // 如果是其他类型（可能是序列化后的对象），尝试转换
          try {
            const date = dayjs(dateValue)
            return date.isValid() ? date : undefined
          } catch {
            console.warn('Invalid date value:', dateValue)
            return undefined
          }
        }

        const serverData = {
          ...employee,
          birthday: safeDayjs(employee.birthday),
          hireDate: safeDayjs(employee.hireDate),
          departmentIds: deptPath.length > 0 ? deptPath : undefined,
        }

        // 如果有缓存数据，合并缓存的用户输入，并确保日期字段也经过安全处理
        const finalData = hasCachedData
          ? {
              ...serverData,
              ...cachedData,
              // 确保缓存中的日期字段也经过安全处理
              birthday: cachedData.birthday ? safeDayjs(cachedData.birthday) : serverData.birthday,
              hireDate: cachedData.hireDate ? safeDayjs(cachedData.hireDate) : serverData.hireDate,
            }
          : serverData

        // 初始化编辑员工表单数据（含缓存或仅服务器数据）
        form.setFieldsValue(finalData)
        setIsResigned(finalData.isResigned || false)

        // 处理简历文件
        if (hasCachedData && cachedData.resumeFiles) {
          setResumeFiles(cachedData.resumeFiles)
        } else if (employee.resume && employee.resume.length > 0) {
          const resumeFileMap: Record<string, ImageType> = {}
          employee.resume.forEach((file, index) => {
            resumeFileMap[`resume_${index}`] = {
              fileName: file.fileName,
              url: file.fileUrl || '',
            }
          })
          setResumeFiles(resumeFileMap)
        }
      }

      setRestoring(false)
    }

    initializeForm()
  }, [employee, rawDepartments, isEdit, currentPath, form])

  // 监听表单字段变化，自动保存到缓存
  useEffect(() => {
    const handleFormChange = () => {
      const currentValues = form.getFieldsValue()
      // 保存表单数据到缓存，包括简历文件状态
      batchUpdateFormData(currentPath, {
        ...currentValues,
        isResigned,
        resumeFiles,
      })
    }

    // 防抖保存，避免频繁更新
    const debounceTimer = setTimeout(handleFormChange, 500)

    return () => {
      clearTimeout(debounceTimer)
    }
  }, [form, currentPath, batchUpdateFormData, isResigned, resumeFiles])

  // 监听外部缓存清理事件（如标签页关闭）
  useEffect(() => {
    const handleClearCache = (event: CustomEvent) => {
      const { tabKey, reason } = event.detail
      if (tabKey === currentPath || reason === 'force') {
        // 响应外部缓存清理事件
        clearFormData(currentPath)
      }
    }

    // 监听来自MainLayout的缓存清理事件
    window.addEventListener('clearEmployeeFormCache', handleClearCache as EventListener)

    return () => {
      window.removeEventListener('clearEmployeeFormCache', handleClearCache as EventListener)
    }
  }, [currentPath, clearFormData])

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)

      // 处理部门ID
      const departmentId = values.departmentIds?.length
        ? values.departmentIds[values.departmentIds.length - 1]
        : undefined

      // 转换简历文件格式
      const resumeFileArray: ResumeFile[] = Object.values(resumeFiles)
        .filter(file => file.fileName) // 过滤掉没有文件名的项
        .map(file => ({
          fileName: file.fileName!,
          fileUrl: file.url || '',
          fileSize: 0,
          fileType: file.fileName!.split('.').pop() || 'unknown',
          uploadTime: new Date().toISOString(),
        }))

      // 构建提交数据
      const submitData = {
        ...values,
        departmentId,
        birthday: values.birthday?.format('YYYY-MM-DD'),
        hireDate: values.hireDate?.format('YYYY-MM-DD'),
        resume: resumeFileArray,
      }

      // 移除不需要的字段
      delete (submitData as any).departmentIds

      if (isEdit) {
        // 更新员工时移除身份证号（不允许修改）
        delete (submitData as any).idCardNumber
        const updateData: UpdateEmployeeDto = submitData
        await updateEmployee(parseInt(id!), updateData)
        message.success('员工信息更新成功')

        // 返回员工列表页面
        navigate('/employees')

        // 清理表单缓存
        clearFormData(currentPath)

        // 延迟关闭编辑员工标签页，确保跳转完成
        setTimeout(() => {
          const currentPath = `/employees/edit/${id}`
          if (window.closeTab) {
            const success = window.closeTab(currentPath)
            if (success) {
              // 编辑员工标签页已关闭，已返回员工列表
            } else {
              console.warn(`⚠️ 关闭编辑员工标签页失败: ${currentPath}`)
            }
          }
        }, 300)
      } else {
        // 创建员工
        const createData: CreateEmployeeDto = submitData
        await createEmployee(createData)
        message.success('员工创建成功')

        // 返回员工列表页面
        navigate('/employees')

        // 清理表单缓存
        clearFormData(currentPath)

        // 延迟关闭创建员工标签页，确保跳转完成
        setTimeout(() => {
          if (window.closeTab) {
            const success = window.closeTab('/employees/create')
            if (success) {
              // 创建员工标签页已关闭，已返回员工列表
            } else {
              console.warn('⚠️ 关闭创建员工标签页失败')
            }
          }
        }, 300)
      }
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
      {/* 顶部标题栏 - 添加粘性定位 */}
      <div
        className="mb-6 bg-white z-10"
        style={{
          position: 'sticky',
          top: -25,
          paddingTop: '1rem',
          paddingBottom: '1rem',
          marginLeft: '-1.5rem',
          marginRight: '-1.5rem',
          marginTop: '-1.5rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          borderBottom: '2px solid #d1d5db', // 加粗边框使其更明显
          boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.15)', // 增强阴影效果
        }}
      >
        <div className="flex items-center justify-between">
          {/* 左侧：返回按钮和标题 */}
          <div className="flex items-center">
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="mr-4">
              返回
            </Button>
            <Title level={2} className="m-0">
              {isEdit ? '编辑员工' : '新增员工'}
            </Title>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex space-x-4">
            <Button onClick={handleBack} disabled={loading}>
              取消
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={loading}
              disabled={loading}
            >
              {isEdit ? '更新' : '创建'}
            </Button>
          </div>
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
                  placeholder="请选择部门"
                  allowClear
                  showSearch
                  changeOnSelect={true}
                  style={{ width: '100%' }}
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
                <AutoComplete
                  placeholder="请选择或输入职位"
                  options={positionOptions}
                  allowClear
                  filterOption={(inputValue, option) =>
                    (option?.label?.toString().toLowerCase().includes(inputValue.toLowerCase()) ||
                      option?.value?.toString().toLowerCase().includes(inputValue.toLowerCase())) ??
                    false
                  }
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item label="职级" name="rank">
                <Select placeholder="请选择职级" allowClear style={{ width: '100%' }}>
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
              <Form.Item
                label="在职状态"
                name="isResigned"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch
                  checkedChildren="已离职"
                  unCheckedChildren="在职"
                  onChange={checked => {
                    setIsResigned(checked)
                    form.setFieldValue('isResigned', checked)
                  }}
                  style={{
                    backgroundColor: isResigned ? '#ff4d4f' : '#52c41a',
                  }}
                />
              </Form.Item>
            </Col>

            {/* 薪资信息 */}
            <Col span={24}>
              <Title level={4}>薪资信息</Title>
            </Col>

            {/* 基础工资字段 - 仅 super_admin 和 salary_admin 可见 */}
            {canEditSalary && (
              <Col xs={24} sm={12} md={8}>
                <Form.Item label="基础工资" name="baseSalary">
                  <InputNumber
                    placeholder="请输入基础工资"
                    style={{ width: '100%' }}
                    precision={2}
                    min={0}
                    formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value?: string) => {
                      const parsed = parseFloat(value?.replace(/¥\s?|(,*)/g, '') || '0')
                      return parsed || 0
                    }}
                  />
                </Form.Item>
              </Col>
            )}

            <Col xs={24} sm={12} md={8}>
              <Form.Item label="薪资发放公司" name="payrollCompany">
                <AutoComplete
                  placeholder="请选择或输入薪资发放公司"
                  options={payrollCompanyOptions}
                  allowClear
                  filterOption={(inputValue, option) =>
                    (option?.label?.toString().toLowerCase().includes(inputValue.toLowerCase()) ||
                      option?.value?.toString().toLowerCase().includes(inputValue.toLowerCase())) ??
                    false
                  }
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item label="工龄（年）" name="workYears">
                <InputNumber
                  placeholder="工龄根据入职时间自动计算"
                  style={{ width: '100%' }}
                  min={0}
                  max={50}
                  precision={1}
                  disabled
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
              <Form.Item label="开户银行" name="bankName">
                <Input placeholder="请输入开户银行" maxLength={50} />
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
                <MultiFileUpload
                  title="简历文件"
                  value={resumeFiles}
                  onChange={setResumeFiles}
                  disabled={loading}
                  showUploadArea={true}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  )
}

export default EmployeeForm
