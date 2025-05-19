import React, { useState, useEffect, useRef } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Tabs,
  InputNumber,
  Upload,
  message,
  Space
} from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useExpenseDetail } from '../../hooks/useExpense'
import { Expense, CreateExpenseDto } from '../../types/expense'
import { getExpenseAutocomplete } from '../../api/expense'
import dayjs from 'dayjs'

interface ExpenseFormProps {
  visible: boolean
  mode: 'add' | 'edit'
  expense?: Expense | null
  onCancel: () => void
}

const { TabPane } = Tabs

const ExpenseForm: React.FC<ExpenseFormProps> = ({ visible, mode, expense, onCancel }) => {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('1')
  const [companyNameOptions, setCompanyNameOptions] = useState<string[]>([])
  const [locationOptions, setLocationOptions] = useState<string[]>([])
  const [companyTypeOptions, setCompanyTypeOptions] = useState<string[]>([])
  const [searchingCompanyName, setSearchingCompanyName] = useState(false)
  const [searchingLocation, setSearchingLocation] = useState(false)
  const [searchingCompanyType, setSearchingCompanyType] = useState(false)
  const [calculatingTotal, setCalculatingTotal] = useState(false)
  
  // 使用useRef跟踪表单是否已挂载
  const formMountedRef = useRef(false)
  const [prevFormValues, setPrevFormValues] = useState({})

  const { createExpense, updateExpense } = useExpenseDetail(mode === 'edit' ? expense?.id : null)

  // 费用字段列表
  const feeFields = [
    'licenseFee', 'brandFee', 'recordSealFee', 'generalSealFee',
    'agencyFee', 'accountingSoftwareFee', 'addressFee',
    'invoiceSoftwareFee', 'socialInsuranceAgencyFee', 'statisticalReportFee',
    'changeFee', 'administrativeLicenseFee', 'otherBusinessFee'
  ]

  // 安全地获取表单值并计算总费用
  const calculateTotalFee = React.useCallback(() => {
    if (!visible || !formMountedRef.current) return // 不可见或表单未挂载时不执行
    
    setCalculatingTotal(true)
    try {
      const formValues = form.getFieldsValue()
      
      let total = 0
      feeFields.forEach(field => {
        if (formValues[field]) {
          total += Number(formValues[field])
        }
      })
      
      form.setFieldsValue({ totalFee: total })
    } catch (error) {
      console.error('计算总费用失败:', error)
    } finally {
      setCalculatingTotal(false)
    }
  }, [form, visible, feeFields])

  // 处理表单挂载和卸载
  useEffect(() => {
    if (visible) {
      // 延迟标记表单为已挂载，确保Form组件已完全渲染
      const timer = setTimeout(() => {
        formMountedRef.current = true
      }, 500)
      
      return () => {
        clearTimeout(timer)
        formMountedRef.current = false
      }
    } else {
      formMountedRef.current = false
    }
  }, [visible])

  // 初始化表单数据
  useEffect(() => {
    if (!visible || !form) return
    
    // 延迟执行表单初始化，确保Form组件已经渲染
    const initFormTimeout = setTimeout(() => {
      try {
        if (mode === 'edit' && expense) {
          const formData = {
            ...expense,
            accountingSoftwareStartDate: expense.accountingSoftwareStartDate ? dayjs(expense.accountingSoftwareStartDate) : null,
            accountingSoftwareEndDate: expense.accountingSoftwareEndDate ? dayjs(expense.accountingSoftwareEndDate) : null,
            addressStartDate: expense.addressStartDate ? dayjs(expense.addressStartDate) : null,
            addressEndDate: expense.addressEndDate ? dayjs(expense.addressEndDate) : null,
            agencyStartDate: expense.agencyStartDate ? dayjs(expense.agencyStartDate) : null,
            agencyEndDate: expense.agencyEndDate ? dayjs(expense.agencyEndDate) : null,
            invoiceSoftwareStartDate: expense.invoiceSoftwareStartDate ? dayjs(expense.invoiceSoftwareStartDate) : null,
            invoiceSoftwareEndDate: expense.invoiceSoftwareEndDate ? dayjs(expense.invoiceSoftwareEndDate) : null,
            socialInsuranceStartDate: expense.socialInsuranceStartDate ? dayjs(expense.socialInsuranceStartDate) : null,
            socialInsuranceEndDate: expense.socialInsuranceEndDate ? dayjs(expense.socialInsuranceEndDate) : null,
            statisticalStartDate: expense.statisticalStartDate ? dayjs(expense.statisticalStartDate) : null,
            statisticalEndDate: expense.statisticalEndDate ? dayjs(expense.statisticalEndDate) : null,
            chargeDate: expense.chargeDate ? dayjs(expense.chargeDate) : null
          }
          form.setFieldsValue(formData)
        } else {
          form.resetFields()
          // 设置默认值
          form.setFieldsValue({
            chargeDate: dayjs()
          })
        }
        
        // 表单初始化后执行一次总费用计算
        if (formMountedRef.current) {
          calculateTotalFee()
        }
      } catch (error) {
        console.error('初始化表单数据失败:', error)
      }
    }, 500) // 延迟500毫秒
    
    return () => clearTimeout(initFormTimeout)
  }, [form, mode, expense, visible, calculateTotalFee])

  // 监听字段变化计算总费用
  useEffect(() => {
    if (!visible || !formMountedRef.current) return
    
    const updateTimeout = setTimeout(() => {
      try {
        // 确保表单已挂载且可见
        if (formMountedRef.current && visible) {
          const currentValues = form.getFieldsValue(feeFields)
          const hasChanged = JSON.stringify(currentValues) !== JSON.stringify(prevFormValues)
          
          if (hasChanged) {
            setPrevFormValues(currentValues)
            calculateTotalFee()
          }
        }
      } catch (error) {
        console.error('监听费用字段变化失败:', error)
      }
    }, 800)
    
    return () => clearTimeout(updateTimeout)
  }, [form, feeFields, visible, calculateTotalFee, prevFormValues])

  // 获取公司名称自动完成选项
  const fetchCompanyNameOptions = async (keyword: string) => {
    if (!keyword) return
    setSearchingCompanyName(true)
    try {
      const res = await getExpenseAutocomplete('companyName')
      const filteredOptions = res.filter((option: string) => 
        option.toLowerCase().includes(keyword.toLowerCase())
      )
      setCompanyNameOptions(filteredOptions)
    } catch (error) {
      console.error('Failed to fetch company name options:', error)
    } finally {
      setSearchingCompanyName(false)
    }
  }

  // 获取地区自动完成选项
  const fetchLocationOptions = async (keyword: string) => {
    if (!keyword) return
    setSearchingLocation(true)
    try {
      const res = await getExpenseAutocomplete('companyLocation')
      const filteredOptions = res.filter((option: string) => 
        option.toLowerCase().includes(keyword.toLowerCase())
      )
      setLocationOptions(filteredOptions)
    } catch (error) {
      console.error('Failed to fetch location options:', error)
    } finally {
      setSearchingLocation(false)
    }
  }

  // 获取公司类型自动完成选项
  const fetchCompanyTypeOptions = async (keyword: string) => {
    if (!keyword) return
    setSearchingCompanyType(true)
    try {
      const res = await getExpenseAutocomplete('companyType')
      const filteredOptions = res.filter((option: string) => 
        option.toLowerCase().includes(keyword.toLowerCase())
      )
      setCompanyTypeOptions(filteredOptions)
    } catch (error) {
      console.error('Failed to fetch company type options:', error)
    } finally {
      setSearchingCompanyType(false)
    }
  }

  // 上传合同图片的处理函数
  const handleContractUpload = (info: any) => {
    if (!formMountedRef.current) return; // 确保表单已挂载
    
    if (info.file.status === 'done') {
      // 实际情况中，这里应该返回一个URL或者文件路径
      message.success(`${info.file.name} 上传成功`)
      form.setFieldsValue({ contractImage: info.file.response.url })
      
      // 确保总费用在表单上传字段修改后再计算
      setTimeout(() => {
        calculateTotalFee();
      }, 300);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`)
    }
  }

  // 上传收费凭证的处理函数
  const handleProofUpload = (info: any) => {
    if (!formMountedRef.current) return; // 确保表单已挂载
    
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上传成功`)
      // 更新收费凭证数组
      const currentProofs = form.getFieldValue('proofOfCharge') || []
      form.setFieldsValue({ 
        proofOfCharge: [...currentProofs, info.file.response.url] 
      })
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`)
    }
  }

  // 处理提交
  const handleSubmit = async () => {
    if (!formMountedRef.current) {
      message.error('表单正在加载，请稍后重试');
      return;
    }
    
    try {
      await form.validateFields()
      const values = form.getFieldsValue()
      
      // 将Dayjs对象转换为字符串
      const dateFields = [
        'accountingSoftwareStartDate', 'accountingSoftwareEndDate',
        'addressStartDate', 'addressEndDate',
        'agencyStartDate', 'agencyEndDate',
        'invoiceSoftwareStartDate', 'invoiceSoftwareEndDate',
        'socialInsuranceStartDate', 'socialInsuranceEndDate',
        'statisticalStartDate', 'statisticalEndDate',
        'chargeDate'
      ]
      
      const formData: CreateExpenseDto = { ...values }
      
      dateFields.forEach(field => {
        if (formData[field as keyof CreateExpenseDto]) {
          formData[field as keyof CreateExpenseDto] = (formData[field as keyof CreateExpenseDto] as any).format('YYYY-MM-DD')
        }
      })
      
      if (mode === 'add') {
        await createExpense(formData)
      } else if (mode === 'edit' && expense) {
        await updateExpense(expense.id, formData)
      }
      
      onCancel()
    } catch (error) {
      console.error('提交表单失败:', error)
    }
  }

  return (
    <Modal
      title={mode === 'add' ? '新增费用' : '编辑费用'}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
      destroyOnClose
      className="full-height-modal"
    >
      <Form
        form={form}
        layout="vertical"
        style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基本信息" key="1">
            <Form.Item
              name="companyName"
              label="企业名称"
              rules={[{ required: true, message: '请输入企业名称' }]}
            >
              <Select
                showSearch
                placeholder="请输入企业名称"
                filterOption={false}
                onSearch={fetchCompanyNameOptions}
                loading={searchingCompanyName}
                options={companyNameOptions.map(name => ({ value: name, label: name }))}
              />
            </Form.Item>

            <Form.Item name="companyType" label="企业类型">
              <Select
                showSearch
                placeholder="请选择企业类型"
                filterOption={false}
                onSearch={fetchCompanyTypeOptions}
                loading={searchingCompanyType}
                options={companyTypeOptions.map(type => ({ value: type, label: type }))}
              />
            </Form.Item>

            <Form.Item name="companyLocation" label="企业归属地">
              <Select
                showSearch
                placeholder="请选择企业归属地"
                filterOption={false}
                onSearch={fetchLocationOptions}
                loading={searchingLocation}
                options={locationOptions.map(location => ({ value: location, label: location }))}
              />
            </Form.Item>

            <Form.Item name="chargeDate" label="收费日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="chargeMethod" label="收费方式">
              <Select placeholder="请选择收费方式">
                <Select.Option value="雄安中岳对公户">雄安中岳对公户</Select.Option>
                <Select.Option value="高碑店对公户">高碑店对公户</Select.Option>
                <Select.Option value="微信">微信</Select.Option>
                <Select.Option value="支付宝">支付宝</Select.Option>
                <Select.Option value="现金">现金</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="salesperson" label="提交人">
              <Input placeholder="请输入提交人" />
            </Form.Item>

            <Form.Item name="proofOfCharge" label="收费凭证">
              <Upload
                name="file"
                action="/api/upload" // 替换为实际上传地址
                listType="picture-card"
                onChange={handleProofUpload}
              >
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              </Upload>
            </Form.Item>
          </TabPane>

          <TabPane tab="办照费用 (¥0)" key="2">
            <Form.Item name="licenseType" label="办照类型">
              <Select placeholder="请选择办照类型">
                <Select.Option value="新办执照">新办执照</Select.Option>
                <Select.Option value="变更业务">变更业务</Select.Option>
                <Select.Option value="行政许可">行政许可</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="licenseFee" label="办照费用">
              <InputNumber
                placeholder="请输入办照费用"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>

            <Form.Item name="brandFee" label="牌子费">
              <InputNumber
                placeholder="请输入牌子费"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>

            <Form.Item name="recordSealFee" label="备案章费用">
              <InputNumber
                placeholder="请输入备案章费用"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>

            <Form.Item name="generalSealFee" label="一般刻章费用">
              <InputNumber
                placeholder="请输入一般刻章费用"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>
          </TabPane>

          <TabPane tab="代理记账 (¥0)" key="3">
            <Form.Item name="agencyType" label="代理类型">
              <Select placeholder="请选择代理类型">
                <Select.Option value="小规模纳税人">小规模纳税人</Select.Option>
                <Select.Option value="一般纳税人">一般纳税人</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="agencyFee" label="代理费">
              <InputNumber
                placeholder="请输入代理费"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>

            <Form.Item label="代理日期">
              <Space style={{ width: '100%' }}>
                <Form.Item name="agencyStartDate" noStyle>
                  <DatePicker placeholder="开始日期" style={{ width: '100%' }} />
                </Form.Item>
                <span>至</span>
                <Form.Item name="agencyEndDate" noStyle>
                  <DatePicker placeholder="结束日期" style={{ width: '100%' }} />
                </Form.Item>
              </Space>
            </Form.Item>

            <Form.Item name="accountingSoftwareFee" label="记账软件费">
              <InputNumber
                placeholder="请输入记账软件费"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>

            <Form.Item label="记账软件日期">
              <Space style={{ width: '100%' }}>
                <Form.Item name="accountingSoftwareStartDate" noStyle>
                  <DatePicker placeholder="开始日期" style={{ width: '100%' }} />
                </Form.Item>
                <span>至</span>
                <Form.Item name="accountingSoftwareEndDate" noStyle>
                  <DatePicker placeholder="结束日期" style={{ width: '100%' }} />
                </Form.Item>
              </Space>
            </Form.Item>

            <Form.Item name="addressFee" label="地址费">
              <InputNumber
                placeholder="请输入地址费"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>

            <Form.Item label="地址费日期">
              <Space style={{ width: '100%' }}>
                <Form.Item name="addressStartDate" noStyle>
                  <DatePicker placeholder="开始日期" style={{ width: '100%' }} />
                </Form.Item>
                <span>至</span>
                <Form.Item name="addressEndDate" noStyle>
                  <DatePicker placeholder="结束日期" style={{ width: '100%' }} />
                </Form.Item>
              </Space>
            </Form.Item>
          </TabPane>

          <TabPane tab="变更业务 (¥0)" key="4">
            <Form.Item name="changeBusiness" label="变更业务">
              <Input placeholder="请输入变更业务" />
            </Form.Item>

            <Form.Item name="changeFee" label="变更收费">
              <InputNumber
                placeholder="请输入变更收费"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>
          </TabPane>

          <TabPane tab="行政许可 (¥0)" key="5">
            <Form.Item name="administrativeLicense" label="行政许可">
              <Input placeholder="请输入行政许可" />
            </Form.Item>

            <Form.Item name="administrativeLicenseFee" label="行政许可收费">
              <InputNumber
                placeholder="请输入行政许可收费"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>
          </TabPane>

          <TabPane tab="其他业务 (¥0)" key="6">
            <Form.Item name="otherBusiness" label="其他业务">
              <Input placeholder="请输入其他业务" />
            </Form.Item>

            <Form.Item name="otherBusinessFee" label="其他业务收费">
              <InputNumber
                placeholder="请输入其他业务收费"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonBefore="¥"
              />
            </Form.Item>
          </TabPane>

          <TabPane tab="合同与备注" key="7">
            <Form.Item name="contractType" label="合同类型">
              <Select placeholder="请选择合同类型">
                <Select.Option value="代理记账">代理记账</Select.Option>
                <Select.Option value="地址托管">地址托管</Select.Option>
                <Select.Option value="工商代办">工商代办</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="contractImage" label="合同图片">
              <Upload
                name="file"
                action="/api/upload" // 替换为实际上传地址
                onChange={handleContractUpload}
              >
                <Button icon={<UploadOutlined />}>上传合同</Button>
              </Upload>
            </Form.Item>

            <Form.Item name="receiptRemarks" label="收据备注">
              <Input.TextArea placeholder="请输入收据备注" rows={3} />
            </Form.Item>

            <Form.Item name="internalRemarks" label="内部备注">
              <Input.TextArea placeholder="请输入内部备注（客户不可见）" rows={3} />
            </Form.Item>
          </TabPane>
        </Tabs>

        <div className="border-t pt-4 mt-4">
          <Form.Item name="totalFee" label="总费用">
            <InputNumber
              placeholder="总费用"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              addonBefore="¥"
              disabled
            />
          </Form.Item>
        </div>

        <div className="text-right mt-4">
          <Button onClick={onCancel} className="mr-2">
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            确定
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export default ExpenseForm 