import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react'
import { Input, DatePicker, Checkbox, message, Select } from 'antd'
import { showSuccess, showValidationError } from '../../utils/messageHelper'
import dayjs from 'dayjs'
import { useContractDetail } from '../../hooks/useContract'
import { useDebouncedValue } from '../../hooks/useDebounce'
import { getAgencyContractDates } from '../../api/contract'
import type { CreateContractDto } from '../../types/contract'
import type { Enterprise } from '../../types/enterpriseService'
import CustomerAutoComplete from '../CustomerAutoComplete'
import { formatAmount, parseAmount } from '../../utils/numberToChinese'
import { getAgencySignatoryConfig, getSignatoryStampImage } from '../../config/signatoryConfig'
import { LOCATION_OPTIONS } from '../../constants/locationOptions'
import styles from './AgencyAccountingAgreement.module.css'

// 邮政编码映射配置
const POSTAL_CODE_MAP: Record<string, string> = {
  定兴县: '072650',
  雄安新区: '071701',
  高碑店市: '074000',
  容城县: '071700',
}

// 获取乙方盖章图片
const getPartyBStampImage = (signatory: string): string => {
  return getSignatoryStampImage(signatory)
}

// 根据地址识别邮政编码
const getPostalCodeFromAddress = (address: string): string => {
  if (!address) return ''

  // 遍历邮政编码映射，检查地址中是否包含关键词
  for (const [keyword, postalCode] of Object.entries(POSTAL_CODE_MAP)) {
    if (address.includes(keyword)) {
      console.log(`🔍 [代理记账合同] 从地址中识别到邮政编码: ${keyword} -> ${postalCode}`)
      return postalCode
    }
  }

  return ''
}

// 申报服务项目
const DECLARATION_SERVICE_OPTIONS = [
  { label: '月度或季度增值税申报', value: 'vat' },
  { label: '月度或季度企业所得税预缴申报', value: 'corporate_income_tax' },
  { label: '月度个人所得税申报', value: 'personal_income_tax' },
  { label: '年度企业所得税汇算清缴', value: 'corporate_income_tax_annual' },
  { label: '年度个人所得税申报', value: 'personal_income_tax_annual' },
  { label: '财税咨询服务', value: 'tax_consulting' },
  { label: '代开发票', value: 'invoice_service' },
]

interface AgencyAccountingAgreementProps {
  signatory: string
  contractData?: Record<string, any>
  onSubmit?: (data: CreateContractDto) => void
  onUpdate?: (data: CreateContractDto) => void
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
}

// 暴露给父组件的方法接口
export interface AgencyAccountingAgreementRef {
  validateForm: () => boolean
  handleSubmit: () => Promise<void>
  getFormData: () => Record<string, any>
}

const AgencyAccountingAgreement = forwardRef<
  AgencyAccountingAgreementRef,
  AgencyAccountingAgreementProps
>(({ signatory, contractData = {}, onSubmit, onUpdate, mode = 'create' }, ref) => {
  // 获取当前签约方配置
  const config = getAgencySignatoryConfig(signatory)

  // 调试信息：检查配置获取是否正确
  useEffect(() => {
    console.log('🔍 [代理记账合同] 签署方配置调试:', {
      signatory,
      configExists: !!config,
      configAddress: config?.address,
      configTitle: config?.title,
    })
  }, [signatory, config])

  // 编辑模式下的本地状态（不使用缓存，完全基于API数据）
  const [editModeFormData, setEditModeFormData] = useState<Record<string, any>>({})

  // 创建模式的状态管理（包含乙方默认值）
  const [createModeFormData, setCreateModeFormData] = useState<Record<string, any>>({
    signatory,
    contractType: '代理记账合同',
    partyBLegalPerson: '刘菲',
    ...contractData,
  })

  // 当签署方配置变化时，更新创建模式的默认地址和电话
  useEffect(() => {
    if (mode === 'create' && config) {
      setCreateModeFormData(prev => ({
        ...prev,
        signatory,
        partyBAddress: config.address,
        partyBPhone: config.phone,
      }))
      console.log('🔄 [代理记账合同] 更新签署方默认信息:', {
        signatory,
        address: config.address,
        phone: config.phone,
      })

      // 根据默认乙方地址自动填写邮政编码
      const defaultPostalCode = getPostalCodeFromAddress(config.address)
      if (defaultPostalCode) {
        setCreateModeFormData(prev => ({
          ...prev,
          partyAPostalCode: defaultPostalCode,
          partyBPostalCode: defaultPostalCode,
        }))
        console.log(`🔄 [代理记账合同] 根据默认乙方地址自动填写邮政编码: ${defaultPostalCode}`)
      }
    }
  }, [signatory, config, mode])

  // 根据模式选择使用的表单数据
  const formData =
    mode === 'edit'
      ? {
          // 编辑模式：完全使用API数据和本地修改
          signatory,
          contractType: '代理记账合同',
          // 先设置默认值（只有当config存在时才设置）
          ...(config && {
            partyBAddress: config.address,
            partyBPhone: config.phone,
            partyBLegalPerson: '刘菲',
          }),
          // 然后用API数据覆盖默认值（确保API数据优先）
          ...contractData,
          // 最后用本地编辑数据覆盖
          ...editModeFormData,
        }
      : createModeFormData

  // 申报服务选择状态
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [otherBusiness, setOtherBusiness] = useState('')

  // 金额字段的字符串状态（用于输入显示）
  const [amountDisplayValues, setAmountDisplayValues] = useState<Record<string, string>>({
    totalAgencyAccountingFee: '',
    agencyAccountingFee: '',
    accountingSoftwareFee: '',
    invoicingSoftwareFee: '',
    accountBookFee: '',
    currentChargeFee: '',
  })

  const { createContractData } = useContractDetail()

  // 防抖处理甲方公司名称和统一社会信用代码，用于自动获取委托日期
  const debouncedCompanyName = useDebouncedValue(formData.partyACompany || '', 800)
  const debouncedCreditCode = useDebouncedValue(formData.partyACreditCode || '', 800)

  // 企业搜索使用 CustomerAutoComplete 组件

  // 自动获取委托日期函数
  const fetchAgencyDates = async () => {
    // 只有在创建模式且已有公司名称或统一社会信用代码时才请求
    if (mode !== 'create') return
    if (!formData.partyACompany && !formData.partyACreditCode) return

    try {
      const params: { companyName?: string; unifiedSocialCreditCode?: string } = {}
      if (formData.partyACompany) params.companyName = formData.partyACompany
      if (formData.partyACreditCode) params.unifiedSocialCreditCode = formData.partyACreditCode

      console.log('🔍 [代理记账合同] 获取委托日期，参数:', params)
      const response = await getAgencyContractDates(params)

      if (response.code === 0 && response.data) {
        const { agencyStartDate, agencyEndDate } = response.data

        // 自动填充委托开始和结束日期
        if (agencyStartDate) {
          handleFormChange('entrustmentStartDate', dayjs(agencyStartDate).format('YYYY-MM'))
        }
        if (agencyEndDate) {
          handleFormChange('entrustmentEndDate', dayjs(agencyEndDate).format('YYYY-MM'))
        }
        console.log('✅ [代理记账合同] 成功获取并设置委托日期:', {
          agencyStartDate,
          agencyEndDate,
        })
      }
    } catch (error) {
      // 静默处理错误，不影响用户体验
      console.warn('❌ [代理记账合同] 获取委托日期失败:', error)
    }
  }

  // 初始化表单数据
  useEffect(() => {
    if (mode === 'edit') {
      // 编辑模式：直接使用API数据初始化
      if (contractData && Object.keys(contractData).length > 0) {
        console.log('🔄 [代理记账合同] 编辑模式：初始化表单数据（完全使用API数据）')

        console.log('🔍 API数据详情:', {
          partyACompany: contractData.partyACompany,
        })

        // 如果是编辑模式且乙方地址存在，尝试填充邮政编码
        const partyBAddress = contractData.partyBAddress || config?.address || ''
        if (partyBAddress && (!contractData.partyAPostalCode || !contractData.partyBPostalCode)) {
          const postalCode = getPostalCodeFromAddress(partyBAddress)
          if (postalCode) {
            setEditModeFormData(prev => ({
              ...prev,
              partyAPostalCode: contractData.partyAPostalCode || postalCode,
              partyBPostalCode: contractData.partyBPostalCode || postalCode,
            }))
            console.log(`🔄 [代理记账合同] 编辑模式：根据乙方地址自动补充邮政编码: ${postalCode}`)
          }
        }

        console.log('🔍 API数据详情:', {
          partyACompany: contractData.partyACompany,
          partyAAddress: contractData.partyAAddress,
          partyACreditCode: contractData.partyACreditCode,
          partyBAddress: contractData.partyBAddress,
          partyBPhone: contractData.partyBPhone,
          totalAgencyAccountingFee: contractData.totalAgencyAccountingFee,
          declarationService: contractData.declarationService,
          mode: mode,
          dataSource: 'API',
          configAddress: config?.address,
          configPhone: config?.phone,
        })

        // 设置编辑模式的表单数据
        setEditModeFormData(contractData)

        // 初始化金额显示值
        const newAmountDisplayValues: Record<string, string> = {
          totalAgencyAccountingFee: contractData.totalAgencyAccountingFee
            ? String(contractData.totalAgencyAccountingFee)
            : '',
          agencyAccountingFee: contractData.agencyAccountingFee
            ? String(contractData.agencyAccountingFee)
            : '',
          accountingSoftwareFee: contractData.accountingSoftwareFee
            ? String(contractData.accountingSoftwareFee)
            : '',
          invoicingSoftwareFee: contractData.invoicingSoftwareFee
            ? String(contractData.invoicingSoftwareFee)
            : '',
          accountBookFee: contractData.accountBookFee ? String(contractData.accountBookFee) : '',
          currentChargeFee: contractData.currentChargeFee
            ? String(contractData.currentChargeFee)
            : '',
        }
        setAmountDisplayValues(newAmountDisplayValues)

        // 设置申报服务选项
        if (Array.isArray(contractData.declarationService)) {
          setSelectedServices(contractData.declarationService.map((item: any) => item.value))
        }

        // 设置其他业务
        if (contractData.otherBusiness) {
          setOtherBusiness(contractData.otherBusiness)
        }

        // 客户自动完成组件会自动处理搜索状态

        console.log('✅ [代理记账合同] 编辑模式：API数据初始化完成')
      }
    } else {
      // 创建模式：使用传入的数据初始化创建模式状态
      if (contractData && Object.keys(contractData).length > 0) {
        console.log('🔄 [代理记账合同] 创建模式：初始化表单数据')
        setCreateModeFormData(prev => ({
          ...prev,
          signatory,
          contractType: '代理记账合同',
          // 确保签署方配置正确设置
          ...(config && {
            partyBAddress: config.address,
            partyBPhone: config.phone,
          }),
          ...contractData,
        }))
      }
    }
  }, [contractData, signatory, mode, config])

  // 自动获取委托日期
  useEffect(() => {
    // 只有在创建模式且已有公司名称或统一社会信用代码时才请求
    if (mode !== 'create') return
    if (!debouncedCompanyName && !debouncedCreditCode) return

    fetchAgencyDates()
  }, [debouncedCompanyName, debouncedCreditCode, mode, fetchAgencyDates])

  // 处理企业名称选择的自动填写
  const handleCompanyNameSelect = (enterprise: Enterprise) => {
    console.log('📋 选择客户:', enterprise)

    // 更新客户基本信息
    const customerData = {
      partyACompany: enterprise.companyName,
      partyAAddress: (enterprise as any).registeredAddress || '',
      partyAPhone: enterprise.actualResponsibles?.[0]?.phone || '',
      partyAContact: enterprise.actualResponsibles?.[0]?.name || '',
      partyALegalPerson: enterprise.legalRepresentativeName || '',
      partyACreditCode: enterprise.unifiedSocialCreditCode || '',
    }

    // 应用到表单
    if (mode === 'edit') {
      setEditModeFormData(prev => ({
        ...prev,
        ...customerData,
      }))
    } else {
      setCreateModeFormData(prev => ({
        ...prev,
        ...customerData,
      }))
    }

    // 尝试根据乙方地址自动填写邮政编码
    const partyBAddress =
      mode === 'edit'
        ? editModeFormData.partyBAddress || config?.address || ''
        : createModeFormData.partyBAddress || config?.address || ''

    const postalCode = getPostalCodeFromAddress(partyBAddress)
    if (postalCode) {
      if (mode === 'edit') {
        setEditModeFormData(prev => ({
          ...prev,
          partyAPostalCode: postalCode,
          partyBPostalCode: postalCode,
        }))
      } else {
        setCreateModeFormData(prev => ({
          ...prev,
          partyAPostalCode: postalCode,
          partyBPostalCode: postalCode,
        }))
      }
      console.log(`💾 选择客户后，根据现有乙方地址自动填写邮政编码: ${postalCode}`)
    }

    console.log('💾 客户选择完成，更新表单数据:', customerData)
    showSuccess.enterpriseInfoFilled()

    // 获取委托日期
    fetchAgencyDates()
  }

  // 统一社会信用代码选择处理函数
  const handleCreditCodeSelect = (enterprise: Enterprise) => {
    console.log('📋 [信用代码选择] 选择企业:', enterprise)

    // 构建客户数据
    const customerData = {
      partyACompany: enterprise.companyName,
      partyACreditCode: enterprise.unifiedSocialCreditCode,
      partyAAddress: (enterprise as any).registeredAddress || '',
      partyAPhone: enterprise.actualResponsibles?.[0]?.phone || '',
      partyAContact: enterprise.actualResponsibles?.[0]?.name || '',
      partyALegalPerson: enterprise.legalRepresentativeName || '',
    }

    // 应用到表单
    if (mode === 'edit') {
      setEditModeFormData(prev => ({
        ...prev,
        ...customerData,
      }))
    } else {
      setCreateModeFormData(prev => ({
        ...prev,
        ...customerData,
      }))
    }

    // 尝试根据乙方地址自动填写邮政编码
    const partyBAddress =
      mode === 'edit'
        ? editModeFormData.partyBAddress || config?.address || ''
        : createModeFormData.partyBAddress || config?.address || ''

    const postalCode = getPostalCodeFromAddress(partyBAddress)
    if (postalCode) {
      if (mode === 'edit') {
        setEditModeFormData(prev => ({
          ...prev,
          partyAPostalCode: postalCode,
          partyBPostalCode: postalCode,
        }))
      } else {
        setCreateModeFormData(prev => ({
          ...prev,
          partyAPostalCode: postalCode,
          partyBPostalCode: postalCode,
        }))
      }
      console.log(`💾 选择客户后，根据现有乙方地址自动填写邮政编码: ${postalCode}`)
    }

    console.log('💾 [信用代码选择] 客户选择完成，更新表单数据:', customerData)
    showSuccess.enterpriseInfoFilled()

    // 获取委托日期
    fetchAgencyDates()
  }

  // 计算大写金额

  if (!config) {
    return <div className={styles.errorMessage}>不支持的签署方: {signatory}</div>
  }

  // 处理表单数据变化
  const handleFormChange = (field: string, value: any) => {
    // 如果是乙方地址字段变化，自动填写邮政编码
    if (field === 'partyBAddress' && value) {
      const postalCode = getPostalCodeFromAddress(value)
      if (postalCode) {
        // 延迟一点执行，让当前地址先更新完成
        setTimeout(() => {
          // 同时更新甲方和乙方的邮政编码（根据需求）
          if (mode === 'edit') {
            setEditModeFormData(prev => ({
              ...prev,
              partyAPostalCode: postalCode,
              partyBPostalCode: postalCode,
            }))
          } else {
            setCreateModeFormData(prev => ({
              ...prev,
              partyAPostalCode: postalCode,
              partyBPostalCode: postalCode,
            }))
          }
          console.log(`💾 根据乙方地址自动填写邮政编码: ${postalCode}`)
        }, 100)
      }
    }

    if (mode === 'edit') {
      // 编辑模式：使用本地状态
      setEditModeFormData(prev => ({ ...prev, [field]: value }))
      console.log(`💾 [编辑模式] ${field} 字段变化:`, value)
    } else {
      // 创建模式：使用创建模式状态
      setCreateModeFormData(prev => ({
        ...prev,
        [field]: value,
      }))
      console.log(`💾 [创建模式] ${field} 字段变化，触发自动保存:`, value)

      // 只在创建模式下触发自动保存事件
      setTimeout(() => {
        const event = new CustomEvent('contractFormFieldChange', {
          detail: { field, value, contractType: '代理记账合同' },
        })
        document.dispatchEvent(event)
      }, 50)
    }
  }

  // 处理金额输入变化
  const handleFormAmountChange = (field: string, value: string) => {
    // 更新显示的金额字符串
    setAmountDisplayValues(prev => ({
      ...prev,
      [field]: formatAmount(value),
    }))

    // 解析为数字并更新表单数据
    const numValue = parseAmount(value)
    handleFormChange(field, numValue)
  }

  // 处理金额输入框失焦事件
  const handleFormAmountBlur = (field: string, value: string) => {
    // 当用户完成输入，确保格式化为两位小数
    const numValue = parseAmount(value)
    const formattedValue = numValue === 0 ? '' : numValue.toFixed(2)

    setAmountDisplayValues(prev => ({
      ...prev,
      [field]: formattedValue,
    }))
  }

  // 处理申报服务选择变化
  const handleServiceChange = (checkedValues: string[]) => {
    setSelectedServices(checkedValues)

    // 构建declarationService数据结构，只保存选中的服务
    const declarationService = checkedValues.map(value => {
      const option = DECLARATION_SERVICE_OPTIONS.find(opt => opt.value === value)
      return {
        value,
        label: option ? option.label : '',
      }
    })

    handleFormChange('declarationService', declarationService)
  }

  // 处理其他业务变化
  const handleOtherBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setOtherBusiness(value)
    handleFormChange('otherBusiness', value)
  }

  // 表单验证
  const validateForm = (): boolean => {
    console.log('🔍 [代理记账合同] 表单验证开始:', {
      'formData.partyACompany': formData.partyACompany,
      'formData.partyACreditCode': formData.partyACreditCode,
    })

    // 甲方基本信息必填验证（使用表单数据状态）
    if (!formData.partyACompany || !formData.partyACompany.trim()) {
      console.error('❌ [代理记账合同] 甲方名称验证失败:', {
        formData: formData.partyACompany,
      })
      message.error('请填写甲方名称')
      return false
    }

    if (!formData.partyACreditCode || !formData.partyACreditCode.trim()) {
      console.error('❌ [代理记账合同] 统一社会信用代码验证失败:', {
        formData: formData.partyACreditCode,
      })
      message.error('请填写统一社会信用代码')
      return false
    }

    if (!formData.location || !formData.location.trim()) {
      console.error('❌ [代理记账合同] 企业归属地验证失败:', {
        formData: formData.location,
      })
      message.error('请选择企业归属地')
      return false
    }

    if (!formData.partyAAddress || !formData.partyAAddress.trim()) {
      console.error('❌ [代理记账合同] 甲方地址验证失败:', {
        formData: formData.partyAAddress,
        addressValue: formData.partyAAddress,
      })
      message.error('请填写甲方地址')
      return false
    }

    if (!formData.partyAPhone || !formData.partyAPhone.trim()) {
      message.error('请填写甲方电话')
      return false
    }

    if (!formData.partyAContact || !formData.partyAContact.trim()) {
      message.error('请填写甲方联系人')
      return false
    }

    if (!formData.partyALegalPerson || !formData.partyALegalPerson.trim()) {
      message.error('请填写甲方法定代表人')
      return false
    }

    if (!formData.partyAPostalCode || !formData.partyAPostalCode.trim()) {
      message.error('请填写甲方邮编')
      return false
    }

    if (!formData.partyASignDate) {
      message.error('请选择甲方签约日期')
      return false
    }

    // 乙方基本信息必填验证（考虑默认值）
    const partyBAddress = formData.partyBAddress || config.address
    if (!partyBAddress || !partyBAddress.trim()) {
      console.error('❌ [代理记账合同] 乙方地址验证失败:', {
        formData: formData.partyBAddress,
        configAddress: config.address,
        finalValue: partyBAddress,
      })
      message.error('请填写乙方地址')
      return false
    }

    const partyBPhone = formData.partyBPhone || config.phone
    if (!partyBPhone || !partyBPhone.trim()) {
      console.error('❌ [代理记账合同] 乙方电话验证失败:', {
        formData: formData.partyBPhone,
        configPhone: config.phone,
        finalValue: partyBPhone,
      })
      message.error('请填写乙方电话')
      return false
    }

    if (!formData.partyBContact || !formData.partyBContact.trim()) {
      message.error('请填写乙方联系人')
      return false
    }

    // 乙方法定代表人有默认值 '刘菲'
    const partyBLegalPerson = formData.partyBLegalPerson || '刘菲'
    if (!partyBLegalPerson || !partyBLegalPerson.trim()) {
      console.error('❌ [代理记账合同] 乙方法定代表人验证失败:', {
        formData: formData.partyBLegalPerson,
        defaultValue: '刘菲',
        finalValue: partyBLegalPerson,
      })
      message.error('请填写乙方法定代表人')
      return false
    }

    if (!formData.partyBPostalCode || !formData.partyBPostalCode.trim()) {
      message.error('请填写乙方邮编')
      return false
    }

    if (!formData.partyBSignDate) {
      message.error('请选择乙方签约日期')
      return false
    }

    // 委托期间验证
    if (!formData.entrustmentStartDate || !formData.entrustmentEndDate) {
      message.error('请选择委托开始和结束日期')
      return false
    }

    // 费用相关验证
    if (!formData.totalAgencyAccountingFee) {
      message.error('请填写代理记账总费用')
      return false
    }

    // 验证通过
    console.log('🔄 [代理记账合同] 验证通过')

    // 同步乙方默认值到表单数据
    if (!formData.partyBAddress && config.address) {
      console.log('🔄 [代理记账合同] 同步乙方地址默认值:', config.address)
      handleFormChange('partyBAddress', config.address)
    }

    if (!formData.partyBPhone && config.phone) {
      console.log('🔄 [代理记账合同] 同步乙方电话默认值:', config.phone)
      handleFormChange('partyBPhone', config.phone)
    }

    if (!formData.partyBLegalPerson) {
      console.log('🔄 [代理记账合同] 同步乙方法定代表人默认值: 刘菲')
      handleFormChange('partyBLegalPerson', '刘菲')
    }

    console.log('✅ [代理记账合同] 表单验证通过，数据同步完成')
    return true
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) {
      throw new Error('表单验证失败')
    }

    try {
      // 定义不允许更新的字段
      const excludeFields = [
        'id',
        'contractNumber',
        'contractSignature',
        'createTime',
        'updateTime',
        'submitter',
      ]

      // 过滤掉不允许更新的字段
      const filteredFormData = Object.keys(formData).reduce(
        (acc, key) => {
          if (!excludeFields.includes(key)) {
            acc[key] = formData[key]
          }
          return acc
        },
        {} as Record<string, any>
      )

      // 处理委托日期格式：将年月格式转换为年月日格式（日期默认为1号）
      const processedFormData = { ...filteredFormData }
      if (
        processedFormData.entrustmentStartDate &&
        processedFormData.entrustmentStartDate.length === 7
      ) {
        // 如果是年月格式 (YYYY-MM)，转换为年月日格式 (YYYY-MM-01)
        processedFormData.entrustmentStartDate = `${processedFormData.entrustmentStartDate}-01`
      }
      if (
        processedFormData.entrustmentEndDate &&
        processedFormData.entrustmentEndDate.length === 7
      ) {
        // 如果是年月格式 (YYYY-MM)，转换为年月日格式 (YYYY-MM-01)
        processedFormData.entrustmentEndDate = `${processedFormData.entrustmentEndDate}-01`
      }

      // 构建最终提交的合同数据
      const contractSubmitData: CreateContractDto = {
        ...processedFormData,
        contractType: '代理记账合同',
        signatory,
        remarks: formData.remarks,
        // 确保乙方信息正确保存
        partyBCompany: config?.title || '',
        partyBAddress: formData.partyBAddress || config?.address || '',
        partyBCreditCode: config?.creditCode || '',
        partyBLegalPerson: formData.partyBLegalPerson || '刘菲',
      }

      if (mode === 'create' && onSubmit) {
        await onSubmit(contractSubmitData)
      } else if (mode === 'edit' && onUpdate) {
        await onUpdate(contractSubmitData)
      } else {
        await createContractData(contractSubmitData)
      }

      // 成功消息由 useContract 统一处理，避免重复显示
      if (mode === 'edit') {
        message.success('合同更新成功')
      }
    } catch (error) {
      console.error('提交合同失败:', error)
      message.error(`合同${mode === 'create' ? '创建' : '更新'}失败，请重试`)
      throw error // 重新抛出错误，让父组件知道提交失败
    }
  }

  // 获取当前表单数据
  const getFormData = () => {
    // 明确返回所有重要字段，确保缓存完整性
    const data = {
      // 基础合同信息
      signatory: formData.signatory || signatory,
      contractType: formData.contractType || '代理记账合同',

      // 甲方信息
      partyACompany: formData.partyACompany || '',
      partyACreditCode: formData.partyACreditCode || '',
      partyAAddress: formData.partyAAddress || '',
      partyAPhone: formData.partyAPhone || '',
      partyAContact: formData.partyAContact || '',
      partyAPostalCode: formData.partyAPostalCode || '', // 甲方邮编字段（修正名称）
      partyALegalPerson: formData.partyALegalPerson || '', // 甲方法定代表人
      location: formData.location || '', // 企业归属地

      // 乙方信息（包含默认值）
      partyBAddress: formData.partyBAddress || config.address || '',
      partyBPhone: formData.partyBPhone || config.phone || '',
      partyBContact: formData.partyBContact || '',
      partyBPostalCode: formData.partyBPostalCode || '', // 乙方邮编字段
      partyBLegalPerson: formData.partyBLegalPerson || '刘菲', // 乙方法定代表人（默认值）

      // 委托期间
      entrustmentStartDate: formData.entrustmentStartDate || '',
      entrustmentEndDate: formData.entrustmentEndDate || '',

      // 签约日期
      partyASignDate: formData.partyASignDate || null,
      partyBSignDate: formData.partyBSignDate || null,

      // 费用信息
      totalAgencyAccountingFee: formData.totalAgencyAccountingFee || 0,
      agencyAccountingFee: formData.agencyAccountingFee || 0,
      accountingSoftwareFee: formData.accountingSoftwareFee || 0,
      invoicingSoftwareFee: formData.invoicingSoftwareFee || 0,
      accountBookFee: formData.accountBookFee || 0,
      currentChargeFee: formData.currentChargeFee || 0,

      // 服务相关
      selectedServices,
      otherBusiness,
      declarationService: selectedServices.map(value => ({ value })),

      // 签名相关
      partyAStampImage: formData.partyAStampImage || '',

      // 其他重要字段
      amountDisplayValues,

      // 包含其他所有formData字段（确保不遗漏）
      ...formData,
    }

    console.log('📋 [代理记账合同] getFormData 返回数据:', {
      partyAAddress: data.partyAAddress,
      partyAPhone: data.partyAPhone,
      partyAPostalCode: data.partyAPostalCode,
      partyALegalPerson: data.partyALegalPerson,
      partyASignDate: data.partyASignDate,
      partyBSignDate: data.partyBSignDate,
      totalFields: Object.keys(data).length,
    })

    return data
  }

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    validateForm,
    handleSubmit,
    getFormData,
  }))

  return (
    <div className={styles.agencyAccountingAgreement}>
      <div className={styles.agreementHeader}>
        <h1 className={styles.agreementTitle}>代理记账业务委托合同</h1>
      </div>

      <div className={styles.agreementParties}>
        <div className={styles.partySection}>
          <div className={styles.partyLabel}>甲方：</div>
          <div className={styles.partyContent}>
            <CustomerAutoComplete
              searchType="companyName"
              placeholder="*请输入甲方公司名称进行搜索"
              value={formData.partyACompany || ''}
              onSelect={handleCompanyNameSelect}
              onChange={value => handleFormChange('partyACompany', value)}
              className={styles.companyInput}
            />
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>统一社会信用代码：</div>
          <div className={styles.partyContent}>
            <CustomerAutoComplete
              searchType="unifiedSocialCreditCode"
              placeholder="*请输入甲方统一社会信用代码进行搜索"
              value={formData.partyACreditCode || ''}
              onSelect={handleCreditCodeSelect}
              onChange={value => handleFormChange('partyACreditCode', value)}
              className={styles.creditCodeInput}
            />
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>企业归属地：</div>
          <div className={styles.partyContent}>
            <Select
              placeholder="*请选择企业归属地"
              value={formData.location || undefined}
              onChange={value => handleFormChange('location', value)}
              className={styles.locationSelect}
              allowClear
              showSearch={false}
              notFoundContent={null}
            >
              {LOCATION_OPTIONS.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>地址：</div>
          <div className={styles.partyContent}>
            <Input
              placeholder="*请填写甲方地址"
              value={formData.partyAAddress || ''}
              onChange={e => handleFormChange('partyAAddress', e.target.value)}
              className={styles.addressInput}
            />
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>电话：</div>
          <div className={styles.partyContent}>
            <Input
              placeholder="*请填写甲方电话"
              value={formData.partyAPhone || ''}
              onChange={e => handleFormChange('partyAPhone', e.target.value)}
              className={styles.phoneInput}
            />
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>联系人：</div>
          <div className={styles.partyContent}>
            <Input
              placeholder="*请填写甲方联系人"
              value={formData.partyAContact || ''}
              onChange={e => handleFormChange('partyAContact', e.target.value)}
              className={styles.contactInput}
            />
          </div>
        </div>

        <div className={styles.partySection}>
          <div className={styles.partyLabel}>乙方：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyBName}>{config.title}</div>
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>统一社会信用代码：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyBCreditCode}>{config.creditCode}</div>
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>地址：</div>
          <div className={styles.partyContent}>
            <Input
              placeholder="*请填写乙方地址"
              value={formData.partyBAddress || config.address}
              onChange={e => handleFormChange('partyBAddress', e.target.value)}
              className={styles.addressInput}
            />
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>电话：</div>
          <div className={styles.partyContent}>
            <Input
              placeholder="*请填写乙方电话"
              value={formData.partyBPhone || config.phone}
              onChange={e => handleFormChange('partyBPhone', e.target.value)}
              className={styles.phoneInput}
            />
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>业务人：</div>
          <div className={styles.partyContent}>
            <Input
              placeholder="*请填写乙方业务人"
              value={formData.partyBContact || ''}
              onChange={e => handleFormChange('partyBContact', e.target.value)}
              className={styles.businessPersonInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.agreementPreamble}>
        甲方因经营管理需要委托乙方代理发票开据、记账纳税申报。为了维护双方
        合法权益根据《中华人民共和国民法典》及《代理记账管理办法》等法律、法规
        的规定经双方代表友好协商，达成以下协议：
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>一、委托业务范围</div>
        <div className={styles.sectionContent}>
          <div className={styles.entrustmentPeriod}>
            <div className={styles.entrustmentText}>
              乙方接受甲方委托，对甲方
              <DatePicker
                placeholder="开始日期"
                value={formData.entrustmentStartDate ? dayjs(formData.entrustmentStartDate) : null}
                onChange={date =>
                  handleFormChange('entrustmentStartDate', date ? date.format('YYYY-MM') : null)
                }
                className={styles.datePicker}
                picker="month"
                format="YYYY-MM"
              />
              日至
              <DatePicker
                placeholder="结束日期"
                value={formData.entrustmentEndDate ? dayjs(formData.entrustmentEndDate) : null}
                onChange={date =>
                  handleFormChange('entrustmentEndDate', date ? date.format('YYYY-MM') : null)
                }
                className={styles.datePicker}
                picker="month"
                format="YYYY-MM"
              />
              日期间内的经济业务进行代理记账。
            </div>
          </div>

          <div className={styles.taxServices}>
            <div>(同时为甲方提供代理纳税申报服务，包括：</div>
            <div className={styles.serviceCheckboxes}>
              {DECLARATION_SERVICE_OPTIONS.map(option => {
                const isChecked = selectedServices.includes(option.value)

                return (
                  <div key={option.value} className={styles.serviceCheckboxItem}>
                    <Checkbox
                      value={option.value}
                      checked={isChecked}
                      onChange={e => {
                        const { value, checked } = e.target
                        let newServices: string[]
                        if (checked) {
                          newServices = [...selectedServices, value]
                        } else {
                          newServices = selectedServices.filter(service => service !== value)
                        }
                        handleServiceChange(newServices)
                      }}
                    >
                      {option.label}
                    </Checkbox>
                  </div>
                )
              })}
            </div>
            <div className={styles.otherBusiness}>
              <div className={styles.otherBusinessLabel}>其他业务：</div>
              <Input
                placeholder="请填写其他业务"
                value={otherBusiness}
                onChange={handleOtherBusinessChange}
                className={styles.otherBusinessInput}
              />
            </div>
            {/* 备注行 */}
            <div className={styles.otherBusiness}>
              <div className={styles.otherBusinessLabel} style={{ fontWeight: 'bold' }}>
                备注：
              </div>
              <Input
                placeholder="请填写备注"
                value={formData.remarks || ''}
                onChange={e => handleFormChange('remarks', e.target.value)}
                className={styles.otherBusinessInput}
                style={{ fontWeight: 'bold' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>二、甲方的责任和义务</div>
        <div className={styles.sectionContent + ' ' + styles.partyAObligations}>
          <p>(一)甲方的每项经济业务，必须填制或者取得符合国家统一会计制度规定的原始凭证。</p>
          <p>
            (二)甲方应归集和整理有关经济业务的原始凭证和其他资料，并于每月 15
            日前提供给乙方。甲方对所提供资料的完整性、真实性、合法性负责，不得虚报、瞒报收入和支出。
          </p>
          <p>(三)甲方应建立健全与本企业相适应的内部控制制度，保证资产的安全和完整。</p>
          <p>(四)甲方应当配备专人负责日常货币资金的收支和保管。</p>
          <p>
            (五)涉及存货核算的，甲方负责存货的管理与盘点，应建立存货的管理制度，定期清查盘点存货，编制存货的入库凭证、出库凭证、库存明细账及每月各类存货的收发存明细表，并及时
            提供给乙方。甲方对上述资料的真实性和完整性负责，并保证库 存物资的安全和完整。
          </p>
          <p>
            (六)甲方应在法律允许的范围内开展经济业务，遵守会计法、
            税法等法律法规的规定，不得授意和指使乙方违法办理会计事项。
          </p>
          <p>
            (七)对于乙方退回的、要求甲方按照国家统一的会计制度
            规定进行更正、补充的原始凭证，甲方应当及时予以更正、补充。
          </p>
          <p>(八)甲方应积极配合乙方开展代理记账业务，对乙方提出的合理建议应积极采纳</p>
          <p>
            (九)甲方应制定合理的会计资料传递程序，及时将原始凭证等会计资料交乙方，做好会计资料的签收工作。
          </p>
          <p>
            (十)会计年度终了后，乙方将会计档案移交甲方，由甲方负责保管会计档案，保证会计档案的安全和完整。
          </p>
          <p>(十一)甲方委托乙方开具销售发票的，应符合税收相关法律法规，不得要求乙方虚开发票。</p>
          <p>(十二)甲方应按本协议书规定及时足额支付代理记账服务费。</p>
          <p>(十三)甲方应保证在规定的纳税期，银行账户有足额的存款缴纳税费款。</p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>三、乙方的责任和义务</div>
        <div className={styles.sectionContent + ' ' + styles.partyBObligations}>
          <p>
            (一)乙方根据甲方所提供的原始凭证和其他资料，按照国家统一会计制度的规定进行会计核算，包括审核原始凭证、填制记账凭证、登记会计账簿、按时编制和提供财务会计报告。
          </p>
          <p>
            (二)乙方应严格按照税收相关法律法规，在规定的申报期内为甲方及时、准确地办理纳税申报业务。
          </p>
          <p>
            (三)涉及存货核算的，根据甲方提供的存货入库凭证、出库凭证、每月各类存货的收发存明细表，乙方进行成本结转。
          </p>
          <p>(四)乙方应协助甲方完善内部控制，加强内部管理，针对内部控制薄弱环节提出合理的建议。</p>
          <p>
            (五)乙方应协助甲方制定合理的会计资料传递程序，积极配合甲方做好会计资料的签收手续。在代理记账过程中，应妥善
            保管会计资料。
          </p>
          <p>
            (六)乙方应按时将当年应归档的会计资料整理、装订后形成会计档案，于会计年度终了后交甲方保管。未办理交接手续前，由乙方负责保管。
          </p>
          <p>(七)委托协议终止时，乙方应与甲方办理会计业务交接事宜。</p>
          <p>
            (八)乙方接受委托为甲方开具销售发票的，应按照税收法律法规要求为甲方提供代开发票服务，不得代为虚开发票。
          </p>
          <p>(九)乙方对开展业务过程中知悉的商业秘密、个人信息负有保密义务。</p>
          <p>(十)对甲方提出的有关会计处理的相关问题，乙方应当予以正确解释。</p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>四、责任划分</div>
        <div className={styles.sectionContent + ' ' + styles.responsibilityDivision}>
          <p>
            (一)乙方是在甲方提供相关资料的基础上进行会计核算，因甲方提供的记账依据不实、未按协议约定及时提供记账依据或其他过错导致委托事项出现差错或未能按时完成委托事项，由此造成的后果，由甲方承担。
          </p>
          <p>
            (二)因乙方的过错导致委托事项出现差错或未能按时完成委托事项，由此造成的后果，由乙方承担。
          </p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>五、协议的终止</div>
        <div className={styles.sectionContent + ' ' + styles.agreementTermination}>
          <p>(一)协议期满，本协议自然终止，双方如欲续约，须另定协议。</p>
          <p>(二)经双方协商一致后，可提前终止协议。</p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>六、代理记账服务费</div>
        <div className={styles.sectionContent + ' ' + styles.agencyFeeContent}>
          <p>
            经协商，乙方代理记账收费标准为：人民币每年
            <Input
              placeholder="代理记账总费用"
              value={amountDisplayValues.totalAgencyAccountingFee}
              onChange={e => handleFormAmountChange('totalAgencyAccountingFee', e.target.value)}
              onBlur={e => handleFormAmountBlur('totalAgencyAccountingFee', e.target.value)}
              className={styles.inlineFeeInput}
            />
            元（代理记账费
            <Input
              placeholder="代理记账费"
              value={amountDisplayValues.agencyAccountingFee}
              onChange={e => handleFormAmountChange('agencyAccountingFee', e.target.value)}
              onBlur={e => handleFormAmountBlur('agencyAccountingFee', e.target.value)}
              className={styles.inlineFeeInput}
            />
            /年，记账软件服务费
            <Input
              placeholder="记账软件费"
              value={amountDisplayValues.accountingSoftwareFee}
              onChange={e => handleFormAmountChange('accountingSoftwareFee', e.target.value)}
              onBlur={e => handleFormAmountBlur('accountingSoftwareFee', e.target.value)}
              className={styles.inlineFeeInput}
            />
            /年，开票软件服务费
            <Input
              placeholder="开票软件费"
              value={amountDisplayValues.invoicingSoftwareFee}
              onChange={e => handleFormAmountChange('invoicingSoftwareFee', e.target.value)}
              onBlur={e => handleFormAmountBlur('invoicingSoftwareFee', e.target.value)}
              className={styles.inlineFeeInput}
            />
            /年），甲方按年度提前30日支付，不足一个月的按一个月计算。如甲方业务量增加，乙方根据甲方业务增量调整增加代理费用。
          </p>

          <p>
            全年凭证、账簿费用为
            <Input
              placeholder="账簿费"
              value={amountDisplayValues.accountBookFee}
              onChange={e => handleFormAmountChange('accountBookFee', e.target.value)}
              onBlur={e => handleFormAmountBlur('accountBookFee', e.target.value)}
              className={styles.inlineFeeInput}
            />
            元。其中包括凭证、账簿、差旅费报销单、费用粘贴单、工资表、财务报表、纳税申报表等。（以上费用以实际到账执行）
          </p>

          <p>
            人民币本次收费总金额
            <Input
              placeholder="本次收费金额"
              value={amountDisplayValues.currentChargeFee}
              onChange={e => handleFormAmountChange('currentChargeFee', e.target.value)}
              onBlur={e => handleFormAmountBlur('currentChargeFee', e.target.value)}
              className={styles.inlineFeeInput}
            />
            元。
          </p>

          <p>于合同生效日起 3 日内一次付清。</p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>七、违约责任</div>
        <div className={styles.sectionContent + ' ' + styles.breachResponsibility}>
          <p>
            (一)甲方未能履行其责任，未向乙方提供真实、合法、准确、完整的原始凭证，导致税收方面的责任由甲方承担；
          </p>
          <p>
            (二)由于甲方未能及时提供代理记账所需的核算资料，致使乙方不能按时履行合同的，乙方不承担任何责任；
          </p>
          <p>
            (三)由于乙方原因，未能按时完成会计核算或会计核算不真实，造成一定后果的，乙方必须及时纠正并承担相应的责任；
          </p>
          <p>
            (四)关于会计账务出现的问题，办理交接手续以前的由甲方负责，办理交接手续以后的由乙方负责；
          </p>
          <p>
            (五)如甲方中途终止合同（转走或注销），未到期服务费用乙方不予退还，并且代理期间赠送业务按照正常收费标准收费。
          </p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>八、其他约定</div>
        <div className={styles.sectionContent + ' ' + styles.otherAgreements}>
          <p>
            (一)本协议的补充条款、附件及补充协议均为本协议不可分割的部分。本协议补充条款、补充协议与本协议不一致的，以补充条款、补充协议为准。
          </p>
          <p>
            (二)本协议的未尽事宜及本协议在履行过程中需变更的事宜，双方应通过订立变更协议进行约定。
          </p>
          <p>
            (三)甲乙双方在履行本协议过程中发生争议，应协商解决。协商不能解决的，向仲裁委员会申请仲裁/依法向人民法院起诉。
          </p>
          <p>本协议自双方签字之日起生效。本协议一式两份，双方各执一份。</p>
        </div>
      </div>

      <div className={styles.agreementSignatures}>
        <div className={styles.signatureContainer}>
          {/* 签名标题行 */}
          <div className={styles.signatureTitleRow}>
            <div className={styles.signatureTitleColumn}>
              <div className={styles.signatureTitle}>委托方：{formData.partyACompany || ''}</div>
            </div>
            <div className={styles.signatureTitleColumn}>
              <div className={styles.signatureTitle}>受托方：{config.title}</div>
            </div>
          </div>

          {/* 盖章空间行 */}
          <div className={styles.signatureStampRow}>
            <div className={styles.signatureStampColumn}>
              <div className={styles.signatureStampSpace}>
                {/* 甲方签字区域 */}
                {formData.partyAStampImage ? (
                  <div className={styles.stampPreview}>
                    <img
                      src={formData.partyAStampImage}
                      alt="甲方签字"
                      className={styles.stampImage}
                      style={{
                        maxWidth: '150px',
                        maxHeight: '80px',
                        display: 'block',
                        margin: '10px 0',
                      }}
                    />
                    <p className={styles.signedNote}>签名图片已通过"签署合同"功能自动生成</p>
                  </div>
                ) : (
                  <div className={styles.stampPlaceholder}>
                    <p>请通过"签署合同"功能生成甲方签字</p>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.signatureStampColumn}>
              <div className={styles.signatureStampSpace}>
                {/* 乙方盖章区域 */}
                {getPartyBStampImage(signatory) && (
                  <img
                    src={getPartyBStampImage(signatory)}
                    alt="乙方盖章"
                    className={styles.partyBSign}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 法定代表人信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>法定代表人：</div>
                <Input
                  placeholder="*请输入法定代表人"
                  value={formData.partyALegalPerson || ''}
                  onChange={e => handleFormChange('partyALegalPerson', e.target.value)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>法定代表人：</div>
                <Input
                  placeholder="*请输入法定代表人"
                  value={formData.partyBLegalPerson || '刘菲'}
                  onChange={e => handleFormChange('partyBLegalPerson', e.target.value)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* 联系人信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>联系人：</div>
                <Input
                  placeholder="*请输入联系人"
                  value={formData.partyAContact || ''}
                  onChange={e => handleFormChange('partyAContact', e.target.value)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>联系人：</div>
                <Input
                  placeholder="*请输入联系人"
                  value={formData.partyBContact || ''}
                  onChange={e => handleFormChange('partyBContact', e.target.value)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* 地址信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>地址：</div>
                <Input
                  placeholder="*请输入地址"
                  value={formData.partyAAddress || ''}
                  onChange={e => handleFormChange('partyAAddress', e.target.value)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>地址：</div>
                <Input
                  placeholder="*请输入地址"
                  value={formData.partyBAddress || config.address}
                  onChange={e => handleFormChange('partyBAddress', e.target.value)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* 邮编信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>邮编：</div>
                <Input
                  placeholder="*请输入邮编"
                  value={formData.partyAPostalCode || ''}
                  onChange={e => handleFormChange('partyAPostalCode', e.target.value)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>邮编：</div>
                <Input
                  placeholder="*请输入邮编"
                  value={formData.partyBPostalCode || ''}
                  onChange={e => handleFormChange('partyBPostalCode', e.target.value)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* 电话信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>电话：</div>
                <Input
                  placeholder="*请输入电话"
                  value={formData.partyAPhone || ''}
                  onChange={e => handleFormChange('partyAPhone', e.target.value)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>电话：</div>
                <Input
                  placeholder="*请输入电话"
                  value={formData.partyBPhone || config.phone}
                  onChange={e => handleFormChange('partyBPhone', e.target.value)}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* 签约日期信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>签约日期：</div>
                <DatePicker
                  placeholder="*请选择日期"
                  format="YYYY年MM月DD日"
                  value={(() => {
                    if (!formData.partyASignDate) {
                      console.log('🗓️ [代理记账] 甲方签署日期为空:', formData.partyASignDate)
                      return undefined
                    }
                    try {
                      const dayjsValue = dayjs(formData.partyASignDate)
                      console.log(
                        '🗓️ [代理记账] 甲方签署日期解析:',
                        formData.partyASignDate,
                        '->',
                        dayjsValue.format('YYYY-MM-DD')
                      )
                      return dayjsValue.isValid() ? dayjsValue : undefined
                    } catch (error) {
                      console.error(
                        '🗓️ [代理记账] 甲方签署日期解析失败:',
                        formData.partyASignDate,
                        error
                      )
                      return undefined
                    }
                  })()}
                  onChange={date => {
                    const formatted = date?.format('YYYY-MM-DD')
                    console.log('🗓️ [代理记账] 甲方签署日期更改:', date, '->', formatted)
                    handleFormChange('partyASignDate', formatted)
                  }}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>签约日期：</div>
                <DatePicker
                  placeholder="*请选择日期"
                  format="YYYY年MM月DD日"
                  value={(() => {
                    if (!formData.partyBSignDate) {
                      console.log('🗓️ [代理记账] 乙方签署日期为空:', formData.partyBSignDate)
                      return undefined
                    }
                    try {
                      const dayjsValue = dayjs(formData.partyBSignDate)
                      console.log(
                        '🗓️ [代理记账] 乙方签署日期解析:',
                        formData.partyBSignDate,
                        '->',
                        dayjsValue.format('YYYY-MM-DD')
                      )
                      return dayjsValue.isValid() ? dayjsValue : undefined
                    } catch (error) {
                      console.error(
                        '🗓️ [代理记账] 乙方签署日期解析失败:',
                        formData.partyBSignDate,
                        error
                      )
                      return undefined
                    }
                  })()}
                  onChange={date => {
                    const formatted = date?.format('YYYY-MM-DD')
                    console.log('🗓️ [代理记账] 乙方签署日期更改:', date, '->', formatted)
                    handleFormChange('partyBSignDate', formatted)
                  }}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default AgencyAccountingAgreement
