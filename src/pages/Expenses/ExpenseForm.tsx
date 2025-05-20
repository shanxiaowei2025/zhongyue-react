import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  Space,
  Tag
} from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useExpenseDetail } from '../../hooks/useExpense'
import { Expense, CreateExpenseDto, ExpenseStatus } from '../../types/expense'
import { getExpenseAutocomplete } from '../../api/expense'
import dayjs from 'dayjs'

// 定义状态标签映射
const STATUS_LABELS = {
  [ExpenseStatus.Pending]: '未审核',
  [ExpenseStatus.Approved]: '已审核',
  [ExpenseStatus.Rejected]: '已退回'
}

interface ExpenseFormProps {
  visible: boolean
  mode: 'add' | 'edit'
  expense?: Expense | null
  onCancel: () => void
}

// 添加类型声明以解决类型错误
interface FileItem {
  uid: string;
  name: string;
  status: string;
  url: string;
  response?: { url: string };
}

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
  
  // 使用useRef跟踪表单是否已挂载和初始化
  const formMountedRef = useRef(false)
  const formInitializedRef = useRef(false)
  const [prevFormValues, setPrevFormValues] = useState<Record<string, any>>({})

  const { createExpense, updateExpense } = useExpenseDetail(mode === 'edit' ? expense?.id : null)

  // 费用字段列表
  const feeFields = [
    'licenseFee', 'brandFee', 'recordSealFee', 'generalSealFee',
    'agencyFee', 'accountingSoftwareFee', 'addressFee',
    'invoiceSoftwareFee', 'socialInsuranceAgencyFee', 'statisticalReportFee',
    'changeFee', 'administrativeLicenseFee', 'otherBusinessFee'
  ]

  // 在组件挂载时重置表单状态
  useEffect(() => {
    formMountedRef.current = true;
    formInitializedRef.current = false;
    
    // 在组件卸载时进行清理
    return () => {
      formMountedRef.current = false;
      formInitializedRef.current = false;
      form.resetFields();
    };
  }, [form]);

  // 处理费用数据加载
  useEffect(() => {
    // 只有在表单已挂载且visible为true时才初始化表单
    if (!formMountedRef.current || !visible) {
      return;
    }

    // 重置表单，清除之前的数据
    form.resetFields();
    
    // 如果是编辑模式且有费用数据，则设置表单初始值
    if (mode === 'edit' && expense) {
      console.log('设置编辑模式表单数据:', expense);
      
      // 转换日期字段
      const formData = {
        ...expense,
        // 转换日期字段为dayjs对象
        chargeDate: expense.chargeDate ? dayjs(expense.chargeDate) : undefined,
        accountingSoftwareStartDate: expense.accountingSoftwareStartDate ? dayjs(expense.accountingSoftwareStartDate) : undefined,
        accountingSoftwareEndDate: expense.accountingSoftwareEndDate ? dayjs(expense.accountingSoftwareEndDate) : undefined,
        addressStartDate: expense.addressStartDate ? dayjs(expense.addressStartDate) : undefined,
        addressEndDate: expense.addressEndDate ? dayjs(expense.addressEndDate) : undefined,
        agencyStartDate: expense.agencyStartDate ? dayjs(expense.agencyStartDate) : undefined,
        agencyEndDate: expense.agencyEndDate ? dayjs(expense.agencyEndDate) : undefined,
        invoiceSoftwareStartDate: expense.invoiceSoftwareStartDate ? dayjs(expense.invoiceSoftwareStartDate) : undefined,
        invoiceSoftwareEndDate: expense.invoiceSoftwareEndDate ? dayjs(expense.invoiceSoftwareEndDate) : undefined,
        socialInsuranceStartDate: expense.socialInsuranceStartDate ? dayjs(expense.socialInsuranceStartDate) : undefined,
        socialInsuranceEndDate: expense.socialInsuranceEndDate ? dayjs(expense.socialInsuranceEndDate) : undefined,
        statisticalStartDate: expense.statisticalStartDate ? dayjs(expense.statisticalStartDate) : undefined,
        statisticalEndDate: expense.statisticalEndDate ? dayjs(expense.statisticalEndDate) : undefined,
      };
      
      // 设置表单值
      form.setFieldsValue(formData);
      setPrevFormValues(formData);
      formInitializedRef.current = true;
    } else {
      // 添加模式，设置默认值
      const today = dayjs();
      form.setFieldsValue({
        chargeDate: today,
        totalFee: 0
      });
      setPrevFormValues({
        chargeDate: today,
        totalFee: 0
      });
      
      formInitializedRef.current = true;
    }
    
    // 加载自动完成选项
    fetchCompanyNameOptions('');
    fetchLocationOptions('');
    fetchCompanyTypeOptions('');
    
    // 设置默认选项卡
    setActiveTab('1');
  }, [visible, expense, mode, form]);

  // 安全地获取表单值并计算总费用
  const calculateTotalFee = React.useCallback(() => {
    if (!visible || !formMountedRef.current) return // 不可见或表单未挂载时不执行
    
    setCalculatingTotal(true)
    try {
      // 确保表单已挂载后再获取值
      setTimeout(() => {
        if (formMountedRef.current) {
          const formValues = form.getFieldsValue()
          
          let total = 0
          feeFields.forEach(field => {
            if (formValues[field]) {
              total += Number(formValues[field])
            }
          })
          
          form.setFieldsValue({ totalFee: total })
        }
        setCalculatingTotal(false)
      }, 100)
    } catch (error) {
      console.error('计算总费用失败:', error)
      setCalculatingTotal(false)
    }
  }, [form, visible, feeFields])

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
      message.success(`${info.file.name} 上传成功`)
      // 不再需要手动设置表单值，Form.Item 的 getValueFromEvent 会处理
      
      // 在表单值变化后计算总费用
      setTimeout(() => {
        // 直接计算总费用
        const formValues = form.getFieldsValue(feeFields);
        let total = 0;
        
        for (const field of feeFields) {
          const value = formValues[field];
          if (value) {
            total += Number(value);
          }
        }
        
        form.setFieldValue('totalFee', total);
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
      // 不再需要手动设置表单值，Form.Item 的 getValueFromEvent 会处理
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`)
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      console.log('提交表单值:', values)

      // 处理日期字段
      const formattedValues: Record<string, any> = { ...values }
      
      // 转换所有日期字段为ISO字符串格式
      const dateFields = [
        'chargeDate', 'accountingSoftwareStartDate', 'accountingSoftwareEndDate',
        'addressStartDate', 'addressEndDate', 'agencyStartDate', 'agencyEndDate',
        'invoiceSoftwareStartDate', 'invoiceSoftwareEndDate',
        'socialInsuranceStartDate', 'socialInsuranceEndDate',
        'statisticalStartDate', 'statisticalEndDate'
      ]
      
      dateFields.forEach(field => {
        if (formattedValues[field] && dayjs.isDayjs(formattedValues[field])) {
          formattedValues[field] = formattedValues[field].format('YYYY-MM-DD')
        }
      })
      
      // 处理文件上传组件的值
      if (formattedValues.contractImage && Array.isArray(formattedValues.contractImage)) {
        const file = formattedValues.contractImage[0]
        formattedValues.contractImage = file.response?.url || file.url || ''
      }
      
      if (formattedValues.proofOfCharge && Array.isArray(formattedValues.proofOfCharge)) {
        formattedValues.proofOfCharge = formattedValues.proofOfCharge.map(
          (file: any) => file.response?.url || file.url || ''
        )
      }

      if (mode === 'add') {
        await createExpense(formattedValues as CreateExpenseDto)
        message.success('创建成功')
      } else if (expense?.id) {
        await updateExpense(expense.id, formattedValues as Expense)
        message.success('更新成功')
      }

      // 表单提交成功后重置表单并关闭模态框
      form.resetFields()
      onCancel()
    } catch (error) {
      console.error('提交表单失败:', error)
      message.error('提交失败，请检查表单')
    }
  }

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  }

  return (
    <Modal
      title={mode === 'add' ? '新增费用' : '编辑费用'}
      open={visible}
      onCancel={handleCancel}
      width={1200}
      footer={null}
      destroyOnClose={true}
      className="full-height-modal"
    >
      {visible && ( // 只有在modal可见时才渲染表单，避免React警告
        <>
          <Form
            form={form}
            layout="vertical"
            style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
          >
            {/* 固定在顶部的状态栏 */}
            <div 
              style={{ 
                backgroundColor: '#f0f5ff', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                marginBottom: '16px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <span>
                <strong>当前状态：</strong>
                <Tag 
                  color={expense?.status === ExpenseStatus.Approved ? 'green' : 
                        expense?.status === ExpenseStatus.Rejected ? 'red' : 'orange'}
                >
                  {expense?.status !== undefined ? STATUS_LABELS[expense.status] : '未审核'}
                </Tag>
              </span>
              <span>
                <strong>总费用：</strong>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f', marginLeft: '8px' }}>
                  ¥
                  <Form.Item name="totalFee" noStyle>
                    <InputNumber
                      style={{ width: '100px', border: 'none' }}
                      min={0}
                      precision={2}
                      variant="borderless"
                      readOnly
                    />
                  </Form.Item>
                </span>
              </span>
            </div>

            {/* 基本信息部分 */}
            <div className="basic-info-section" style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <h3 style={{ marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>基本信息</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <Form.Item
                  name="companyName"
                  label="企业名称"
                  rules={[{ required: true, message: '请输入企业名称' }]}
                >
                  <Input placeholder="请输入企业名称" />
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <Form.Item 
                  name="proofOfCharge" 
                  label="收费凭证"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => {
                    if (Array.isArray(e)) {
                      return e;
                    }
                    // 正常上传时
                    if (e && e.fileList) {
                      return e.fileList;
                    }
                    return e;
                  }}
                  style={{ gridColumn: 'span 1' }}
                >
                  <Upload
                    name="file"
                    action="/api/upload"
                    listType="picture-card"
                    onChange={handleProofUpload}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>上传</div>
                    </div>
                  </Upload>
                </Form.Item>

                <Form.Item 
                  name="contractImage" 
                  label="电子合同"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => {
                    if (Array.isArray(e)) {
                      return e;
                    }
                    // 正常上传时
                    if (e && e.fileList) {
                      return e.fileList;
                    }
                    return e;
                  }}
                  style={{ gridColumn: 'span 1' }}
                >
                  <Upload
                    name="file"
                    action="/api/upload"
                    listType="picture-card"
                    onChange={handleContractUpload}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>上传</div>
                    </div>
                  </Upload>
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <Form.Item name="receiptRemarks" label="备注" style={{ gridColumn: 'span 3' }}>
                  <Input.TextArea placeholder="请输入备注" rows={3} />
                </Form.Item>

                <Form.Item name="internalRemarks" label="内部备注" style={{ gridColumn: 'span 3' }}>
                  <Input.TextArea placeholder="请输入内部备注（客户不可见）" rows={3} />
                </Form.Item>
              </div>
            </div>

            {/* 费用标签页部分 */}
            <div className="expense-tabs-section">
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                type="card"
                items={[
                  {
                    key: '1',
                    label: '代理记账 (¥0)',
                    children: (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <Form.Item name="businessType" label="业务类型">
                          <Select placeholder="请选择业务类型">
                            <Select.Option value="新增">新增</Select.Option>
                            <Select.Option value="续费">续费</Select.Option>
                          </Select>
                        </Form.Item>

                        <Form.Item name="agencyType" label="代理类型">
                          <Select placeholder="请选择代理类型">
                            <Select.Option value="代理记账">代理记账</Select.Option>
                            <Select.Option value="代理申报">代理申报</Select.Option>
                            <Select.Option value="经营账代理">经营账代理</Select.Option>
                          </Select>
                        </Form.Item>
                        
                        <Form.Item name="contractType" label="合同类型">
                          <Select placeholder="请选择合同类型">
                            <Select.Option value="纸质合同">纸质合同</Select.Option>
                            <Select.Option value="电子合同">电子合同</Select.Option>
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

                        <Form.Item label="代理日期" style={{ gridColumn: 'span 2' }}>
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

                        <Form.Item label="记账软件日期" style={{ gridColumn: 'span 2' }}>
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

                        <Form.Item name="invoiceSoftwareFee" label="开票软件费">
                          <InputNumber
                            placeholder="请输入开票软件费"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            addonBefore="¥"
                          />
                        </Form.Item>

                        <Form.Item label="开票软件日期" style={{ gridColumn: 'span 2' }}>
                          <Space style={{ width: '100%' }}>
                            <Form.Item name="invoiceSoftwareStartDate" noStyle>
                              <DatePicker placeholder="开始日期" style={{ width: '100%' }} />
                            </Form.Item>
                            <span>至</span>
                            <Form.Item name="invoiceSoftwareEndDate" noStyle>
                              <DatePicker placeholder="结束日期" style={{ width: '100%' }} />
                            </Form.Item>
                          </Space>
                        </Form.Item>
                      </div>
                    )
                  },
                  {
                    key: '2',
                    label: '社保代理 (¥0)',
                    children: (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <Form.Item name="insuranceTypes" label="参保险种">
                          <Select
                            placeholder="请选择或输入参保险种"
                            mode="tags"
                            style={{ width: '100%' }}
                            options={[
                              { value: '养老保险', label: '养老保险' },
                              { value: '医疗保险', label: '医疗保险' },
                              { value: '失业保险', label: '失业保险' },
                              { value: '工伤保险', label: '工伤保险' },
                              { value: '生育保险', label: '生育保险' }
                            ]}
                          />
                        </Form.Item>

                        <Form.Item name="insuredCount" label="参保人数">
                          <InputNumber
                            placeholder="请输入参保人数"
                            style={{ width: '100%' }}
                            min={0}
                            precision={0}
                          />
                        </Form.Item>

                        <Form.Item name="socialInsuranceAgencyFee" label="社保代理费">
                          <InputNumber
                            placeholder="请输入社保代理费"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            addonBefore="¥"
                          />
                        </Form.Item>

                        <Form.Item label="社保日期" style={{ gridColumn: 'span 2' }}>
                          <Space style={{ width: '100%' }}>
                            <Form.Item name="socialInsuranceStartDate" noStyle>
                              <DatePicker placeholder="开始日期" style={{ width: '100%' }} />
                            </Form.Item>
                            <span>至</span>
                            <Form.Item name="socialInsuranceEndDate" noStyle>
                              <DatePicker placeholder="结束日期" style={{ width: '100%' }} />
                            </Form.Item>
                          </Space>
                        </Form.Item>
                      </div>
                    )
                  },
                  {
                    key: '3',
                    label: '统计报表 (¥0)',
                    children: (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <Form.Item name="statisticalReportFee" label="统计局报表费">
                          <InputNumber
                            placeholder="请输入统计局报表费"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            addonBefore="¥"
                          />
                        </Form.Item>

                        <Form.Item label="统计日期" style={{ gridColumn: 'span 2' }}>
                          <Space style={{ width: '100%' }}>
                            <Form.Item name="statisticalStartDate" noStyle>
                              <DatePicker placeholder="开始日期" style={{ width: '100%' }} />
                            </Form.Item>
                            <span>至</span>
                            <Form.Item name="statisticalEndDate" noStyle>
                              <DatePicker placeholder="结束日期" style={{ width: '100%' }} />
                            </Form.Item>
                          </Space>
                        </Form.Item>
                      </div>
                    )
                  },
                  {
                    key: '4',
                    label: '新办执照 (¥0)',
                    children: (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <Form.Item name="licenseType" label="办照类型">
                          <Select placeholder="请选择办照类型">
                            <Select.Option value="个体">个体</Select.Option>
                            <Select.Option value="公司">公司</Select.Option>
                            <Select.Option value="合作社">合作社</Select.Option>
                            <Select.Option value="个人独资企业">个人独资企业</Select.Option>
                            <Select.Option value="补领执照">补领执照</Select.Option>
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
                        
                        <Form.Item name="addressFee" label="地址费">
                          <InputNumber
                            placeholder="请输入地址费"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            addonBefore="¥"
                          />
                        </Form.Item>

                        <Form.Item label="地址费日期" style={{ gridColumn: 'span 2' }}>
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
                      </div>
                    )
                  },
                  {
                    key: '5',
                    label: '变更业务 (¥0)',
                    children: (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <Form.Item name="changeBusiness" label="变更业务">
                          <Select
                            placeholder="请选择或输入变更业务"
                            mode="tags"
                            style={{ width: '100%' }}
                            options={[
                              { value: '地址变更', label: '地址变更' },
                              { value: '名称变更', label: '名称变更' },
                              { value: '股东变更', label: '股东变更' },
                              { value: '监事变更', label: '监事变更' },
                              { value: '范围变更', label: '范围变更' },
                              { value: '注册资本变更', label: '注册资本变更' },
                              { value: '跨区域变更', label: '跨区域变更' }
                            ]}
                          />
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
                      </div>
                    )
                  },
                  {
                    key: '6',
                    label: '行政许可 (¥0)',
                    children: (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <Form.Item name="administrativeLicense" label="行政许可">
                          <Select
                            placeholder="请选择或输入行政许可"
                            mode="tags"
                            style={{ width: '100%' }}
                            options={[
                              { value: '食品经营许可证', label: '食品经营许可证' },
                              { value: '卫生许可证', label: '卫生许可证' },
                              { value: '酒类经营许可证', label: '酒类经营许可证' },
                              { value: '烟草专卖零售许可证', label: '烟草专卖零售许可证' },
                              { value: '道路运输许可证', label: '道路运输许可证' },
                              { value: '医疗器械经营许可证', label: '医疗器械经营许可证' },
                              { value: '建筑施工许可证', label: '建筑施工许可证' },
                              { value: '特种行业许可证', label: '特种行业许可证' }
                            ]}
                          />
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
                      </div>
                    )
                  },
                  {
                    key: '7',
                    label: '其他业务 (¥0)',
                    children: (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <Form.Item name="otherBusiness" label="其他业务">
                          <Select
                            placeholder="请选择或输入其他业务"
                            mode="tags"
                            style={{ width: '100%' }}
                            options={[
                              { value: '审计报告', label: '审计报告' },
                              { value: '评估报告', label: '评估报告' },
                              { value: '检测报告', label: '检测报告' },
                              { value: '商标', label: '商标' },
                              { value: '条形码', label: '条形码' },
                              { value: '工商异常', label: '工商异常' },
                              { value: '税务异常', label: '税务异常' },
                              { value: '银行融资平台', label: '银行融资平台' },
                              { value: '劳务派遣年检', label: '劳务派遣年检' },
                              { value: '工商年检', label: '工商年检' },
                              { value: '补充申报', label: '补充申报' },
                              { value: '代理企业注销', label: '代理企业注销' },
                              { value: '非代理企业注销', label: '非代理企业注销' },
                              { value: '银行开户费', label: '银行开户费' },
                              { value: '公司转让', label: '公司转让' }
                            ]}
                          />
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
                      </div>
                    )
                  }
                ]}
              />
            </div>

            <div className="expense-total-section" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <div>
                  <Button onClick={handleCancel} className="mr-2">
                    取消
                  </Button>
                  <Button type="primary" onClick={handleSubmit}>
                    确定
                  </Button>
                </div>
              </div>
            </div>
          </Form>
        </>
      )}
    </Modal>
  )
}

export default ExpenseForm 