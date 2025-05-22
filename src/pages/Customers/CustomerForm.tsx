import React, { useEffect, useState, useCallback } from 'react'
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  Tabs,
  Space,
  message,
  Switch,
  Checkbox,
  Table,
  Upload,
  Popconfirm,
} from 'antd'
import type { Customer, ImageType, PaidInCapitalItem, AdministrativeLicenseItem, ActualResponsibleItem } from '../../types'
import dayjs, { Dayjs } from 'dayjs'
import type { TabsProps } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import ImageUpload from '../../components/ImageUpload'
import MultiImageUpload from '../../components/MultiImageUpload'
import { safeGetFieldValue, safeSetFieldValue } from '../../utils/formUtils'
import { deleteFile } from '../../utils/upload'
import { useCustomerDetail } from '../../hooks/useCustomer'
import useSWR from 'swr'
import { mutate } from 'swr'
import { useBranchOffices } from '../../hooks/useDepartments'
import { BUSINESS_STATUS_MAP, ENTERPRISE_STATUS_MAP } from '../../constants'

// 字段名到标签页的映射
const FIELD_TO_TAB_MAP: Record<string, string> = {
  // 基本信息标签页字段
  companyName: 'basic',
  unifiedSocialCreditCode: 'basic',
  taxNumber: 'basic',
  enterpriseType: 'basic',
  taxBureau: 'basic',
  consultantAccountant: 'basic',
  bookkeepingAccountant: 'basic',
  invoiceOfficer: 'basic',
  enterpriseStatus: 'basic',
  businessStatus: 'basic',
  registeredAddress: 'basic',
  location: 'basic',
  businessAddress: 'basic',
  bossProfile: 'basic',
  enterpriseProfile: 'basic',
  affiliatedEnterprises: 'basic',
  industryCategory: 'basic',
  industrySubcategory: 'basic',
  hasTaxBenefits: 'basic',
  businessPublicationPassword: 'basic',
  licenseExpiryDate: 'basic',
  registeredCapital: 'basic',
  capitalContributionDeadline: 'basic',
  submitter: 'basic',
  remarks: 'basic',

  // 实缴资本标签页字段
  paidInCapital: 'paid-capital',
  
  // 行政许可标签页字段
  administrativeLicense: 'administrative-license',
  
  // 实际负责人标签页字段
  actualResponsibles: 'actual-responsibles',

  // 银行信息标签页字段
  publicBank: 'bank',
  bankAccountNumber: 'bank',
  publicBankOpeningDate: 'bank',
  onlineBankingArchiveNumber: 'bank',
  tripartiteAgreementAccount: 'bank',

  // 税务信息标签页字段
  taxReportLoginMethod: 'tax',
  taxCategories: 'tax',
  socialInsuranceTypes: 'tax',
  insuredPersonnel: 'tax',
  personalIncomeTaxPassword: 'tax',
  personalIncomeTaxStaff: 'tax',
  enterpriseInfoSheetNumber: 'tax',
  sealStorageNumber: 'tax',
  invoicingSoftware: 'tax',
  invoicingNotes: 'tax',

  // 人员信息标签页字段
  legalRepresentativeName: 'personnel',
  legalRepresentativePhone: 'personnel',
  legalRepresentativePhone2: 'personnel',
  legalRepresentativeId: 'personnel',
  legalRepresentativeTaxPassword: 'personnel',
  financialContactName: 'personnel',
  financialContactPhone: 'personnel',
  financialContactId: 'personnel',
  financialContactTaxPassword: 'personnel',
  taxOfficerName: 'personnel',
  taxOfficerPhone: 'personnel',
  taxOfficerId: 'personnel',
  taxOfficerTaxPassword: 'personnel',
  invoiceOfficerName: 'personnel',
  invoiceOfficerTaxPassword: 'personnel',

  // 图片资料标签页字段
  legalPersonIdImages: 'images',
  businessLicenseImages: 'images',
  bankAccountLicenseImages: 'images',
  otherIdImages: 'images',
  supplementaryImages: 'images',
}

interface CustomerFormProps {
  customer?: Customer | null
  mode: 'add' | 'edit' | 'view'
  onSuccess?: (isAutoSave: boolean, id?: number) => void
  onCancel?: () => void
}

// 为表单值创建类型，允许日期字段为Dayjs类型
type FormCustomer = Omit<
  Customer,
  | 'licenseExpiryDate'
  | 'capitalContributionDeadline'
  | 'publicBankOpeningDate'
  | 'generalAccountOpeningDate'
> & {
  licenseExpiryDate?: Dayjs | null
  capitalContributionDeadline?: Dayjs | null
  publicBankOpeningDate?: Dayjs | null
  generalAccountOpeningDate?: Dayjs | null
  licenseNoFixedTerm?: boolean
  [key: string]: any // 添加索引签名
}

// API提交时的客户数据类型
type APICustomer = Omit<
  FormCustomer,
  | 'licenseExpiryDate'
  | 'capitalContributionDeadline'
  | 'publicBankOpeningDate'
  | 'generalAccountOpeningDate'
> & {
  licenseExpiryDate?: string
  capitalContributionDeadline?: string
  publicBankOpeningDate?: string
  generalAccountOpeningDate?: string
}

// 处理日期转换: Dayjs => string
const convertDatesToString = (values: FormCustomer): Partial<FormCustomer> => {
  const result = { ...values }

  console.log('转换日期前的值:', {
    licenseExpiryDate: values.licenseExpiryDate,
    capitalContributionDeadline: values.capitalContributionDeadline,
    publicBankOpeningDate: values.publicBankOpeningDate,
    generalAccountOpeningDate: values.generalAccountOpeningDate,
  })

  // 只有当值存在且是Dayjs对象时才进行转换
  if (
    values.licenseExpiryDate &&
    dayjs.isDayjs(values.licenseExpiryDate) &&
    values.licenseExpiryDate.isValid()
  ) {
    // @ts-ignore: 类型转换，应该是从Dayjs转为string
    result.licenseExpiryDate = values.licenseExpiryDate.format('YYYY-MM-DD')
  } else if (values.licenseExpiryDate === null) {
    // 如果licenseExpiryDate被明确设置为null，保持为null
    result.licenseExpiryDate = null
  } else {
    // 如果不是有效的日期，设为null而不是undefined
    result.licenseExpiryDate = null
  }

  if (
    values.capitalContributionDeadline &&
    dayjs.isDayjs(values.capitalContributionDeadline) &&
    values.capitalContributionDeadline.isValid()
  ) {
    // @ts-ignore: 类型转换，应该是从Dayjs转为string
    result.capitalContributionDeadline = values.capitalContributionDeadline.format('YYYY-MM-DD')
  } else {
    result.capitalContributionDeadline = null
  }

  if (
    values.publicBankOpeningDate &&
    dayjs.isDayjs(values.publicBankOpeningDate) &&
    values.publicBankOpeningDate.isValid()
  ) {
    // @ts-ignore: 类型转换，应该是从Dayjs转为string
    result.publicBankOpeningDate = values.publicBankOpeningDate.format('YYYY-MM-DD')
  } else {
    result.publicBankOpeningDate = null
  }

  if (
    values.generalAccountOpeningDate &&
    dayjs.isDayjs(values.generalAccountOpeningDate) &&
    values.generalAccountOpeningDate.isValid()
  ) {
    // @ts-ignore: 类型转换，应该是从Dayjs转为string
    result.generalAccountOpeningDate = values.generalAccountOpeningDate.format('YYYY-MM-DD')
  } else {
    result.generalAccountOpeningDate = null
  }

  console.log('转换日期后的值:', {
    licenseExpiryDate: result.licenseExpiryDate,
    capitalContributionDeadline: result.capitalContributionDeadline,
    publicBankOpeningDate: result.publicBankOpeningDate,
    generalAccountOpeningDate: result.generalAccountOpeningDate,
  })

  return result
}

// 提取图片URL
const convertImageFieldsToUrls = (values: Partial<FormCustomer>): Partial<FormCustomer> => {
  const result = { ...values }

  // 处理单个图片字段
  const processImageField = (fieldKey: string) => {
    const field = values[fieldKey]
    
    // 防止未定义字段导致的问题
    if (!field) {
      // 字段不存在时，保留为空对象而不是undefined
      result[fieldKey] = {}
      return
    }
    
    if (typeof field === 'object') {
      const processedField: Record<string, ImageType> = {}

      // 遍历对象的每个key-value对
      Object.entries(field).forEach(([key, value]) => {
        // 检查value是否为有效的ImageType对象
        if (value && typeof value === 'object' && ('url' in value || 'fileName' in value)) {
          processedField[key] = value as ImageType
        } else if (value && typeof value === 'string') {
          // 处理可能出现的字符串URL情况
          processedField[key] = { url: value } as ImageType
        }
      })

      // 如果处理后的字段有内容，或者原字段本来就没内容
      if (Object.keys(processedField).length > 0 || Object.keys(field).length === 0) {
        result[fieldKey] = processedField
      } else {
        // 保留原始值，防止数据丢失
        result[fieldKey] = field
      }
    } else {
      // 如果字段不是预期的对象格式，保留原值
      result[fieldKey] = field
    }
  }

  // 处理所有图片字段 - 确保每个字段都被处理
  processImageField('legalPersonIdImages')
  processImageField('businessLicenseImages')
  processImageField('bankAccountLicenseImages')
  processImageField('otherIdImages')
  processImageField('supplementaryImages')

  // 确保paidInCapital中的图片也被正确处理
  if (result.paidInCapital && Array.isArray(result.paidInCapital)) {
    result.paidInCapital = result.paidInCapital.map(item => {
      if (item.images && typeof item.images === 'object') {
        const processedImages: Record<string, ImageType> = {}
        
        Object.entries(item.images).forEach(([key, value]) => {
          if (value && typeof value === 'object' && ('url' in value || 'fileName' in value)) {
            processedImages[key] = value as ImageType
          } else if (value && typeof value === 'string') {
            processedImages[key] = { url: value } as ImageType
          }
        })
        
        return { ...item, images: processedImages }
      }
      return item
    })
  }
  
  // 确保administrativeLicense中的图片也被正确处理
  if (result.administrativeLicense && Array.isArray(result.administrativeLicense)) {
    result.administrativeLicense = result.administrativeLicense.map(item => {
      if (item.images && typeof item.images === 'object') {
        const processedImages: Record<string, ImageType> = {}
        
        Object.entries(item.images).forEach(([key, value]) => {
          if (value && typeof value === 'object' && ('url' in value || 'fileName' in value)) {
            processedImages[key] = value as ImageType
          } else if (value && typeof value === 'string') {
            processedImages[key] = { url: value } as ImageType
          }
        })
        
        return { ...item, images: processedImages }
      }
      return item
    })
  }

  return result
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, mode, onSuccess, onCancel }) => {
  const [form] = Form.useForm<FormCustomer>()
  const [activeTab, setActiveTab] = useState<string>('basic')
  const [isSaving, setIsSaving] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]) // 跟踪已上传的图片文件名
  const [paidInCapitalItems, setPaidInCapitalItems] = useState<PaidInCapitalItem[]>([])
  const [administrativeLicenseItems, setAdministrativeLicenseItems] = useState<AdministrativeLicenseItem[]>([])
  const [actualResponsibleItems, setActualResponsibleItems] = useState<ActualResponsibleItem[]>([])
  const customerId = customer?.id ?? 0
  const { createCustomer, updateCustomer } = useCustomerDetail(customerId)
  const { branchOffices, isLoading: isLoadingBranchOffices } = useBranchOffices()

  // 使用Form.useWatch监听licenseNoFixedTerm字段的值变化
  const licenseNoFixedTerm = Form.useWatch('licenseNoFixedTerm', form)
  // 使用Form.useWatch监听licenseExpiryDate字段的值变化
  const licenseExpiryDate = Form.useWatch('licenseExpiryDate', form)

  // 标记是否已经修复了表单项的状态
  const [fixState, setFixState] = useState(false)

  // 记录重试次数
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  // 重试逻辑
  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries && customer?.id) {
      setRetryCount(prev => prev + 1)
      // 触发SWR重新验证，清除缓存并重新获取
      mutate(`/customer/${customer.id}`, undefined, { revalidate: true })
    }
  }, [customer?.id, retryCount, maxRetries])

  useEffect(() => {
    if (customer && mode !== 'add') {
      // Convert string dates to Dayjs objects
      const formValues: Partial<FormCustomer> = {
        ...customer,
        licenseExpiryDate: customer.licenseExpiryDate ? dayjs(customer.licenseExpiryDate) : null,
        capitalContributionDeadline: customer.capitalContributionDeadline
          ? dayjs(customer.capitalContributionDeadline)
          : null,
        publicBankOpeningDate: customer.publicBankOpeningDate
          ? dayjs(customer.publicBankOpeningDate)
          : null,
        generalAccountOpeningDate: customer.generalAccountOpeningDate
          ? dayjs(customer.generalAccountOpeningDate)
          : null,
        // 使用 9999-12-31 作为无固定期限的标志
        licenseNoFixedTerm: customer.licenseExpiryDate === '9999-12-31',
      }
      form.setFieldsValue(formValues)
      
      // 初始化实缴资本数据
      if (customer.paidInCapital && Array.isArray(customer.paidInCapital)) {
        setPaidInCapitalItems(customer.paidInCapital.map(item => {
          // 处理日期字段
          let contributionDate = null;
          
          // 处理出资日期
          if (item.contributionDate) {
            try {
              const dayjsDate = dayjs(item.contributionDate);
              if (dayjsDate.isValid()) {
                contributionDate = dayjsDate.format('YYYY-MM-DD');
              }
            } catch (e) {
              console.warn('初始化实缴资本日期出错:', e);
            }
          }
          
          return {
            ...item,
            contributionDate,
            // 确保images是对象
            images: typeof item.images === 'object' ? item.images : {}
          };
        }));
      } else {
        setPaidInCapitalItems([]);
      }
      
      // 初始化行政许可数据
      if (customer.administrativeLicense && Array.isArray(customer.administrativeLicense)) {
        setAdministrativeLicenseItems(customer.administrativeLicense.map(item => {
          // 处理日期字段
          let startDate = null;
          let expiryDate = null;
          
          // 处理开始日期
          if (item.startDate) {
            try {
              const dayjsStartDate = dayjs(item.startDate);
              if (dayjsStartDate.isValid()) {
                startDate = dayjsStartDate.format('YYYY-MM-DD');
              }
            } catch (e) {
              console.warn('初始化行政许可开始日期出错:', e);
            }
          }
          
          // 处理到期日期
          if (item.expiryDate) {
            try {
              const dayjsExpiryDate = dayjs(item.expiryDate);
              if (dayjsExpiryDate.isValid()) {
                expiryDate = dayjsExpiryDate.format('YYYY-MM-DD');
              }
            } catch (e) {
              console.warn('初始化行政许可到期日期出错:', e);
            }
          }
          
          return {
            ...item,
            startDate,
            expiryDate,
            // 确保images是对象
            images: typeof item.images === 'object' ? item.images : {}
          };
        }));
      } else {
        setAdministrativeLicenseItems([]);
      }
      
      // 初始化实际负责人数据
      if (customer.actualResponsibles && Array.isArray(customer.actualResponsibles)) {
        setActualResponsibleItems(customer.actualResponsibles);
      } else {
        // 如果没有actualResponsibles数组，但有旧字段，尝试向下兼容
        // 使用类型断言处理可能不存在的字段
        const oldCustomer = customer as any;
        if (oldCustomer && (oldCustomer.actualResponsibleName || oldCustomer.actualResponsiblePhone)) {
          setActualResponsibleItems([{
            name: oldCustomer.actualResponsibleName || '',
            phone: oldCustomer.actualResponsiblePhone || ''
          }]);
        } else {
          setActualResponsibleItems([]);
        }
      }
      
      // 标记状态已修复
      setFixState(true)
    }
  }, [customer, form, mode])

  // 监听licenseNoFixedTerm变化，当用户选择无固定期限时自动清空日期
  useEffect(() => {
    if (!fixState) return

    if (licenseNoFixedTerm) {
      // 如果选择了无固定期限，清空日期显示（实际保存时会设置为9999-12-31）
      form.setFieldValue('licenseExpiryDate', null)
    }
  }, [licenseNoFixedTerm, form, fixState])

  const handleSubmit = async (values: FormCustomer, isAutoSave = false) => {
    if (!customer && mode !== 'add') {
      message.error('客户信息不存在')
      return
    }

    try {
      // 不在这里调用 validateFields，让表单自己处理验证
      // Form 组件的 onFinish 只会在验证通过后才会被调用
      setIsSaving(true)

      // 打印提交的值，以便调试
      console.log('提交的表单值:', values)

      // 处理营业执照到期日期
      if (values.licenseNoFixedTerm) {
        // 如果选择了无固定期限，设置为特定日期 9999-12-31
        values.licenseExpiryDate = dayjs('9999-12-31')
      } else if (!values.licenseExpiryDate) {
        // 如果未选择无固定期限但日期为空，则设置为 null
        values.licenseExpiryDate = null
      }

      // 如果是编辑模式，确保保留已有的图片数据
      if (mode === 'edit' && customer) {
        // 确保图片字段存在且是正确的对象格式
        // 检查并保留已有图片字段
        if (!values.legalPersonIdImages || typeof values.legalPersonIdImages !== 'object') {
          values.legalPersonIdImages = customer.legalPersonIdImages || {};
        }
        if (!values.businessLicenseImages || typeof values.businessLicenseImages !== 'object') {
          values.businessLicenseImages = customer.businessLicenseImages || {};
        }
        if (!values.bankAccountLicenseImages || typeof values.bankAccountLicenseImages !== 'object') {
          values.bankAccountLicenseImages = customer.bankAccountLicenseImages || {};
        }
        if (!values.otherIdImages || typeof values.otherIdImages !== 'object') {
          values.otherIdImages = customer.otherIdImages || {};
        }
        if (!values.supplementaryImages || typeof values.supplementaryImages !== 'object') {
          values.supplementaryImages = customer.supplementaryImages || {};
        }
      }

      // 处理日期字段转换为字符串
      const valuesWithDatesConverted = convertDatesToString(values)

      // 处理图片字段
      const dataWithImages = convertImageFieldsToUrls(valuesWithDatesConverted)

      // 确保所有必需的图片字段都存在且为对象类型
      if (!dataWithImages.legalPersonIdImages || typeof dataWithImages.legalPersonIdImages !== 'object') {
        dataWithImages.legalPersonIdImages = customer?.legalPersonIdImages || {};
      }
      
      if (!dataWithImages.businessLicenseImages || typeof dataWithImages.businessLicenseImages !== 'object') {
        dataWithImages.businessLicenseImages = customer?.businessLicenseImages || {};
      }
      
      if (!dataWithImages.bankAccountLicenseImages || typeof dataWithImages.bankAccountLicenseImages !== 'object') {
        dataWithImages.bankAccountLicenseImages = customer?.bankAccountLicenseImages || {};
      }

      if (!dataWithImages.otherIdImages || typeof dataWithImages.otherIdImages !== 'object') {
        dataWithImages.otherIdImages = customer?.otherIdImages || {};
      }

      if (!dataWithImages.supplementaryImages || typeof dataWithImages.supplementaryImages !== 'object') {
        dataWithImages.supplementaryImages = customer?.supplementaryImages || {};
      }

      // 添加实缴资本数据 - 确保保留已有的图片
      const updatedPaidInCapitalItems = paidInCapitalItems.map(item => {
        // 确保每个item的images属性存在且是对象
        if (!item.images || typeof item.images !== 'object') {
          return { ...item, images: {} };
        }
        return item;
      });
      dataWithImages.paidInCapital = updatedPaidInCapitalItems;

      // 添加行政许可数据 - 确保保留已有的图片
      const updatedAdministrativeLicenseItems = administrativeLicenseItems.map(item => {
        // 确保每个item的images属性存在且是对象
        if (!item.images || typeof item.images !== 'object') {
          return { ...item, images: {} };
        }
        return item;
      });
      dataWithImages.administrativeLicense = updatedAdministrativeLicenseItems;

      // 添加实际负责人数据
      dataWithImages.actualResponsibles = actualResponsibleItems;

      // 移除可能引起错误的字段
      const { createTime, updateTime, licenseNoFixedTerm, actualResponsibleName, actualResponsiblePhone, ...cleanData } = dataWithImages;

      if (mode === 'add') {
        const newCustomer = await createCustomer(cleanData as Partial<Customer>)
        if (!isAutoSave) {
          // 创建成功后，直接调用 onSuccess 回调
          onSuccess?.(isAutoSave, newCustomer?.id)

          // 创建成功后，清空 uploadedImages 数组但不删除已上传的图片
          setUploadedImages([])

          // 创建成功后直接调用 onCancel 回调，不经过 handleCancel 函数，这样不会触发图片清理
          onCancel?.()
        } else {
          // 自动保存模式只调用 onSuccess
          onSuccess?.(isAutoSave, newCustomer?.id)
        }
      } else if (customer?.id) {
        console.log('发送到API的数据:', cleanData)

        // 确保日期字段是正确的格式
        if (cleanData.licenseExpiryDate && typeof cleanData.licenseExpiryDate !== 'string') {
          // @ts-ignore
          cleanData.licenseExpiryDate = dayjs(cleanData.licenseExpiryDate).format('YYYY-MM-DD')
        }

        await updateCustomer(customer.id, cleanData as Partial<Customer>)
        if (!isAutoSave) {
          message.success('保存成功')
        }
        onSuccess?.(isAutoSave, customer.id)

        if (!isAutoSave) {
          handleCancel(false)
        }
      }
    } catch (error: any) {
      console.error('Form submission error:', error)
      message.error('提交失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 添加单独的处理函数来处理表单验证错误
  const handleFormValidationError = (errorInfo: any) => {
    console.error('Form validation error:', errorInfo)

    if (errorInfo?.errorFields && errorInfo.errorFields.length > 0) {
      // 获取第一个错误字段
      const firstErrorField = errorInfo.errorFields[0]

      // 获取字段名
      const fieldName = firstErrorField.name[0]

      // 获取字段所在的标签页
      const tabKey = FIELD_TO_TAB_MAP[fieldName] || 'basic'

      // 切换到对应标签页
      setActiveTab(tabKey)

      // 使用setTimeout确保标签页切换后再滚动到对应字段
      setTimeout(() => {
        // 聚焦到错误字段
        form.scrollToField(firstErrorField.name, {
          behavior: 'smooth',
          block: 'center',
        })
      }, 100)

      message.error('请检查表单填写是否正确')
    }
  }

  const handleAutoSave = async () => {
    if (!autoSaveEnabled || isSaving || mode === 'view') {
      return
    }

    // 添加客户模式下不执行自动保存，只更新表单数据
    if (mode === 'add') {
      return
    }

    // 设置状态防止重复保存
    setIsSaving(true)

    try {
      // 验证表单必填项，如果有错误则不自动保存
      const fields = ['companyName', 'enterpriseStatus', 'businessStatus']

      const values = form.getFieldsValue()
      let hasError = false

      // 检查必填字段
      for (const field of fields) {
        if (!values[field]) {
          hasError = true
          break
        }
      }

      if (hasError) {
        setIsSaving(false)
        return
      }

      // 提交表单，捕获验证错误
      try {
        // 使用 validateFields 验证指定字段而不是全部字段，避免阻止自动保存
        await form.validateFields(['companyName', 'enterpriseStatus', 'businessStatus'])

        // 获取表单值
        const formValues = form.getFieldsValue()
        
        // 如果是编辑模式，确保保留已有的图片数据
        if (customer) {
          // 检查并保留已有图片字段
          if (!formValues.legalPersonIdImages || typeof formValues.legalPersonIdImages !== 'object') {
            formValues.legalPersonIdImages = customer.legalPersonIdImages || {};
          }
          if (!formValues.businessLicenseImages || typeof formValues.businessLicenseImages !== 'object') {
            formValues.businessLicenseImages = customer.businessLicenseImages || {};
          }
          if (!formValues.bankAccountLicenseImages || typeof formValues.bankAccountLicenseImages !== 'object') {
            formValues.bankAccountLicenseImages = customer.bankAccountLicenseImages || {};
          }
          if (!formValues.otherIdImages || typeof formValues.otherIdImages !== 'object') {
            formValues.otherIdImages = customer.otherIdImages || {};
          }
          if (!formValues.supplementaryImages || typeof formValues.supplementaryImages !== 'object') {
            formValues.supplementaryImages = customer.supplementaryImages || {};
          }
        }
        
        // 手动保留图片相关的状态数据
        // 实缴资本和行政许可使用状态中的数据，这样能确保图片数据不丢失
        const updatedPaidInCapitalItems = paidInCapitalItems.map(item => {
          // 确保每个item的images属性存在且是对象
          if (!item.images || typeof item.images !== 'object') {
            return { ...item, images: {} };
          }
          return item;
        });
        formValues.paidInCapital = updatedPaidInCapitalItems;
        
        // 同样处理行政许可数据
        const updatedAdministrativeLicenseItems = administrativeLicenseItems.map(item => {
          // 确保每个item的images属性存在且是对象
          if (!item.images || typeof item.images !== 'object') {
            return { ...item, images: {} };
          }
          return item;
        });
        formValues.administrativeLicense = updatedAdministrativeLicenseItems;
        
        // 保留实际负责人数据
        formValues.actualResponsibles = actualResponsibleItems;
        
        console.log('自动保存前的formValues:', formValues);
        
        // 调用 handleSubmit 并传递 isAutoSave=true
        await handleSubmit(formValues, true)
        console.log('自动保存成功')
      } catch (validationError: any) {
        // 处理验证错误但不显示消息，避免干扰用户
        console.error('自动保存验证错误:', validationError)
      }
    } catch (error: any) {
      console.error('自动保存出错:', error)
      // 不显示错误消息，避免干扰用户
    } finally {
      setIsSaving(false)
    }
  }

  // 处理图片上传成功 - 修正类型问题
  const handleImageUploadSuccess = (isAutoSave: boolean) => {
    if (mode === 'add') {
      // 获取表单中的所有图片字段，提取文件名
      const formValues = form.getFieldsValue()
      const {
        legalPersonIdImages,
        businessLicenseImages,
        bankAccountLicenseImages,
        otherIdImages,
        supplementaryImages,
      } = formValues

      // 收集图片文件名到uploadedImages中
      const collectFileName = (obj: any) => {
        if (!obj) return
        Object.values(obj).forEach(item => {
          if (item && typeof item === 'object' && 'fileName' in item) {
            setUploadedImages(prev => [...prev, item.fileName as string])
          }
        })
      }

      // 处理主要图片字段
      collectFileName(legalPersonIdImages)
      collectFileName(businessLicenseImages)
      collectFileName(bankAccountLicenseImages)
      collectFileName(otherIdImages)
      collectFileName(supplementaryImages)

      // 处理行政许可图片
      if (administrativeLicenseItems && administrativeLicenseItems.length > 0) {
        administrativeLicenseItems.forEach(item => {
          if (item.images && typeof item.images === 'object') {
            collectFileName(item.images);
          }
        });
      }

      // 处理实缴资本图片
      if (paidInCapitalItems && paidInCapitalItems.length > 0) {
        paidInCapitalItems.forEach(item => {
          if (item.images && typeof item.images === 'object') {
            collectFileName(item.images);
          }
        });
      }
    } else if (autoSaveEnabled) {
      // 编辑模式下，调用自动保存
      handleAutoSave()
    }
  }

  // 处理表单取消
  const handleCancel = async (afterSuccessfulCreate = false) => {
    if (mode === 'add' && uploadedImages.length > 0 && !afterSuccessfulCreate) {
      // 在添加模式下且不是创建成功后的调用，删除所有已上传的图片
      message.loading('正在清理已上传的图片...', 0)
      let deletedCount = 0

      try {
        for (const fileName of uploadedImages) {
          try {
            await deleteFile(fileName)
            deletedCount++
          } catch (error) {
            console.error(`删除图片文件 ${fileName} 失败:`, error)
          }
        }
      } finally {
        message.destroy() // 关闭loading消息
        if (deletedCount > 0) {
          message.success(`已清理 ${deletedCount} 张图片`)
        }
        // 无论删除是否成功，都调用取消回调
        onCancel?.()
      }
    } else {
      // 非添加模式或没有上传图片，直接调用取消回调
      onCancel?.()
    }
  }

  // 添加实缴资本项
  const handleAddPaidInCapitalItem = () => {
    setPaidInCapitalItems([
      ...paidInCapitalItems, 
      { name: '', contributionDate: dayjs().format('YYYY-MM-DD'), amount: 0, images: {} }
    ]);
  };

  // 删除实缴资本项
  const handleDeletePaidInCapitalItem = (index: number) => {
    const newItems = [...paidInCapitalItems];
    newItems.splice(index, 1);
    setPaidInCapitalItems(newItems);
  };

  // 更新实缴资本项
  const handleUpdatePaidInCapitalItem = (index: number, field: keyof PaidInCapitalItem, value: any) => {
    const newItems = [...paidInCapitalItems];
    
    // 处理日期字段
    if (field === 'contributionDate') {
      // 确保日期字段为空时存储为 null 而不是空字符串
      newItems[index] = { 
        ...newItems[index], 
        [field]: value || null 
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setPaidInCapitalItems(newItems);
  };

  // 处理文件上传
  const handleFileUpload = (info: any, index: number) => {
    if (info.file.status === 'done') {
      // 假设上传成功后文件名或URL在response里
      const fileName = info.file.response.fileName || info.file.name;
      const fileUrl = info.file.response.url || '';
      const newItems = [...paidInCapitalItems];
      // 更新为对象格式存储，使用一个随机键名
      const randomKey = `img_${Date.now()}`;
      newItems[index].images = { 
        ...newItems[index].images, 
        [randomKey]: { fileName, url: fileUrl } 
      };
      setPaidInCapitalItems(newItems);
    }
  };

  // 添加行政许可项
  const handleAddAdministrativeLicenseItem = () => {
    setAdministrativeLicenseItems([
      ...administrativeLicenseItems, 
      { 
        licenseType: '', 
        startDate: dayjs().format('YYYY-MM-DD'), 
        expiryDate: dayjs().format('YYYY-MM-DD'), 
        images: {} 
      }
    ]);
  };

  // 删除行政许可项
  const handleDeleteAdministrativeLicenseItem = (index: number) => {
    const newItems = [...administrativeLicenseItems];
    newItems.splice(index, 1);
    setAdministrativeLicenseItems(newItems);
  };

  // 更新行政许可项
  const handleUpdateAdministrativeLicenseItem = (index: number, field: keyof AdministrativeLicenseItem, value: any) => {
    const newItems = [...administrativeLicenseItems];
    
    // Type assertion to ensure proper types for date fields
    if (field === 'startDate' || field === 'expiryDate') {
      // 确保日期字段为空时存储为 null 而不是空字符串
      newItems[index] = { 
        ...newItems[index], 
        [field]: value || null 
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setAdministrativeLicenseItems(newItems);
  };

  // 添加实际负责人项
  const handleAddActualResponsibleItem = () => {
    setActualResponsibleItems([
      ...actualResponsibleItems, 
      { name: '', phone: '' }
    ]);
  };

  // 删除实际负责人项
  const handleDeleteActualResponsibleItem = (index: number) => {
    const newItems = [...actualResponsibleItems];
    newItems.splice(index, 1);
    setActualResponsibleItems(newItems);
  };

  // 更新实际负责人项
  const handleUpdateActualResponsibleItem = (index: number, field: keyof ActualResponsibleItem, value: string) => {
    const newItems = [...actualResponsibleItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setActualResponsibleItems(newItems);
  };

  const tabs: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          <Form.Item name="companyName" label="企业名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item 
            name="unifiedSocialCreditCode" 
            label="统一社会信用代码" 
            rules={[{ required: mode === 'add', message: '请输入统一社会信用代码' }]}
          >
            <Input disabled={mode === 'edit' || mode === 'view'} />
          </Form.Item>

          <Form.Item name="taxNumber" label="税号">
            <Input />
          </Form.Item>

          <Form.Item name="enterpriseType" label="企业类型">
            <Select>
              <Select.Option value="小规模（公司）">小规模（公司）</Select.Option>
              <Select.Option value="小规模（个体）">小规模（个体）</Select.Option>
              <Select.Option value="一般纳税人">一般纳税人</Select.Option>
              <Select.Option value="小规模（个人独资）">小规模（个人独资）</Select.Option>
              <Select.Option value="合作社">合作社</Select.Option>
              <Select.Option value="民办非企业单位">民办非企业单位</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="taxBureau" label="所属分局">
            <Input />
          </Form.Item>

          <Form.Item
            name="location"
            label="归属地"
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

          <Form.Item name="consultantAccountant" label="顾问会计">
            <Input />
          </Form.Item>

          <Form.Item name="bookkeepingAccountant" label="记账会计">
            <Input />
          </Form.Item>

          <Form.Item name="invoiceOfficer" label="开票员">
            <Input />
          </Form.Item>

          <Form.Item name="enterpriseStatus" label="工商状态">
            <Select>
              {Object.entries(ENTERPRISE_STATUS_MAP).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  {String(label)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="businessStatus" label="业务状态">
            <Select>
              {Object.entries(BUSINESS_STATUS_MAP).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  {String(label)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="registeredAddress" label="注册地址" className="col-span-1 md:col-span-2">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="businessAddress" label="经营地址" className="col-span-1 md:col-span-2">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="bossProfile" label="老板画像" className="col-span-1 md:col-span-2">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="enterpriseProfile" label="企业画像" className="col-span-1 md:col-span-2">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="affiliatedEnterprises"
            label="同宗企业"
            className="col-span-1 md:col-span-2"
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="industryCategory" label="行业大类">
            <Input />
          </Form.Item>

          <Form.Item name="industrySubcategory" label="行业细分">
            <Input />
          </Form.Item>

          <Form.Item name="hasTaxBenefits" label="是否有税收优惠" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="businessPublicationPassword" label="工商公示密码">
            <Input />
          </Form.Item>

          <Form.Item label="营业执照到期日期">
            <div className="space-y-2">
              <Form.Item name="licenseExpiryDate" noStyle>
                <DatePicker
                  className="w-full"
                  allowClear
                  format="YYYY-MM-DD"
                  value={form.getFieldValue('licenseExpiryDate')}
                  onChange={date => {
                    // 手动设置字段值，确保正确更新
                    form.setFieldValue('licenseExpiryDate', date)

                    // 如果选择了日期，自动取消"无固定期限"选择
                    if (date) {
                      form.setFieldValue('licenseNoFixedTerm', false)
                    }
                  }}
                  disabled={!!licenseNoFixedTerm}
                />
              </Form.Item>
              <Form.Item name="licenseNoFixedTerm" valuePropName="checked" noStyle>
                <Checkbox
                  onChange={e => {
                    const checked = e.target.checked

                    // 如果勾选了"无固定期限"，则清空日期字段
                    if (checked) {
                      form.setFieldValue('licenseExpiryDate', null)
                    }

                    // 确保checkbox状态正确更新
                    form.setFieldValue('licenseNoFixedTerm', checked)
                  }}
                >
                  无固定期限
                </Checkbox>
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item name="registeredCapital" label="注册资本">
            <InputNumber className="w-full" addonAfter="万元" />
          </Form.Item>

          <Form.Item name="capitalContributionDeadline" label="认缴到期日期">
            <DatePicker
              className="w-full"
              allowClear
              format="YYYY-MM-DD"
              onChange={date => {
                form.setFieldValue('capitalContributionDeadline', date)
              }}
            />
          </Form.Item>

          <Form.Item name="submitter" label="提交人">
            <Input />
          </Form.Item>

          <Form.Item name="remarks" label="备注信息" className="col-span-1 md:col-span-2">
            <Input.TextArea rows={3} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'paid-capital',
      label: '实缴资本',
      children: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">实缴资本</h3>
            <div className="flex items-center">
              <span className="mr-2 text-lg font-bold">
                {paidInCapitalItems.reduce((sum, item) => sum + (item.amount || 0), 0)}万
              </span>
              {mode !== 'view' && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleAddPaidInCapitalItem}
                >
                  新增
                </Button>
              )}
            </div>
          </div>
          
          <Table 
            dataSource={paidInCapitalItems.map((item, index) => ({ ...item, key: index }))}
            pagination={false}
            size="middle"
            className="mb-4"
            columns={[
              {
                title: '姓名',
                dataIndex: 'name',
                key: 'name',
                render: (text, record, index) => (
                  mode === 'view' ? text : (
                    <Input 
                      value={text} 
                      onChange={e => handleUpdatePaidInCapitalItem(index, 'name', e.target.value)} 
                    />
                  )
                )
              },
              {
                title: '出资日期',
                dataIndex: 'contributionDate',
                key: 'contributionDate',
                render: (text, record, index) => {
                  if (mode === 'view') {
                    // 查看模式下，直接显示日期文本或默认值
                    return text || '-';
                  }
                  
                  // 处理日期值，确保有效日期才会被转换为dayjs对象
                  let dayjsValue = null;
                  if (text) {
                    try {
                      dayjsValue = dayjs(text);
                      // 检查转换后的dayjs对象是否有效
                      if (!dayjsValue.isValid()) {
                        dayjsValue = null;
                      }
                    } catch (e) {
                      console.warn('无效的日期格式:', text);
                      dayjsValue = null;
                    }
                  }
                  
                  return (
                    <DatePicker 
                      value={dayjsValue} 
                      onChange={date => {
                        // 当日期为空时，设置为null
                        const dateValue = date ? date.format('YYYY-MM-DD') : null;
                        handleUpdatePaidInCapitalItem(index, 'contributionDate', dateValue);
                      }} 
                      format="YYYY-MM-DD"
                      style={{ width: '100%' }}
                    />
                  );
                }
              },
              {
                title: '出资金额',
                dataIndex: 'amount',
                key: 'amount',
                render: (amount, record, index) => (
                  mode === 'view' ? `${amount}万` : (
                    <InputNumber 
                      value={amount} 
                      onChange={value => handleUpdatePaidInCapitalItem(index, 'amount', value || 0)}
                      addonAfter="万"
                      min={0}
                      className="w-full"
                    />
                  )
                )
              },
              {
                title: '附件',
                dataIndex: 'images',
                key: 'images',
                render: (images, record, index) => (
                  mode === 'view' ? (
                    images && Object.keys(images).length > 0 ? (
                      <div className="flex flex-wrap">
                        {Object.entries(images).map(([key, imageData], i) => {
                          // 确保 imageData 是正确的 ImageType 类型
                          const url = typeof imageData === 'object' && imageData && 'url' in imageData ? 
                            (imageData as ImageType).url : 
                            '#';
                          
                          return (
                            <a 
                              key={i} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mr-2 mb-2 text-blue-500 hover:underline"
                            >
                              {key}
                            </a>
                          );
                        })}
                      </div>
                    ) : '-'
                  ) : (
                    <MultiImageUpload 
                      disabled={false}
                      value={images || {}}
                      onChange={value => {
                        console.log('MultiImageUpload onChange 被调用, value:', value);
                        // 更新实缴资本项中的图片
                        handleUpdatePaidInCapitalItem(index, 'images', value);
                      }}
                      onSuccess={() => {
                        // 调用回调但不做其他操作，避免自动保存导致图片丢失
                        console.log('MultiImageUpload onSuccess 被调用');
                      }}
                    />
                  )
                )
              },
              ...(mode !== 'view' ? [
                {
                  title: '操作',
                  key: 'action',
                  render: (_: any, record: any, index: number) => (
                    <Popconfirm
                      title="确定删除此条记录吗?"
                      onConfirm={() => handleDeletePaidInCapitalItem(index)}
                      okText="是"
                      cancelText="否"
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  )
                }
              ] : [])
            ]}
          />
        </div>
      ),
    },
    {
      key: 'administrative-license',
      label: '行政许可',
      children: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">行政许可</h3>
            {mode !== 'view' && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddAdministrativeLicenseItem}
              >
                新增
              </Button>
            )}
          </div>
          
          <Table 
            dataSource={administrativeLicenseItems.map((item, index) => ({ ...item, key: index }))}
            pagination={false}
            size="middle"
            className="mb-4"
            columns={[
              {
                title: '行政许可类型',
                dataIndex: 'licenseType',
                key: 'licenseType',
                render: (text, record, index) => {
                  if (mode === 'view') return text;
                  return (
                    <Input 
                      value={text} 
                      onChange={(e) => handleUpdateAdministrativeLicenseItem(index, 'licenseType', e.target.value)}
                      placeholder="请输入行政许可类型"
                    />
                  );
                }
              },
              {
                title: '行政许可开始日期',
                dataIndex: 'startDate',
                key: 'startDate',
                render: (text, record, index) => {
                  if (mode === 'view') {
                    // 查看模式下，直接显示日期文本或默认值
                    return text || '-';
                  }
                  
                  // 处理日期值，确保有效日期才会被转换为dayjs对象
                  let dayjsValue = null;
                  if (text) {
                    try {
                      dayjsValue = dayjs(text);
                      // 检查转换后的dayjs对象是否有效
                      if (!dayjsValue.isValid()) {
                        dayjsValue = null;
                      }
                    } catch (e) {
                      console.warn('无效的日期格式:', text);
                      dayjsValue = null;
                    }
                  }
                  
                  return (
                    <DatePicker 
                      value={dayjsValue} 
                      onChange={(date) => {
                        // 当日期为空时，设置为null
                        const dateValue = date ? date.format('YYYY-MM-DD') : null;
                        handleUpdateAdministrativeLicenseItem(index, 'startDate', dateValue);
                      }} 
                      format="YYYY-MM-DD"
                      style={{ width: '100%' }}
                    />
                  );
                }
              },
              {
                title: '行政许可到期日期',
                dataIndex: 'expiryDate',
                key: 'expiryDate',
                render: (text, record, index) => {
                  if (mode === 'view') {
                    // 查看模式下，直接显示日期文本或默认值
                    return text || '-';
                  }
                  
                  // 处理日期值，确保有效日期才会被转换为dayjs对象
                  let dayjsValue = null;
                  if (text) {
                    try {
                      dayjsValue = dayjs(text);
                      // 检查转换后的dayjs对象是否有效
                      if (!dayjsValue.isValid()) {
                        dayjsValue = null;
                      }
                    } catch (e) {
                      console.warn('无效的日期格式:', text);
                      dayjsValue = null;
                    }
                  }
                  
                  return (
                    <DatePicker 
                      value={dayjsValue} 
                      onChange={(date) => {
                        // 当日期为空时，设置为null
                        const dateValue = date ? date.format('YYYY-MM-DD') : null;
                        handleUpdateAdministrativeLicenseItem(index, 'expiryDate', dateValue);
                      }} 
                      format="YYYY-MM-DD"
                      style={{ width: '100%' }}
                    />
                  );
                }
              },
              {
                title: '附件',
                dataIndex: 'images',
                key: 'images',
                render: (images, record, index) => (
                  mode === 'view' ? (
                    images && Object.keys(images).length > 0 ? (
                      <div className="flex flex-wrap">
                        {Object.entries(images).map(([key, imageData], i) => {
                          // 确保 imageData 是正确的 ImageType 类型
                          const url = typeof imageData === 'object' && imageData && 'url' in imageData ? 
                            (imageData as ImageType).url : 
                            '#';
                          
                          return (
                            <a 
                              key={i} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mr-2 mb-2 text-blue-500 hover:underline"
                            >
                              {key}
                            </a>
                          );
                        })}
                      </div>
                    ) : '-'
                  ) : (
                    <MultiImageUpload 
                      disabled={false}
                      value={images || {}}
                      onChange={value => {
                        console.log('行政许可 MultiImageUpload onChange 被调用, value:', value);
                        // 更新行政许可项中的图片
                        handleUpdateAdministrativeLicenseItem(index, 'images', value);
                      }}
                      onSuccess={() => {
                        // 调用回调但不做其他操作，避免自动保存导致图片丢失
                        console.log('行政许可 MultiImageUpload onSuccess 被调用');
                      }}
                    />
                  )
                )
              },
              {
                title: '操作',
                key: 'action',
                render: (text, record, index) => {
                  if (mode === 'view') return null;
                  return (
                    <Popconfirm
                      title="确定要删除此记录吗？"
                      onConfirm={() => handleDeleteAdministrativeLicenseItem(index)}
                      okText="是"
                      cancelText="否"
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  );
                }
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'actual-responsibles',
      label: '实际负责人',
      children: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">实际负责人</h3>
            {mode !== 'view' && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddActualResponsibleItem}
              >
                新增
              </Button>
            )}
          </div>
          
          <Table 
            dataSource={actualResponsibleItems.map((item, index) => ({ ...item, key: index }))}
            pagination={false}
            size="middle"
            className="mb-4"
            columns={[
              {
                title: '实际负责人姓名',
                dataIndex: 'name',
                key: 'name',
                render: (text, record, index) => {
                  if (mode === 'view') return text;
                  return (
                    <Input 
                      value={text} 
                      onChange={(e) => handleUpdateActualResponsibleItem(index, 'name', e.target.value)}
                      placeholder="请输入实际负责人姓名"
                    />
                  );
                }
              },
              {
                title: '实际负责人电话',
                dataIndex: 'phone',
                key: 'phone',
                render: (text, record, index) => {
                  if (mode === 'view') return text;
                  return (
                    <Input 
                      value={text} 
                      onChange={(e) => handleUpdateActualResponsibleItem(index, 'phone', e.target.value)}
                      placeholder="请输入实际负责人电话"
                    />
                  );
                }
              },
              {
                title: '操作',
                key: 'action',
                render: (text, record, index) => {
                  if (mode === 'view') return null;
                  return (
                    <Popconfirm
                      title="确定要删除此记录吗？"
                      onConfirm={() => handleDeleteActualResponsibleItem(index)}
                      okText="是"
                      cancelText="否"
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  );
                }
              },
            ]}
          />
          
          <div className="mt-6">
            <Form.Item 
              name="actualResponsibleRemark" 
              label="备注" 
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              {mode === 'view' ? (
                <div className="bg-gray-50 p-3 rounded border border-gray-200 min-h-[80px]">
                  {form.getFieldValue('actualResponsibleRemark') || '-'}
                </div>
              ) : (
                <Input.TextArea 
                  rows={4} 
                  placeholder="请输入实际负责人相关备注信息" 
                />
              )}
            </Form.Item>
          </div>
        </div>
      ),
    },
    {
      key: 'bank',
      label: '银行信息',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          <Form.Item name="publicBank" label="对公开户行">
            <Input />
          </Form.Item>

          <Form.Item name="bankAccountNumber" label="开户行账号">
            <Input />
          </Form.Item>

          <Form.Item name="publicBankOpeningDate" label="对公开户时间">
            <DatePicker
              className="w-full"
              allowClear
              format="YYYY-MM-DD"
              onChange={date => {
                form.setFieldValue('publicBankOpeningDate', date)
              }}
            />
          </Form.Item>

          <Form.Item name="onlineBankingArchiveNumber" label="网银托管档案号">
            <Input />
          </Form.Item>

          <Form.Item name="basicDepositAccountNumber" label="基本存款账户编号">
            <Input />
          </Form.Item>

          <Form.Item name="generalAccountBank" label="一般户开户行">
            <Input />
          </Form.Item>

          <Form.Item name="generalAccountNumber" label="一般户账号">
            <Input />
          </Form.Item>

          <Form.Item name="generalAccountOpeningDate" label="一般户开户时间">
            <DatePicker
              className="w-full"
              allowClear
              format="YYYY-MM-DD"
              onChange={date => {
                form.setFieldValue('generalAccountOpeningDate', date)
              }}
            />
          </Form.Item>

          <Form.Item name="tripartiteAgreementAccount" label="三方协议扣款账户">
            <Input />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'tax',
      label: '税务信息',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          <Form.Item name="taxReportLoginMethod" label="报税登录方式">
            <Input />
          </Form.Item>

          <Form.Item name="taxCategories" label="税种">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="socialInsuranceTypes" label="社保险种">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="insuredPersonnel" label="参保人员">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="personalIncomeTaxPassword" label="个税密码">
            <Input />
          </Form.Item>

          <Form.Item name="personalIncomeTaxStaff" label="个税申报人员">
            <Input />
          </Form.Item>

          <Form.Item name="enterpriseInfoSheetNumber" label="企业信息表编号">
            <Input />
          </Form.Item>

          <Form.Item name="sealStorageNumber" label="章存放编号">
            <Input />
          </Form.Item>

          <Form.Item name="invoicingSoftware" label="开票软件">
            <Input />
          </Form.Item>

          <Form.Item name="invoicingNotes" label="开票注意事项">
            <Input.TextArea rows={2} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'personnel',
      label: '人员信息',
      children: (
        <>
          <h3 className="mt-4 md:mt-6 mb-3 font-medium">法定代表人</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="legalRepresentativeName" label="姓名">
              <Input />
            </Form.Item>

            <Form.Item name="legalRepresentativePhone" label="联系电话">
              <Input />
            </Form.Item>

            <Form.Item name="legalRepresentativePhone2" label="联系电话2">
              <Input />
            </Form.Item>

            <Form.Item name="legalRepresentativeId" label="身份证号">
              <Input />
            </Form.Item>

            <Form.Item name="legalRepresentativeTaxPassword" label="电子税务局密码">
              <Input />
            </Form.Item>
          </div>

          <h3 className="mt-4 md:mt-6 mb-3 font-medium">财务负责人</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="financialContactName" label="姓名">
              <Input />
            </Form.Item>

            <Form.Item name="financialContactPhone" label="联系电话">
              <Input />
            </Form.Item>

            <Form.Item name="financialContactId" label="身份证号">
              <Input />
            </Form.Item>

            <Form.Item name="financialContactTaxPassword" label="电子税务局密码">
              <Input />
            </Form.Item>
          </div>

          <h3 className="mt-4 md:mt-6 mb-3 font-medium">办税员</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="taxOfficerName" label="姓名">
              <Input />
            </Form.Item>

            <Form.Item name="taxOfficerPhone" label="联系电话">
              <Input />
            </Form.Item>

            <Form.Item name="taxOfficerId" label="身份证号">
              <Input />
            </Form.Item>

            <Form.Item name="taxOfficerTaxPassword" label="电子税务局密码">
              <Input />
            </Form.Item>
          </div>

          <h3 className="mt-4 md:mt-6 mb-3 font-medium">开票员</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="invoiceOfficerName" label="姓名">
              <Input />
            </Form.Item>

            <Form.Item name="invoiceOfficerPhone" label="联系电话">
              <Input />
            </Form.Item>

            <Form.Item name="invoiceOfficerId" label="身份证号">
              <Input />
            </Form.Item>

            <Form.Item name="invoiceOfficerTaxPassword" label="电子税务局密码">
              <Input />
            </Form.Item>
          </div>
        </>
      ),
    },
    {
      key: 'images',
      label: '图片资料',
      children: (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">法人身份证照片</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item name={['legalPersonIdImages', 'front']} label="身份证正面">
                <ImageUpload
                  label="身份证正面"
                  disabled={mode === 'view'}
                  value={safeGetFieldValue(form, ['legalPersonIdImages', 'front'])}
                  onChange={value =>
                    safeSetFieldValue(form, ['legalPersonIdImages', 'front'], value)
                  }
                  onSuccess={handleImageUploadSuccess}
                />
              </Form.Item>
              <Form.Item name={['legalPersonIdImages', 'back']} label="身份证反面">
                <ImageUpload
                  label="身份证反面"
                  disabled={mode === 'view'}
                  value={safeGetFieldValue(form, ['legalPersonIdImages', 'back'])}
                  onChange={value =>
                    safeSetFieldValue(form, ['legalPersonIdImages', 'back'], value)
                  }
                  onSuccess={handleImageUploadSuccess}
                />
              </Form.Item>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">营业执照照片</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item name={['businessLicenseImages', 'main']} label="营业执照">
                <ImageUpload
                  label="营业执照"
                  disabled={mode === 'view'}
                  value={safeGetFieldValue(form, ['businessLicenseImages', 'main'])}
                  onChange={value =>
                    safeSetFieldValue(form, ['businessLicenseImages', 'main'], value)
                  }
                  onSuccess={handleImageUploadSuccess}
                />
              </Form.Item>
              <Form.Item name={['businessLicenseImages', 'copy']} label="营业执照副本">
                <ImageUpload
                  label="营业执照副本"
                  disabled={mode === 'view'}
                  value={safeGetFieldValue(form, ['businessLicenseImages', 'copy'])}
                  onChange={value =>
                    safeSetFieldValue(form, ['businessLicenseImages', 'copy'], value)
                  }
                  onSuccess={handleImageUploadSuccess}
                />
              </Form.Item>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">开户许可证照片</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item name={['bankAccountLicenseImages', 'basic']} label="基本户开户许可证">
                <ImageUpload
                  label="基本户开户许可证"
                  disabled={mode === 'view'}
                  value={safeGetFieldValue(form, ['bankAccountLicenseImages', 'basic'])}
                  onChange={value =>
                    safeSetFieldValue(form, ['bankAccountLicenseImages', 'basic'], value)
                  }
                  onSuccess={handleImageUploadSuccess}
                />
              </Form.Item>
              <Form.Item name={['bankAccountLicenseImages', 'general']} label="一般户开户许可证">
                <ImageUpload
                  label="一般户开户许可证"
                  disabled={mode === 'view'}
                  value={safeGetFieldValue(form, ['bankAccountLicenseImages', 'general'])}
                  onChange={value =>
                    safeSetFieldValue(form, ['bankAccountLicenseImages', 'general'], value)
                  }
                  onSuccess={handleImageUploadSuccess}
                />
              </Form.Item>
            </div>
          </div>

          <div>
            <Form.Item name="otherIdImages" label="其他人员身份证照片">
              <MultiImageUpload
                title="其他人员身份证照片"
                disabled={mode === 'view'}
                value={form.getFieldValue('otherIdImages')}
                onChange={value => form.setFieldValue('otherIdImages', value)}
                onSuccess={handleImageUploadSuccess}
              />
            </Form.Item>
          </div>

          <div>
            <Form.Item name="supplementaryImages" label="补充资料照片">
              <MultiImageUpload
                title="补充资料照片"
                disabled={mode === 'view'}
                value={form.getFieldValue('supplementaryImages')}
                onChange={value => form.setFieldValue('supplementaryImages', value)}
                onSuccess={handleImageUploadSuccess}
              />
            </Form.Item>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Form
        form={form}
        layout="vertical"
        initialValues={
          customer
            ? ({
                ...customer,
                licenseExpiryDate: customer.licenseExpiryDate
                  ? dayjs(customer.licenseExpiryDate)
                  : null,
                capitalContributionDeadline: customer.capitalContributionDeadline
                  ? dayjs(customer.capitalContributionDeadline)
                  : null,
                publicBankOpeningDate: customer.publicBankOpeningDate
                  ? dayjs(customer.publicBankOpeningDate)
                  : null,
              } as any)
            : undefined
        }
        onFinish={values => {
          // 确保在提交之前再次验证日期字段，确保它们被包含在表单提交中
          const formValues = form.getFieldsValue()

          // 检查日期字段
          const licenseExpiryDateValue = formValues.licenseExpiryDate
          const licenseNoFixedTermValue = formValues.licenseNoFixedTerm

          console.log('提交前的表单字段:', {
            licenseExpiryDate: licenseExpiryDateValue,
            licenseNoFixedTerm: licenseNoFixedTermValue,
          })

          if (licenseNoFixedTermValue) {
            // 如果勾选了无固定期限，设置为特定日期 9999-12-31
            formValues.licenseExpiryDate = dayjs('9999-12-31')
          }

          handleSubmit(formValues)
        }}
        onFinishFailed={handleFormValidationError}
        className="w-full"
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} className="mb-6" />
        <div className="flex justify-end mt-6">
          <Space>
            <Button onClick={() => handleCancel()}>取消</Button>
            {mode !== 'view' && (
              <Button type="primary" htmlType="submit" loading={isSaving}>
                {mode === 'add' ? '创建' : '保存'}
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </div>
  )
}

export default CustomerForm
