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

  // 在 return 语句之前定义 Tabs 的 items 数组
  const tabsItems = [
    {
      key: '1',
      label: '基本信息',
      children: (
        <>
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
        </>
      )
    },
    {
      key: '2',
      label: '办照费用 (¥0)',
      children: (
        <>
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
        </>
      )
    },
    {
      key: '3',
      label: '代理记账 (¥0)',
      children: (
        <>
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
        </>
      )
    },
    {
      key: '4',
      label: '变更业务 (¥0)',
      children: (
        <>
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
        </>
      )
    },
    {
      key: '5',
      label: '行政许可 (¥0)',
      children: (
        <>
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
        </>
      )
    },
    {
      key: '6',
      label: '其他业务 (¥0)',
      children: (
        <>
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
        </>
      )
    },
    {
      key: '7',
      label: '合同与备注',
      children: (
        <>
          <Form.Item name="contractType" label="合同类型">
            <Select placeholder="请选择合同类型">
              <Select.Option value="代理记账">代理记账</Select.Option>
              <Select.Option value="地址托管">地址托管</Select.Option>
              <Select.Option value="工商代办">工商代办</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="contractImage" 
            label="合同图片"
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
          >
            <Upload
              name="file"
              action="/api/upload"
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
        </>
      )
    }
  ];

  return (
    <Modal
      title={mode === 'add' ? '新增费用' : '编辑费用'}
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={null}
      destroyOnClose={true}
      className="full-height-modal"
    >
      {visible && ( // 只有在modal可见时才渲染表单，避免React警告
        <Form
          form={form}
          layout="vertical"
          style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
        >
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={tabsItems}
          />

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
            <Button onClick={handleCancel} className="mr-2">
              取消
            </Button>
            <Button type="primary" onClick={handleSubmit}>
              确定
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  )
}

export default ExpenseForm 