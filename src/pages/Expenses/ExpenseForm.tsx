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
  Checkbox,
  AutoComplete,
  Spin,
} from 'antd'
import { PlusOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons'
import ContractLink from '../../components/ContractLink'
import { useExpenseDetail } from '../../hooks/useExpense'
import {
  Expense,
  ExpenseFormData,
  CreateExpenseDto,
  UpdateExpenseDto,
  FileItem,
  ExpenseStatus,
} from '../../types/expense'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import FileUpload from '../../components/FileUpload'
import MultiFileUpload from '../../components/MultiFileUpload'
import { useBranchOffices } from '../../hooks/useDepartments'
import { BUSINESS_STATUS_MAP } from '../../constants'
import { deleteFile, buildImageUrl } from '../../utils/upload'
import { useDebounce } from '../../hooks/useDebounce'
import { getContractList } from '../../api/contract'
import './expenses.css'

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
  housingFundStartDate?: Dayjs
  housingFundEndDate?: Dayjs
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

  // 关联合同搜索状态
  const [contractOptions, setContractOptions] = useState<{ value: string; id: number }[]>([])
  const [contractSearchLoading, setContractSearchLoading] = useState(false)
  const [relatedContracts, setRelatedContracts] = useState<
    { id: number; contractNumber: string }[]
  >([])

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
    'housingFundAgencyFee',
    'statisticalReportFee',
    'changeFee',
    'administrativeLicenseFee',
    'otherBusinessFee',
  ]

  // 定义每个标签页包含的费用字段映射
  const tabFeeFieldsMap: Record<string, string[]> = {
    '1': ['agencyFee', 'accountingSoftwareFee', 'invoiceSoftwareFee'], // 代理记账
    '2': ['socialInsuranceAgencyFee', 'housingFundAgencyFee'], // 社保代理
    '3': ['statisticalReportFee'], // 统计报表
    '4': ['licenseFee', 'brandFee', 'recordSealFee', 'generalSealFee', 'addressFee'], // 新办执照
    '5': ['changeFee'], // 变更业务
    '6': ['administrativeLicenseFee'], // 行政许可
    '7': ['otherBusinessFee'], // 其他业务
  }

  // 定义防抖延迟时间（毫秒）
  const DEBOUNCE_DELAY = 200

  // 使用本地状态缓存最近的费用值，减少从表单获取值的频率
  const [feeFieldsCache, setFeeFieldsCache] = useState<Record<string, any>>({})

  // 共用的InputNumber解析函数
  const parseNumberInput = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined || value === '') return 0
    const parsed = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // 防抖函数：计算总费用和标签页费用
  const calculateFees = useDebounce(
    () => {
      if (!visible || !formMountedRef.current || !formInitializedRef.current) return

      try {
        // 从表单获取所有费用字段的当前值
        const values: Record<string, any> = {}
        let hasChanges = false

        // 检查每个字段是否有变化
        for (const field of feeFields) {
          const currentValue = form.getFieldValue(field as any) || 0
          values[field] = currentValue

          // 检测值是否有变化
          if (feeFieldsCache[field] !== currentValue) {
            hasChanges = true
          }
        }

        // 如果没有变化，不进行计算
        if (!hasChanges) return

        // 更新缓存
        setFeeFieldsCache(values)

        // 计算总费用
        let total = 0
        for (const field of feeFields) {
          const value = values[field]
          if (value) {
            total += typeof value === 'string' ? parseFloat(value) : Number(value)
          }
        }

        // 更新总费用
        const currentTotal = form.getFieldValue('totalFee')
        if (currentTotal !== total) {
          form.setFieldValue('totalFee', total)
        }

        // 计算每个标签页的费用
        const newTabFeeSums: Record<string, number> = {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
          '6': 0,
          '7': 0,
        }

        // 计算各标签页的费用总和
        Object.entries(tabFeeFieldsMap).forEach(([tabKey, fieldsInTab]) => {
          let sum = 0
          fieldsInTab.forEach(field => {
            if (values[field]) {
              sum +=
                typeof values[field] === 'string'
                  ? parseFloat(values[field])
                  : Number(values[field])
            }
          })
          newTabFeeSums[tabKey] = sum
        })

        // 检查是否有变化
        let tabSumsChanged = false
        for (const key in newTabFeeSums) {
          if (newTabFeeSums[key] !== tabFeeSums[key]) {
            tabSumsChanged = true
            break
          }
        }

        // 只在有变化时更新状态
        if (tabSumsChanged) {
          setTabFeeSums(newTabFeeSums)
        }
      } catch (error) {
        console.error('计算费用失败:', error)
      }
    },
    DEBOUNCE_DELAY,
    [visible, form, feeFieldsCache, tabFeeSums]
  )

  // 监听所有费用字段的变化
  feeFields.forEach(field => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const value = Form.useWatch(field, form)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (formInitializedRef.current) {
        calculateFees()
      }
    }, [value])
  })

  // 监听是否有公积金字段的变化
  const hasHousingFund = Form.useWatch('hasHousingFund', form)
  useEffect(() => {
    if (formInitializedRef.current && hasHousingFund === false) {
      // 当公积金选项为false时，清空公积金相关字段
      form.setFieldsValue({
        housingFundCount: undefined,
        housingFundAgencyFee: undefined,
        housingFundStartDate: undefined,
        housingFundEndDate: undefined,
      })

      // 更新费用缓存，确保计算时公积金费用为0
      setFeeFieldsCache(prev => ({
        ...prev,
        housingFundAgencyFee: 0,
      }))

      console.log('公积金选项已关闭，已清空相关字段')
    }
  }, [hasHousingFund, form])

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
    if (visible) {
      formMountedRef.current = true

      // 初始化表单数据
      if (mode === 'edit' && expense) {
        // 克隆对象以避免修改原始数据
        const formData: any = { ...expense }

        // 将日期字符串转换为 Dayjs 实例
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
          'housingFundStartDate',
          'housingFundEndDate',
          'statisticalStartDate',
          'statisticalEndDate',
        ].forEach(dateField => {
          if (formData[dateField]) {
            formData[dateField] = dayjs(formData[dateField])
          }
        })

        // 处理contractImage
        if (expense.contractImage) {
          // 检查类型
          if (Array.isArray(expense.contractImage)) {
            // 是数组，转换成对象数组
            formData.contractImage = expense.contractImage.map(fileName => ({
              fileName,
              url: buildImageUrl(fileName), // 使用buildImageUrl构建完整URL
            }))
          } else {
            // 不是数组，单个字符串，转为数组
            const contractImageStr = expense.contractImage as unknown as string
            // 转换为对象数组，便于FileUpload组件使用
            formData.contractImage = [
              {
                fileName: contractImageStr,
                url: buildImageUrl(contractImageStr), // 使用buildImageUrl构建完整URL
              },
            ]
          }
        }

        // 处理proofOfCharge
        if (expense.proofOfCharge) {
          // 检查类型
          if (Array.isArray(expense.proofOfCharge)) {
            formData.proofOfCharge = expense.proofOfCharge.map(fileName => ({
              fileName,
              url: buildImageUrl(fileName),
            }))
          } else {
            const proofStr = expense.proofOfCharge as unknown as string
            formData.proofOfCharge = [
              {
                fileName: proofStr,
                url: buildImageUrl(proofStr),
              },
            ]
          }
        }

        // 处理关联合同
        if (expense.relatedContract && Array.isArray(expense.relatedContract)) {
          setRelatedContracts(expense.relatedContract)
        }

        // 设置表单初始值
        form.setFieldsValue(formData)

        // 重新计算费用总额
        calculateFees()
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

        // 初始化费用字段缓存为0
        const initialFeeValues: Record<string, any> = {}
        feeFields.forEach(field => {
          initialFeeValues[field] = 0
        })
        setFeeFieldsCache(initialFeeValues)

        // 新建模式下重置所有标签页费用为0
        setTabFeeSums({
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
          '6': 0,
          '7': 0,
        })

        formInitializedRef.current = true
      }

      // 设置默认选项卡
      setActiveTab('1')
    }
  }, [visible, expense, mode, form])

  // 优化初始化后的计算逻辑
  useEffect(() => {
    if (formInitializedRef.current) {
      // 使用setTimeout确保状态更新完成后再执行一次计算
      const timer = setTimeout(() => {
        calculateFees()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [formInitializedRef.current ? 1 : 0]) // 仅在初始化完成时执行一次

  // 跟踪新上传的附件
  const [uploadedFiles, setUploadedFiles] = useState<{
    contractImage?: string[]
    proofOfCharge?: string[]
  }>({
    contractImage: [],
    proofOfCharge: [],
  })

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
        'housingFundStartDate',
        'housingFundEndDate',
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

      // 处理公积金相关字段的特殊逻辑
      if (formattedValues.hasHousingFund === false) {
        // 当公积金选项为false时，确保相关字段被设置为null
        formattedValues.housingFundCount = null
        formattedValues.housingFundAgencyFee = null
        formattedValues.housingFundStartDate = null
        formattedValues.housingFundEndDate = null
        console.log('公积金选项为false，已将相关字段设置为null')
      }

      // 处理tags模式的Select字段，确保它们的值处理正确
      // 对于chargeMethod，如果是数组，取第一个值作为字符串（与之前的处理逻辑一致）
      if (formattedValues.chargeMethod && Array.isArray(formattedValues.chargeMethod)) {
        formattedValues.chargeMethod = formattedValues.chargeMethod[0] || ''
      }

      // 对于其他使用tags模式的字段，保持数组格式
      // 后端API应该能够处理字符串数组，如果后端需要字符串，可以在这里使用join方法
      ;['changeBusiness', 'administrativeLicense', 'otherBusiness', 'insuranceTypes'].forEach(
        field => {
          if (formattedValues[field] && !Array.isArray(formattedValues[field])) {
            // 如果不是数组，转换为包含单个元素的数组
            formattedValues[field] = [formattedValues[field]]
          } else if (formattedValues[field] === undefined || formattedValues[field] === null) {
            // 如果是undefined或null，设置为空数组
            formattedValues[field] = []
          }
        }
      )

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

      // 处理关联合同
      if (!formattedValues.relatedContract) {
        formattedValues.relatedContract = []
      } else if (typeof formattedValues.relatedContract === 'string') {
        // 如果是字符串，尝试解析JSON
        try {
          formattedValues.relatedContract = JSON.parse(formattedValues.relatedContract)
        } catch (e) {
          formattedValues.relatedContract = []
        }
      }

      console.log('提交格式化后的表单数据:', formattedValues)

      if (mode === 'add') {
        await createExpense(formattedValues)
        message.success('费用创建成功')
      } else if (mode === 'edit' && expense) {
        // 如果是编辑被退回的费用，重新提交后设置状态为待审核并清空退回原因
        if (expense.status === ExpenseStatus.Rejected) {
          formattedValues.status = ExpenseStatus.Pending
          formattedValues.rejectReason = ''
        }

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
            await deleteFile(fileName)
            console.log('已删除未保存的合同图片:', fileName)
          }
        }

        // 删除已上传的收费凭证
        if (uploadedFiles.proofOfCharge && uploadedFiles.proofOfCharge.length > 0) {
          for (const fileName of uploadedFiles.proofOfCharge) {
            await deleteFile(fileName)
            console.log('已删除未保存的收费凭证:', fileName)
          }
        }
      } catch (error) {
        console.error('删除未保存文件失败:', error)
      }
    }

    form.resetFields()
    onCancel()
  }

  // 跟踪新上传的合同图片
  const handleContractFileUpload = useCallback((fileName: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      contractImage: [...(prev.contractImage || []), fileName],
    }))
  }, [])

  // 跟踪新上传的收费凭证
  const handleProofFileUpload = useCallback((fileName: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      proofOfCharge: [...(prev.proofOfCharge || []), fileName],
    }))
  }, [])

  // 从跟踪列表中移除已删除的文件
  const handleContractFileRemove = useCallback((fileName: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      contractImage: prev.contractImage?.filter(name => name !== fileName) || [],
    }))
  }, [])

  const handleProofFileRemove = useCallback((fileName: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      proofOfCharge: prev.proofOfCharge?.filter(name => name !== fileName) || [],
    }))
  }, [])

  // 搜索合同函数
  const searchContract = async (value: string) => {
    if (!value || value.length < 2) {
      setContractOptions([])
      return
    }

    setContractSearchLoading(true)
    try {
      const response = await getContractList({
        page: 1,
        pageSize: 10,
        contractNumber: value,
      })

      if (response.data && response.data.list) {
        const contracts = response.data.list
          .map(contract => ({
            value: contract.contractNumber || '',
            id: contract.id,
          }))
          .filter(item => item.value)

        setContractOptions(contracts)
      } else {
        setContractOptions([])
      }
    } catch (error) {
      console.error('搜索合同错误:', error)
      setContractOptions([])
    } finally {
      setContractSearchLoading(false)
    }
  }

  // 添加关联合同
  const handleAddRelatedContract = (value: string, option: any) => {
    if (!value || !option || !option.id) return

    // 检查是否已存在
    const existingContract = relatedContracts.find(c => c.id === option.id)
    if (existingContract) {
      message.warning('该合同已添加')
      return
    }

    // 添加新合同
    const newContract = {
      id: option.id,
      contractNumber: value,
    }

    const updatedContracts = [...relatedContracts, newContract]
    setRelatedContracts(updatedContracts)
    form.setFieldValue('relatedContract', updatedContracts)

    // 清空搜索字段 - 这里不直接修改表单，而是在UI中处理
    setTimeout(() => {
      const searchInput = document.querySelector('input[id="contractSearch"]') as HTMLInputElement
      if (searchInput) {
        searchInput.value = ''
      }
    }, 0)
  }

  // 删除关联合同
  const handleRemoveRelatedContract = (id: number) => {
    const updatedContracts = relatedContracts.filter(c => c.id !== id)
    setRelatedContracts(updatedContracts)
    form.setFieldValue('relatedContract', updatedContracts)
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
          <Form form={form} layout="vertical">
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

                <Form.Item name="unifiedSocialCreditCode" label="统一社会信用代码">
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
                    onChange={value => {
                      // 如果是数组且长度大于1，只保留最后一个值
                      if (Array.isArray(value) && value.length > 1) {
                        const lastValue = value[value.length - 1]
                        form.setFieldValue('chargeMethod', [lastValue])
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
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error('请至少上传一个收据凭证'))
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
                        handleSubmit(true)
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
                        handleSubmit(true)
                      }
                    }}
                    onFileUpload={handleContractFileUpload}
                    onFileRemove={handleContractFileRemove}
                  />
                </Form.Item>

                {/* 关联合同字段 */}
                <Form.Item
                  label="关联合同"
                  tooltip="输入合同编号关联现有合同"
                  name="relatedContract"
                  style={{ display: 'none' }} // 隐藏真实字段，仅用于存储数据
                >
                  <Input />
                </Form.Item>

                <Form.Item label="关联合同" tooltip="输入合同编号关联现有合同">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AutoComplete
                        id="contractSearch"
                        style={{ width: '100%' }}
                        placeholder="输入合同编号搜索"
                        onSearch={searchContract}
                        onSelect={handleAddRelatedContract}
                        options={contractOptions}
                        notFoundContent={
                          contractSearchLoading ? (
                            <div className="text-center py-2">
                              <Spin size="small" />
                            </div>
                          ) : null
                        }
                      />
                      <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        loading={contractSearchLoading}
                        onClick={() => {
                          const input = document.querySelector(
                            'input[id="contractSearch"]'
                          ) as HTMLInputElement
                          if (input && input.value) {
                            searchContract(input.value)
                          }
                        }}
                      >
                        搜索
                      </Button>
                    </div>
                    {relatedContracts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {relatedContracts.map(contract => (
                          <Tag
                            key={contract.id}
                            closable
                            onClose={() => handleRemoveRelatedContract(contract.id)}
                            className="relative"
                          >
                            <ContractLink
                              contractId={contract.id}
                              className="related-contract-link"
                            >
                              {contract.contractNumber}
                            </ContractLink>
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
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
                            parser={parseNumberInput}
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
                            parser={parseNumberInput}
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
                            parser={parseNumberInput}
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
                            parser={value => {
                              if (value === null || value === undefined || value === '') return 0
                              const parsed = parseInt(value as string, 10)
                              return isNaN(parsed) ? 0 : parsed
                            }}
                          />
                        </Form.Item>

                        <Form.Item name="socialInsuranceAgencyFee" label="社保代理费">
                          <InputNumber
                            placeholder="请输入社保代理费"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            addonBefore="¥"
                            parser={parseNumberInput}
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

                        <Form.Item
                          name="hasHousingFund"
                          valuePropName="checked"
                          style={{ gridColumn: 'span 3' }}
                        >
                          <Checkbox>是否有公积金</Checkbox>
                        </Form.Item>

                        <Form.Item
                          dependencies={['hasHousingFund']}
                          style={{ gridColumn: 'span 3' }}
                        >
                          {({ getFieldValue }) =>
                            getFieldValue('hasHousingFund') ? (
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(3, 1fr)',
                                  gap: '16px',
                                }}
                              >
                                <Form.Item name="housingFundCount" label="公积金人数">
                                  <InputNumber
                                    placeholder="请输入公积金人数"
                                    style={{ width: '100%' }}
                                    min={0}
                                    precision={0}
                                    parser={value => {
                                      if (value === null || value === undefined || value === '')
                                        return 0
                                      const parsed = parseInt(value as string, 10)
                                      return isNaN(parsed) ? 0 : parsed
                                    }}
                                  />
                                </Form.Item>

                                <Form.Item name="housingFundAgencyFee" label="公积金代理费">
                                  <InputNumber
                                    placeholder="请输入公积金代理费"
                                    style={{ width: '100%' }}
                                    min={0}
                                    precision={2}
                                    addonBefore="¥"
                                    parser={parseNumberInput}
                                  />
                                </Form.Item>

                                <Form.Item label="公积金日期" style={{ gridColumn: 'span 2' }}>
                                  <Space style={{ width: '100%' }}>
                                    <Form.Item name="housingFundStartDate" noStyle>
                                      <DatePicker
                                        placeholder="开始日期"
                                        style={{ width: '100%' }}
                                      />
                                    </Form.Item>
                                    <span>至</span>
                                    <Form.Item name="housingFundEndDate" noStyle>
                                      <DatePicker
                                        placeholder="结束日期"
                                        style={{ width: '100%' }}
                                      />
                                    </Form.Item>
                                  </Space>
                                </Form.Item>
                              </div>
                            ) : null
                          }
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
                            parser={parseNumberInput}
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
                            parser={parseNumberInput}
                          />
                        </Form.Item>

                        <Form.Item name="brandFee" label="牌子费">
                          <InputNumber
                            placeholder="请输入牌子费"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            addonBefore="¥"
                            parser={parseNumberInput}
                          />
                        </Form.Item>

                        <Form.Item name="recordSealFee" label="备案章费用">
                          <InputNumber
                            placeholder="请输入备案章费用"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            addonBefore="¥"
                            parser={parseNumberInput}
                          />
                        </Form.Item>

                        <Form.Item name="generalSealFee" label="一般刻章费用">
                          <InputNumber
                            placeholder="请输入一般刻章费用"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            addonBefore="¥"
                            parser={parseNumberInput}
                          />
                        </Form.Item>

                        <Form.Item name="addressFee" label="地址费">
                          <InputNumber
                            placeholder="请输入地址费"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            addonBefore="¥"
                            parser={parseNumberInput}
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
                            parser={parseNumberInput}
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
                            parser={parseNumberInput}
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
                            parser={parseNumberInput}
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
