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
  Tag,
} from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useExpenseDetail } from '../../hooks/useExpense'
import {
  Expense,
  CreateExpenseDto,
  ExpenseStatus,
  ExpenseFormData,
  FileItem,
} from '../../types/expense'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import FileUpload from '../../components/FileUpload'
import MultiFileUpload from '../../components/MultiFileUpload'
import { useBranchOffices } from '../../hooks/useDepartments'
import { BUSINESS_STATUS_MAP } from '../../constants'
import { deleteFile } from '../../utils/upload'

// 定义状态标签映射
const STATUS_LABELS = {
  [ExpenseStatus.Pending]: '未审核',
  [ExpenseStatus.Approved]: '已审核',
  [ExpenseStatus.Rejected]: '已退回',
}

interface ExpenseFormProps {
  visible: boolean
  mode: 'add' | 'edit'
  expense?: Expense | null
  onCancel: () => void
}

// 扩展类型，处理表单中的日期字段
interface FormDateFields {
  chargeDate?: Dayjs
  accountingSoftwareStartDate?: Dayjs
  accountingSoftwareEndDate?: Dayjs
  addressStartDate?: Dayjs
  addressEndDate?: Dayjs
  agencyStartDate?: Dayjs
  agencyEndDate?: Dayjs
  invoiceSoftwareStartDate?: Dayjs
  invoiceSoftwareEndDate?: Dayjs
  socialInsuranceStartDate?: Dayjs
  socialInsuranceEndDate?: Dayjs
  statisticalStartDate?: Dayjs
  statisticalEndDate?: Dayjs
}

// 表单数据类型
type FormData = Omit<ExpenseFormData, keyof FormDateFields> & FormDateFields

const ExpenseForm: React.FC<ExpenseFormProps> = ({ visible, mode, expense, onCancel }) => {
  const [form] = Form.useForm<FormData>()
  const [activeTab, setActiveTab] = useState('1')
  const [tabFeeSums, setTabFeeSums] = useState<Record<string, number>>({
    '1': 0, // 代理记账
    '2': 0, // 社保代理
    '3': 0, // 统计报表
    '4': 0, // 新办执照
    '5': 0, // 变更业务
    '6': 0, // 行政许可
    '7': 0, // 其他业务
  })

  // 获取分公司/归属地数据
  const { branchOffices, isLoading: isLoadingBranchOffices } = useBranchOffices()

  // 使用formMountedRef跟踪表单是否已挂载和初始化
  const formMountedRef = useRef(false)
  const formInitializedRef = useRef(false)
  const [prevFormValues, setPrevFormValues] = useState<Record<string, any>>({})

  const { createExpense, updateExpense } = useExpenseDetail(mode === 'edit' ? expense?.id : null)

  // 费用字段列表
  const feeFields = [
    'licenseFee',
    'brandFee',
    'recordSealFee',
    'generalSealFee',
    'agencyFee',
    'accountingSoftwareFee',
    'addressFee',
    'invoiceSoftwareFee',
    'socialInsuranceAgencyFee',
    'statisticalReportFee',
    'changeFee',
    'administrativeLicenseFee',
    'otherBusinessFee',
  ]

  // 定义每个标签页包含的费用字段映射
  const tabFeeFieldsMap: Record<string, string[]> = {
    '1': ['agencyFee', 'accountingSoftwareFee', 'invoiceSoftwareFee'], // 代理记账
    '2': ['socialInsuranceAgencyFee'], // 社保代理
    '3': ['statisticalReportFee'], // 统计报表
    '4': ['licenseFee', 'brandFee', 'recordSealFee', 'generalSealFee', 'addressFee'], // 新办执照
    '5': ['changeFee'], // 变更业务
    '6': ['administrativeLicenseFee'], // 行政许可
    '7': ['otherBusinessFee'], // 其他业务
  }

  // 使用Form.useWatch监听所有费用字段
  const watchedFeeFields = feeFields.map(field => Form.useWatch(field, form))

  // 安全地获取表单值并计算总费用
  const calculateTotalFee = React.useCallback(() => {
    if (!visible || !formMountedRef.current) return // 不可见或表单未挂载时不执行

    try {
      // 使用临时变量保存表单值，避免直接使用form.getFieldsValues
      const values: Record<string, any> = {}
      for (const field of feeFields) {
        // 使用as any解决TypeScript类型约束问题
        values[field] = form.getFieldValue(field as any) || 0
      }

      let total = 0
      for (const field of feeFields) {
        const value = values[field]
        if (value) {
          // 确保将字符串转换为数字
          total += typeof value === 'string' ? parseFloat(value) : Number(value)
        }
      }

      // 设置总费用，仅当值变化时才更新
      const currentTotal = form.getFieldValue('totalFee')
      if (currentTotal !== total) {
        form.setFieldValue('totalFee', total)
      }
    } catch (error) {
      console.error('计算总费用失败:', error)
    }
  }, [form, visible]) // 移除feeFields依赖，它是一个常量数组

  // 计算每个标签页的费用子总和
  const calculateTabFeeSums = useCallback(() => {
    if (!visible || !formMountedRef.current) return

    try {
      // 使用临时变量保存表单值，避免直接使用form.getFieldsValues
      const values: Record<string, any> = {}
      for (const field of feeFields) {
        // 使用as any解决TypeScript类型约束问题
        values[field] = form.getFieldValue(field as any) || 0
      }

      const newTabFeeSums: Record<string, number> = {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
      }

      // 计算每个标签页的费用子总和
      Object.entries(tabFeeFieldsMap).forEach(([tabKey, fieldsInTab]) => {
        let sum = 0
        fieldsInTab.forEach(field => {
          if (values[field]) {
            // 确保将字符串转换为数字
            sum += typeof values[field] === 'string' ? parseFloat(values[field]) : Number(values[field])
          }
        })
        newTabFeeSums[tabKey] = sum
      })

      // 比较前后值，只有当值发生变化时才更新状态
      let hasChanged = false
      for (const key in newTabFeeSums) {
        if (newTabFeeSums[key] !== tabFeeSums[key]) {
          hasChanged = true
          break
        }
      }

      if (hasChanged) {
        setTabFeeSums(newTabFeeSums)
      }
    } catch (error) {
      console.error('计算标签页费用子总和失败:', error)
    }
  }, [form, visible, tabFeeSums]) // 依赖tabFeeSums是安全的，因为我们已确保只在值变化时更新

  // 当任何费用字段变化时，重新计算总费用和每个标签页的费用子总和
  useEffect(() => {
    if (formMountedRef.current && formInitializedRef.current) {
      calculateTotalFee()
      calculateTabFeeSums()
    }
  }, [watchedFeeFields, calculateTotalFee, calculateTabFeeSums])

  // 在组件挂载时重置表单状态
  useEffect(() => {
    formMountedRef.current = true
    formInitializedRef.current = false

    // 在组件卸载时进行清理
    return () => {
      formMountedRef.current = false
      formInitializedRef.current = false
      form.resetFields()
    }
  }, [form])

  // 加载数据时初始化
  useEffect(() => {
    // 只有在表单已挂载且visible为true时才初始化表单
    if (!formMountedRef.current || !visible) {
      return
    }

    // 重置表单，清除之前的数据
    form.resetFields()

    // 如果是编辑模式且有费用数据，则设置表单初始值
    if (mode === 'edit' && expense) {
      console.log('设置编辑模式表单数据:', expense)

      // 处理字符串格式的数字值
      const formData = {
        ...expense,
        // 处理费用字段，确保它们是数字类型
        licenseFee: typeof expense.licenseFee === 'string' ? parseFloat(expense.licenseFee) : expense.licenseFee,
        brandFee: typeof expense.brandFee === 'string' ? parseFloat(expense.brandFee) : expense.brandFee,
        recordSealFee: typeof expense.recordSealFee === 'string' ? parseFloat(expense.recordSealFee) : expense.recordSealFee,
        generalSealFee: typeof expense.generalSealFee === 'string' ? parseFloat(expense.generalSealFee) : expense.generalSealFee,
        agencyFee: typeof expense.agencyFee === 'string' ? parseFloat(expense.agencyFee) : expense.agencyFee,
        accountingSoftwareFee: typeof expense.accountingSoftwareFee === 'string' ? parseFloat(expense.accountingSoftwareFee) : expense.accountingSoftwareFee,
        addressFee: typeof expense.addressFee === 'string' ? parseFloat(expense.addressFee) : expense.addressFee,
        invoiceSoftwareFee: typeof expense.invoiceSoftwareFee === 'string' ? parseFloat(expense.invoiceSoftwareFee) : expense.invoiceSoftwareFee,
        socialInsuranceAgencyFee: typeof expense.socialInsuranceAgencyFee === 'string' ? parseFloat(expense.socialInsuranceAgencyFee) : expense.socialInsuranceAgencyFee,
        statisticalReportFee: typeof expense.statisticalReportFee === 'string' ? parseFloat(expense.statisticalReportFee) : expense.statisticalReportFee,
        changeFee: typeof expense.changeFee === 'string' ? parseFloat(expense.changeFee) : expense.changeFee,
        administrativeLicenseFee: typeof expense.administrativeLicenseFee === 'string' ? parseFloat(expense.administrativeLicenseFee) : expense.administrativeLicenseFee,
        otherBusinessFee: typeof expense.otherBusinessFee === 'string' ? parseFloat(expense.otherBusinessFee) : expense.otherBusinessFee,
        totalFee: typeof expense.totalFee === 'string' ? parseFloat(expense.totalFee) : expense.totalFee,
        insuredCount: typeof expense.insuredCount === 'string' ? parseInt(expense.insuredCount) : expense.insuredCount,
        
        // 确保使用了mode=tags的Select组件的值为数组
        chargeMethod: expense.chargeMethod ? 
          (Array.isArray(expense.chargeMethod) ? expense.chargeMethod : [expense.chargeMethod]) : [],
        
        changeBusiness: expense.changeBusiness ? 
          (Array.isArray(expense.changeBusiness) ? expense.changeBusiness : [expense.changeBusiness]) : [],
        
        administrativeLicense: expense.administrativeLicense ? 
          (Array.isArray(expense.administrativeLicense) ? expense.administrativeLicense : [expense.administrativeLicense]) : [],
        
        otherBusiness: expense.otherBusiness ? 
          (Array.isArray(expense.otherBusiness) ? expense.otherBusiness : [expense.otherBusiness]) : [],
        
        insuranceTypes: expense.insuranceTypes ? 
          (Array.isArray(expense.insuranceTypes) ? expense.insuranceTypes : [expense.insuranceTypes]) : [],
        
        // 转换日期字段为dayjs对象
        chargeDate: expense.chargeDate ? dayjs(expense.chargeDate) : undefined,
        accountingSoftwareStartDate: expense.accountingSoftwareStartDate
          ? dayjs(expense.accountingSoftwareStartDate)
          : undefined,
        accountingSoftwareEndDate: expense.accountingSoftwareEndDate
          ? dayjs(expense.accountingSoftwareEndDate)
          : undefined,
        addressStartDate: expense.addressStartDate ? dayjs(expense.addressStartDate) : undefined,
        addressEndDate: expense.addressEndDate ? dayjs(expense.addressEndDate) : undefined,
        agencyStartDate: expense.agencyStartDate ? dayjs(expense.agencyStartDate) : undefined,
        agencyEndDate: expense.agencyEndDate ? dayjs(expense.agencyEndDate) : undefined,
        invoiceSoftwareStartDate: expense.invoiceSoftwareStartDate
          ? dayjs(expense.invoiceSoftwareStartDate)
          : undefined,
        invoiceSoftwareEndDate: expense.invoiceSoftwareEndDate
          ? dayjs(expense.invoiceSoftwareEndDate)
          : undefined,
        socialInsuranceStartDate: expense.socialInsuranceStartDate
          ? dayjs(expense.socialInsuranceStartDate)
          : undefined,
        socialInsuranceEndDate: expense.socialInsuranceEndDate
          ? dayjs(expense.socialInsuranceEndDate)
          : undefined,
        statisticalStartDate: expense.statisticalStartDate
          ? dayjs(expense.statisticalStartDate)
          : undefined,
        statisticalEndDate: expense.statisticalEndDate
          ? dayjs(expense.statisticalEndDate)
          : undefined,
      }

      // 处理contractImage
      if (expense.contractImage) {
        // 将单个字符串或字符串数组转换为FileItem数组
        if (Array.isArray(expense.contractImage)) {
          // @ts-ignore - 类型忽略，实际运行时会正确处理
          formData.contractImage = expense.contractImage.map(fileName => ({
            fileName,
            url: fileName,
          }));
        } else {
          // 兼容旧数据，单个字符串转换为数组
          // @ts-ignore - 类型忽略，实际运行时会正确处理
          formData.contractImage = [{
            fileName: expense.contractImage,
            url: expense.contractImage,
          }];
        }
      }

      // 处理proofOfCharge
      if (expense.proofOfCharge && expense.proofOfCharge.length > 0) {
        // @ts-ignore - 类型忽略，实际运行时会正确处理
        formData.proofOfCharge = expense.proofOfCharge.map(fileName => ({
          fileName,
          url: fileName,
        }))
      }

      // 设置表单值
      form.setFieldsValue(formData)
      setPrevFormValues(formData)
      formInitializedRef.current = true
    } else {
      // 添加模式，设置默认值
      const today = dayjs()
      form.setFieldsValue({
        chargeDate: today,
        totalFee: 0,
      })
      setPrevFormValues({
        chargeDate: today,
        totalFee: 0,
      })

      formInitializedRef.current = true
    }

    // 设置默认选项卡
    setActiveTab('1')
  }, [visible, expense, mode, form])

  // 跟踪新上传的附件
  const [uploadedFiles, setUploadedFiles] = useState<{
    contractImage?: string[];
    proofOfCharge?: string[];
  }>({
    contractImage: [],
    proofOfCharge: []
  });

  // 上传合同图片的处理函数
  const handleContractUpload = (info: any) => {
    console.log('合同上传:', info)
    // 此处逻辑已替换为MultiFileUpload组件内部处理
  }

  // 上传收费凭证的处理函数
  const handleProofUpload = (info: any) => {
    console.log('收据凭证上传:', info)
    // 此处逻辑已替换为MultiFileUpload组件内部处理
  }

  // 提交表单
  const handleSubmit = async (keepOpen: boolean = false) => {
    try {
      // 验证表单
      const values = await form.validateFields()

      // 深拷贝，避免修改原始值
      const formattedValues = { ...values } as any

      // 格式化所有日期字段为ISO字符串
      ;[
        'chargeDate',
        'accountingSoftwareStartDate',
        'accountingSoftwareEndDate',
        'addressStartDate',
        'addressEndDate',
        'agencyStartDate',
        'agencyEndDate',
        'invoiceSoftwareStartDate',
        'invoiceSoftwareEndDate',
        'socialInsuranceStartDate',
        'socialInsuranceEndDate',
        'statisticalStartDate',
        'statisticalEndDate',
      ].forEach(field => {
        if (formattedValues[field] && dayjs.isDayjs(formattedValues[field])) {
          formattedValues[field] = formattedValues[field].format('YYYY-MM-DD')
        }
      })

      // 处理费用字段，确保它们是有效的数值
      feeFields.forEach(field => {
        // 如果字段存在且不是null或undefined
        if (formattedValues[field] != null) {
          // 数字类型保持不变，字符串类型确保是有效的数字格式
          if (typeof formattedValues[field] === 'string' && formattedValues[field] !== '') {
            // 确保字符串是有效的数字格式
            if (!isNaN(parseFloat(formattedValues[field]))) {
              formattedValues[field] = parseFloat(formattedValues[field]).toString()
            } else {
              // 如果不是有效数字，设为null
              formattedValues[field] = null
            }
          }
          // 对于数字类型的值，保持不变
        }
      })

      // 处理tags模式的Select字段，确保它们的值处理正确
      // 对于chargeMethod，如果是数组，取第一个值作为字符串（与之前的处理逻辑一致）
      if (formattedValues.chargeMethod && Array.isArray(formattedValues.chargeMethod)) {
        formattedValues.chargeMethod = formattedValues.chargeMethod[0] || '';
      }

      // 对于其他使用tags模式的字段，保持数组格式
      // 后端API应该能够处理字符串数组，如果后端需要字符串，可以在这里使用join方法
      ['changeBusiness', 'administrativeLicense', 'otherBusiness', 'insuranceTypes'].forEach(field => {
        if (formattedValues[field] && !Array.isArray(formattedValues[field])) {
          // 如果不是数组，转换为包含单个元素的数组
          formattedValues[field] = [formattedValues[field]];
        } else if (formattedValues[field] === undefined || formattedValues[field] === null) {
          // 如果是undefined或null，设置为空数组
          formattedValues[field] = [];
        }
      });

      // 处理合同图片 - 将对象数组转换为文件名数组
      if (formattedValues.contractImage && Array.isArray(formattedValues.contractImage)) {
        formattedValues.contractImage = formattedValues.contractImage.map(
          (item: any) => item.fileName
        )
      } else if (
        formattedValues.contractImage === undefined ||
        formattedValues.contractImage === null
      ) {
        // 如果contractImage为undefined或null，表示已全部被删除，设置为空数组
        formattedValues.contractImage = []
      }

      // 处理收据凭证 - 将对象数组转换为文件名数组
      if (formattedValues.proofOfCharge && Array.isArray(formattedValues.proofOfCharge)) {
        formattedValues.proofOfCharge = formattedValues.proofOfCharge.map(
          (item: any) => item.fileName
        )
      } else if (
        formattedValues.proofOfCharge === undefined ||
        formattedValues.proofOfCharge === null
      ) {
        // 如果proofOfCharge为undefined或null，表示已全部被删除，设置为空数组
        formattedValues.proofOfCharge = []
      }

      console.log('提交格式化后的表单数据:', formattedValues)

      if (mode === 'add') {
        await createExpense(formattedValues)
        message.success('费用创建成功')
      } else if (mode === 'edit' && expense) {
        await updateExpense(expense.id, formattedValues)
        message.success('费用更新成功')
      }

      // 只有当keepOpen为false时才关闭模态框
      if (!keepOpen) {
        onCancel()
      }
    } catch (error) {
      console.error('表单提交错误:', error)
      message.error('表单验证失败，请检查输入')
    }
  }

  // 处理取消
  const handleCancel = async () => {
    // 如果是新建模式，需要清理已上传的文件
    if (mode === 'add') {
      try {
        // 删除已上传的合同图片
        if (uploadedFiles.contractImage && uploadedFiles.contractImage.length > 0) {
          for (const fileName of uploadedFiles.contractImage) {
            await deleteFile(fileName);
            console.log('已删除未保存的合同图片:', fileName);
          }
        }
        
        // 删除已上传的收费凭证
        if (uploadedFiles.proofOfCharge && uploadedFiles.proofOfCharge.length > 0) {
          for (const fileName of uploadedFiles.proofOfCharge) {
            await deleteFile(fileName);
            console.log('已删除未保存的收费凭证:', fileName);
          }
        }
      } catch (error) {
        console.error('删除未保存文件失败:', error);
      }
    }
    
    form.resetFields();
    onCancel();
  }

  // 跟踪新上传的合同图片
  const handleContractFileUpload = useCallback((fileName: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      contractImage: [...(prev.contractImage || []), fileName]
    }));
  }, []);

  // 跟踪新上传的收费凭证
  const handleProofFileUpload = useCallback((fileName: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      proofOfCharge: [...(prev.proofOfCharge || []), fileName]
    }));
  }, []);

  // 从跟踪列表中移除已删除的文件
  const handleContractFileRemove = useCallback((fileName: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      contractImage: prev.contractImage?.filter(name => name !== fileName) || []
    }));
  }, []);

  const handleProofFileRemove = useCallback((fileName: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      proofOfCharge: prev.proofOfCharge?.filter(name => name !== fileName) || []
    }));
  }, []);

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
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              <span>
                <strong>当前状态：</strong>
                <Tag
                  color={
                    expense?.status === ExpenseStatus.Approved
                      ? 'green'
                      : expense?.status === ExpenseStatus.Rejected
                        ? 'red'
                        : 'orange'
                  }
                >
                  {expense?.status !== undefined ? STATUS_LABELS[expense.status] : '未审核'}
                </Tag>
              </span>
              <span>
                <strong>总费用：</strong>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#ff4d4f',
                    marginLeft: '8px',
                  }}
                >
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
            <div
              className="basic-info-section"
              style={{
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
              }}
            >
              <h3
                style={{
                  marginBottom: '16px',
                  borderBottom: '1px solid #eee',
                  paddingBottom: '8px',
                }}
              >
                基本信息
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <Form.Item
                  name="companyName"
                  label="企业名称"
                  rules={[{ required: true, message: '请输入企业名称' }]}
                >
                  <Input placeholder="请输入企业名称" />
                </Form.Item>

                <Form.Item
                  name="unifiedSocialCreditCode"
                  label="统一社会信用代码"
                >
                  <Input placeholder="请输入统一社会信用代码" />
                </Form.Item>

                <Form.Item name="companyType" label="企业类型">
                  <Select placeholder="请选择企业类型">
                    <Select.Option value="小规模（公司）">小规模（公司）</Select.Option>
                    <Select.Option value="小规模（个体）">小规模（个体）</Select.Option>
                    <Select.Option value="一般纳税人">一般纳税人</Select.Option>
                    <Select.Option value="小规模（个人独资）">小规模（个人独资）</Select.Option>
                    <Select.Option value="合作社">合作社</Select.Option>
                    <Select.Option value="民办非企业单位">民办非企业单位</Select.Option>
                    <Select.Option value="其他">其他</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="companyLocation"
                  label="企业归属地"
                  rules={[{ required: true, message: '请选择归属地' }]}
                >
                  <Select loading={isLoadingBranchOffices}>
                    {branchOffices.map(office => (
                      <Select.Option key={office.id} value={office.name}>
                        {office.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="chargeDate" label="收费日期">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="chargeMethod" label="收费方式">
                  <Select 
                    placeholder="请选择收费方式" 
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    mode="tags"
                    tokenSeparators={[]}
                    maxTagCount={1}
                    style={{ width: '100%' }}
                    onChange={(value) => {
                      // 如果是数组且长度大于1，只保留最后一个值
                      if (Array.isArray(value) && value.length > 1) {
                        const lastValue = value[value.length - 1];
                        form.setFieldValue('chargeMethod', [lastValue]);
                      }
                    }}
                  >
                    <Select.Option value="定兴中岳对公户">定兴中岳对公户</Select.Option>
                    <Select.Option value="高碑店中岳对公户">高碑店中岳对公户</Select.Option>
                    <Select.Option value="雄安中岳对公户">雄安中岳对公户</Select.Option>
                    <Select.Option value="脉信对公户">脉信对公户</Select.Option>
                    <Select.Option value="金盾对公户">金盾对公户</Select.Option>
                    <Select.Option value="如你心意对公户">如你心意对公户</Select.Option>
                    <Select.Option value="维融对公户">维融对公户</Select.Option>
                    <Select.Option value="现金">现金</Select.Option>
                    <Select.Option value="定兴收款码">定兴收款码</Select.Option>
                    <Select.Option value="高碑店收款码">高碑店收款码</Select.Option>
                    <Select.Option value="雄安收款码">雄安收款码</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="salesperson" label="业务员">
                  <Input placeholder="请输入业务员" />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <Form.Item 
                  name="proofOfCharge" 
                  label="收据凭证" 
                  tooltip="上传收款收据、发票等凭证"
                  rules={[
                    {
                      required: true,
                      message: '请至少上传一个收据凭证',
                      validator: (_, value) => {
                        if (value && Array.isArray(value) && value.length > 0) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('请至少上传一个收据凭证'));
                      },
                    },
                  ]}
                >
                  <MultiFileUpload
                    label="收据凭证"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onSuccess={isAutoSave => {
                      // 在编辑模式下自动保存，新建模式不自动保存
                      if (isAutoSave && mode === 'edit') {
                        handleSubmit(true);
                      }
                    }}
                    onFileUpload={handleProofFileUpload}
                    onFileRemove={handleProofFileRemove}
                  />
                </Form.Item>

                <Form.Item name="contractImage" label="电子合同" tooltip="上传签署的电子合同文件">
                  <MultiFileUpload
                    label="电子合同"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onSuccess={isAutoSave => {
                      // 在编辑模式下自动保存，新建模式不自动保存
                      if (isAutoSave && mode === 'edit') {
                        handleSubmit(true);
                      }
                    }}
                    onFileUpload={handleContractFileUpload}
                    onFileRemove={handleContractFileRemove}
                  />
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
                    label: `代理记账 (¥${tabFeeSums['1']?.toFixed(2) || 0})`,
                    children: (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '16px',
                        }}
                      >
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
                    ),
                  },
                  {
                    key: '2',
                    label: `社保代理 (¥${tabFeeSums['2']?.toFixed(2) || 0})`,
                    children: (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '16px',
                        }}
                      >
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
                              { value: '生育保险', label: '生育保险' },
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
                    ),
                  },
                  {
                    key: '3',
                    label: `统计报表 (¥${tabFeeSums['3']?.toFixed(2) || 0})`,
                    children: (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '16px',
                        }}
                      >
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
                    ),
                  },
                  {
                    key: '4',
                    label: `新办执照 (¥${tabFeeSums['4']?.toFixed(2) || 0})`,
                    children: (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '16px',
                        }}
                      >
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
                    ),
                  },
                  {
                    key: '5',
                    label: `变更业务 (¥${tabFeeSums['5']?.toFixed(2) || 0})`,
                    children: (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '16px',
                        }}
                      >
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
                              { value: '跨区域变更', label: '跨区域变更' },
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
                    ),
                  },
                  {
                    key: '6',
                    label: `行政许可 (¥${tabFeeSums['6']?.toFixed(2) || 0})`,
                    children: (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '16px',
                        }}
                      >
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
                              { value: '特种行业许可证', label: '特种行业许可证' },
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
                    ),
                  },
                  {
                    key: '7',
                    label: `其他业务 (¥${tabFeeSums['7']?.toFixed(2) || 0})`,
                    children: (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '16px',
                        }}
                      >
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
                              { value: '公司转让', label: '公司转让' },
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
                    ),
                  },
                ]}
              />
            </div>

            <div
              className="expense-total-section"
              style={{
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'flex-end',
                borderTop: '1px solid #f0f0f0',
                paddingTop: '16px',
              }}
            >
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <div>
                  <Button onClick={handleCancel} className="mr-2">
                    取消
                  </Button>
                  <Button type="primary" onClick={() => handleSubmit()}>
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
