import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Table,
  Button,
  Input,
  Space,
  message,
  Tag,
  Modal,
  Drawer,
  Tabs,
  Descriptions,
  Select,
  DatePicker,
  Image,
  Upload,
  Form,
  Tooltip,
  Pagination,
} from 'antd'
import ResizableTable from '../../components/ResizableTable'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  LoadingOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FileJpgOutlined,
} from '@ant-design/icons'
import type { Customer, ImageType, ImageTypeWithRemarks } from '../../types'
import type { ExportVoucherRecordDto } from '../../types/voucherRecord'
import type { ResizableTableColumn } from '../../types/table'
import type { TabsProps } from 'antd'
import CustomerForm from './CustomerForm'
import CustomerLevelDisplay from '../../components/CustomerLevelDisplay'
import { useClanDetail } from '../../hooks/useClan'
import {
  BUSINESS_STATUS_MAP,
  ENTERPRISE_STATUS_MAP,
  BUSINESS_STATUS_COLOR_MAP,
  ENTERPRISE_STATUS_COLOR_MAP,
} from '../../constants'
import { LOCATION_OPTIONS } from '../../constants/locationOptions'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { usePageStates, PageStatesStore } from '../../store/pageStates'
import { useCustomerList, useCustomerDetail } from '../../hooks/useCustomer'
import { usePermission } from '../../hooks/usePermission'
import { useVoucherRecordActions } from '../../hooks/useVoucherRecord'
import { useAuthStore } from '../../store/auth'
import { useVoucherPermission } from '../../hooks/useVoucherPermission'
import VoucherRecordReadOnly from '../../components/VoucherRecord/VoucherRecordReadOnly'
import { useDebouncedValue } from '../../hooks/useDebounce'
import useSWR, { mutate } from 'swr'
import {
  getCustomerDetail,
  getCustomerById,
  exportCustomerCSV,
  importCustomerExcel,
  updateCustomerExcel,
  getUniqueCustomerLevels,
} from '../../api/customer'
import { deleteFile, buildImageUrl } from '../../utils/upload'
import ExpenseRecords from './ExpenseRecords'
import FollowUpRecords from '../../components/FollowUpRecords'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'

// 启用 dayjs 插件
dayjs.extend(utc)
dayjs.extend(timezone)

const { confirm } = Modal

// 智能文本渲染组件 - 只在文本被截断时显示tooltip
const EllipsisText: React.FC<{
  text: string
  maxWidth?: number
}> = ({ text, maxWidth }) => {
  const textRef = useRef<HTMLSpanElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflow = textRef.current.scrollWidth > textRef.current.clientWidth
        setIsOverflowing(isOverflow)
      }
    }

    checkOverflow()
    // 添加resize监听以处理窗口大小变化
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [text])

  const content = (
    <span
      ref={textRef}
      style={{
        cursor: isOverflowing ? 'pointer' : 'default',
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: maxWidth ? `${maxWidth}px` : '100%',
      }}
    >
      {text}
    </span>
  )

  if (isOverflowing) {
    return (
      <Tooltip
        title={text}
        placement="topLeft"
        classNames={{ root: 'customer-table-tooltip' }}
        mouseEnterDelay={0.3}
      >
        {content}
      </Tooltip>
    )
  }

  return content
}

export default function Customers() {
  // 使用 location 和 searchParams 获取URL参数
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // 使用 pageStates 存储来保持状态
  const getState = usePageStates((state: PageStatesStore) => state.getState)
  const setState = usePageStates((state: PageStatesStore) => state.setState)

  // 获取当前用户信息
  const { user } = useAuthStore()

  // 获取权限相关信息
  const { customerPermissions, loading: permissionLoading, refreshPermissions } = usePermission()

  // 检查是否为管理员或超级管理员
  const isAdmin = user?.roles?.some(role => ['admin', 'super_admin', '管理员', '超级管理员'].includes(role)) ?? false

  // 从 pageStates 恢复搜索参数
  const savedSearchParams = getState('customersSearchParams')
  const savedPagination = getState('customersPagination')

  // 保存来源页面信息
  const fromPage = location.state?.from

  const [current, setCurrent] = useState(savedPagination?.current || 1)
  const pageSize = 10 // 固定每页10条
  const [searchQueryParams, setSearchQueryParams] = useState(() => {
    const baseParams = {
      keyword: '',
      unifiedSocialCreditCode: '',
      customerLevel: [] as string[],
      consultantAccountant: [] as string[],
      bookkeepingAccountant: [] as string[],
      taxBureau: [] as string[],
      enterpriseType: [] as string[],
      industryCategory: [] as string[],
      enterpriseStatus: [] as string[],
      businessStatus: [] as string[],
      location: [] as string[],
      remarks: '',
      startDate: '',
      endDate: '',
      dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
      ...(savedSearchParams || {}), // 恢复之前保存的搜索条件
    }

    // 如果有保存的startDate和endDate，则构建dateRange
    if (baseParams.startDate && baseParams.endDate) {
      baseParams.dateRange = [
        dayjs.utc(baseParams.startDate).local(),
        dayjs.utc(baseParams.endDate).local(),
      ]
    }

    return baseParams
  })
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  const [detailType, setDetailType] = useState<'view' | 'edit' | 'add'>('view')
  const [isMobile, setIsMobile] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>()
  const [customerLevelOptions, setCustomerLevelOptions] = useState<string[]>([])

  // 获取客户分级唯一值列表
  const { data: customerLevelsData } = useSWR('/customer/unique-values/customer-level', () =>
    getUniqueCustomerLevels()
  )

  // 更新客户分级选项
  useEffect(() => {
    // 处理嵌套的data结构：response.data.data（兼容旧版本）
    // 或直接的data结构：response.data（新版本）
    const actualData = customerLevelsData?.data?.data || customerLevelsData?.data
    if (actualData && Array.isArray(actualData)) {
      setCustomerLevelOptions(actualData)
    }
  }, [customerLevelsData])

  // 临时降级方案 - 确保按钮正常显示
  // 如果权限加载失败或尚未完成，允许所有操作
  const canCreateCustomer = permissionLoading ? true : customerPermissions.canCreate
  const canEditCustomer = permissionLoading ? true : customerPermissions.canEdit
  const canDeleteCustomer = permissionLoading ? true : customerPermissions.canDelete

  // 刷新权限信息
  useEffect(() => {
    refreshPermissions()
  }, [refreshPermissions])

  // 添加防抖搜索参数
  const debouncedSearchParams = useDebouncedValue(searchQueryParams, 500)

  // 构建请求参数
  const requestParams = useMemo(() => ({
    page: current,
    pageSize,
    // 处理基础字符串字段
    keyword: debouncedSearchParams.keyword,
    unifiedSocialCreditCode: debouncedSearchParams.unifiedSocialCreditCode,
    remarks: debouncedSearchParams.remarks,
    // 处理多选字段，将数组转换为后端需要的格式，并处理__EMPTY__
    ...(debouncedSearchParams.customerLevel?.length ? {
      customerLevel: debouncedSearchParams.customerLevel.map((val: string) => val === '__EMPTY__' ? '' : val)
    } : {}),
    ...(debouncedSearchParams.consultantAccountant?.length ? {
      consultantAccountant: debouncedSearchParams.consultantAccountant.map((val: string) => val === '__EMPTY__' ? '' : val)
    } : {}),
    ...(debouncedSearchParams.bookkeepingAccountant?.length ? {
      bookkeepingAccountant: debouncedSearchParams.bookkeepingAccountant.map((val: string) => val === '__EMPTY__' ? '' : val)
    } : {}),
    ...(debouncedSearchParams.taxBureau?.length ? {
      taxBureau: debouncedSearchParams.taxBureau.map((val: string) => val === '__EMPTY__' ? '' : val)
    } : {}),
    ...(debouncedSearchParams.enterpriseType?.length ? {
      enterpriseType: debouncedSearchParams.enterpriseType.map((val: string) => val === '__EMPTY__' ? '' : val)
    } : {}),
    ...(debouncedSearchParams.industryCategory?.length ? {
      industryCategory: debouncedSearchParams.industryCategory.map((val: string) => val === '__EMPTY__' ? '' : val)
    } : {}),
    ...(debouncedSearchParams.enterpriseStatus?.length ? {
      enterpriseStatus: debouncedSearchParams.enterpriseStatus.map((val: string) => val === '__EMPTY__' ? '' : val)
    } : {}),
    ...(debouncedSearchParams.businessStatus?.length ? {
      businessStatus: debouncedSearchParams.businessStatus.map((val: string) => val === '__EMPTY__' ? '' : val)
    } : {}),
    ...(debouncedSearchParams.location?.length ? {
      location: debouncedSearchParams.location.map((val: string) => val === '__EMPTY__' ? '' : val)
    } : {}),
    // 如果有dateRange，将其转换为startDate和endDate
    ...(debouncedSearchParams.dateRange
      ? {
          startDate: debouncedSearchParams.dateRange[0].format('YYYY-MM-DD'),
          endDate: debouncedSearchParams.dateRange[1].format('YYYY-MM-DD'),
        }
      : {}),
  }), [current, pageSize, debouncedSearchParams])

  // 使用SWR获取客户列表数据
  const {
    customerList: customers,
    pagination: { total },
    loading: isLoading,
    refreshCustomerList: refreshCustomers,
    deleteCustomer: removeCustomer,
  } = useCustomerList(requestParams)

  // 使用SWR获取客户详情数据
  const { customer: customerDetail, refreshCustomerDetail: refreshCustomerDetail } =
    useCustomerDetail(selectedCustomerId)

  // 当客户详情数据更新时，更新当前客户状态
  useEffect(() => {
    if (customerDetail && (detailType === 'view' || detailType === 'edit')) {
      // 更新当前客户信息，确保图片字段正确保留
      setCurrentCustomer(customerDetail)
    }
  }, [customerDetail, detailType])

  // 当搜索参数变化时，保存到 pageStates
  useEffect(() => {
    setState('customersSearchParams', searchQueryParams)
  }, [searchQueryParams, setState])

  // 当分页参数变化时，保存到 pageStates
  useEffect(() => {
    setState('customersPagination', { current, pageSize: 10 })
  }, [current, setState])

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // 初始化判断
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // 处理URL参数中的view参数，自动打开客户详情
  useEffect(() => {
    const viewParam = searchParams.get('view')
    const _editParam = searchParams.get('edit')
    
    // 处理从其他页面传来的编辑客户请求
    if (location.state?.editCustomerId) {
      const customerId = location.state.editCustomerId
      const companyName = location.state.companyName || ''
      
      // 先查找客户列表中是否有此客户
      const customer = customers.find(c => c.id === customerId)
      
      if (customer) {
        // 如果客户列表中有此客户，直接打开编辑页面
        // 内联handleEdit逻辑
        if (!canEditCustomer) {
          message.error('您没有编辑客户的权限')
          return
        }
        
        setCurrentCustomer(customer)
        setDetailType('edit')
        setSelectedCustomerId(customer.id)
        
        if (isMobile) {
          setDrawerVisible(true)
        } else {
          setModalVisible(true)
        }
      } else if (!isLoading) {
        // 如果客户列表中没有此客户，且列表加载完毕，从API获取客户详情
        getCustomerById(customerId).then(response => {
          if (response.code === 0 && response.data) {
            // 设置当前客户并打开编辑页面
            setCurrentCustomer(response.data)
            setDetailType('edit')
            setSelectedCustomerId(customerId)
            
            // 打开对话框
            if (isMobile) {
              setDrawerVisible(true)
            } else {
              setModalVisible(true)
            }
          } else {
            message.error(`未找到客户: ${companyName}`)
          }
        }).catch(error => {
          console.error('获取客户详情失败:', error)
          message.error('获取客户详情失败')
        })
      }
      
      // 清除状态以避免重复触发
      window.history.replaceState({}, '', location.pathname + location.search)
      return
    }
    
    if (viewParam) {
      const customerId = parseInt(viewParam, 10)
      if (!isNaN(customerId)) {
        // 先查找客户列表中是否有此客户
        const customer = customers.find(c => c.id === customerId)
        
        if (customer) {
          // 如果客户列表中有此客户，直接打开详情
          // 内联handleView逻辑
          // 先清除可能存在的缓存，关键步骤!
          mutate(`/customer/${customer.id}`, undefined, { revalidate: false })

          // 只使用基本信息初始化
          setCurrentCustomer({
            ...customer,
            // 确保图片对象初始化为空对象而不是undefined
            legalPersonIdImages: customer.legalPersonIdImages || {},
            legalPersonIdImagesWithId: customer.legalPersonIdImagesWithId || {},
            businessLicenseImages: customer.businessLicenseImages || {},
            bankAccountLicenseImages: customer.bankAccountLicenseImages || {},
            otherIdImages: customer.otherIdImages || {},
            supplementaryImages: customer.supplementaryImages || {},
          })

          setDetailType('view')

          // 重置selectedCustomerId后再设置新值，确保状态完全刷新
          setSelectedCustomerId(undefined)
          // 使用 queueMicrotask 代替 setTimeout 0
          queueMicrotask(() => {
            setSelectedCustomerId(customer.id)
          })

          // 延迟打开对话框，使用 requestAnimationFrame 代替 setTimeout
          requestAnimationFrame(() => {
            if (isMobile) {
              setDrawerVisible(true)
            } else {
              setModalVisible(true)
            }
          })
        } else if (!isLoading) {
          // 如果客户列表中没有此客户，且列表加载完毕，从API获取客户详情
          getCustomerById(customerId).then(response => {
            if (response.code === 0 && response.data) {
              // 设置当前客户并打开详情
              setCurrentCustomer(response.data)
              setDetailType('view')
              setSelectedCustomerId(customerId)
              
              // 打开对话框
              if (isMobile) {
                setDrawerVisible(true)
              } else {
                setModalVisible(true)
              }
              
              // 清除URL参数
              const newSearchParams = new URLSearchParams(searchParams)
              newSearchParams.delete('view')
              setSearchParams(newSearchParams)
            } else {
              message.error('未找到指定客户')
              // 清除URL参数
              const newSearchParams = new URLSearchParams(searchParams)
              newSearchParams.delete('view')
              setSearchParams(newSearchParams)
            }
          }).catch(error => {
            console.error('获取客户详情失败:', error)
            message.error('获取客户详情失败')
            // 清除URL参数
            const newSearchParams = new URLSearchParams(searchParams)
            newSearchParams.delete('view')
            setSearchParams(newSearchParams)
          })
        }
      } else {
        // 无效的客户ID
        message.error('无效的客户ID')
        // 清除URL参数
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.delete('view')
        setSearchParams(newSearchParams)
      }
    }
    
    // 清除URL参数
    if (searchParams.has('view')) {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('view')
      setSearchParams(newSearchParams)
    }
  }, [customers, isLoading, searchParams, setSearchParams, location.state, isMobile, canEditCustomer])

  // 当搜索参数变化时，自动重置到第一页（仅当不是初始加载时）
  useEffect(() => {
    if (current !== 1) {
      setCurrent(1)
    }
  }, [
    searchQueryParams.keyword,
    searchQueryParams.unifiedSocialCreditCode,
    JSON.stringify(searchQueryParams.customerLevel),
    JSON.stringify(searchQueryParams.consultantAccountant),
    JSON.stringify(searchQueryParams.bookkeepingAccountant),
    JSON.stringify(searchQueryParams.taxBureau),
    JSON.stringify(searchQueryParams.enterpriseType),
    JSON.stringify(searchQueryParams.industryCategory),
    JSON.stringify(searchQueryParams.enterpriseStatus),
    JSON.stringify(searchQueryParams.businessStatus),
    JSON.stringify(searchQueryParams.location),
    searchQueryParams.dateRange,
  ])

  const resetSearch = () => {
    setSearchQueryParams({
      keyword: '',
      unifiedSocialCreditCode: '',
      customerLevel: [],
      consultantAccountant: [],
      bookkeepingAccountant: [],
      taxBureau: [],
      enterpriseType: [],
      industryCategory: [],
      enterpriseStatus: [],
      businessStatus: [],
      location: [],
      remarks: '',
      startDate: '',
      endDate: '',
      dateRange: null,
    })
    setCurrent(1)
  }

  const handleAdd = () => {
    // 再次检查创建权限
    if (!canCreateCustomer) {
      message.error('您没有创建客户的权限')
      return
    }

    setCurrentCustomer(null)
    setSelectedCustomerId(undefined)
    setDetailType('add')
    if (isMobile) {
      setDrawerVisible(true)
    } else {
      setModalVisible(true)
    }
  }

  const handleView = (record: Customer) => {
    // 先清除可能存在的缓存，关键步骤!
    mutate(`/customer/${record.id}`, undefined, { revalidate: false })

    // 只使用基本信息初始化
    setCurrentCustomer({
      ...record,
      // 确保图片对象初始化为空对象而不是undefined
      legalPersonIdImages: record.legalPersonIdImages || {},
      legalPersonIdImagesWithId: record.legalPersonIdImagesWithId || {},
      businessLicenseImages: record.businessLicenseImages || {},
      bankAccountLicenseImages: record.bankAccountLicenseImages || {},
      otherIdImages: record.otherIdImages || {},
      supplementaryImages: record.supplementaryImages || {},
    })

    setDetailType('view')

    // 重置selectedCustomerId后再设置新值，确保状态完全刷新
    setSelectedCustomerId(undefined)
    // 使用 queueMicrotask 代替 setTimeout 0
    queueMicrotask(() => {
      setSelectedCustomerId(record.id)
    })

    // 延迟打开对话框，使用 requestAnimationFrame 代替 setTimeout
    requestAnimationFrame(() => {
      if (isMobile) {
        setDrawerVisible(true)
      } else {
        setModalVisible(true)
      }
    })
    
    // 清除URL参数
    if (searchParams.has('view')) {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('view')
      setSearchParams(newSearchParams)
    }
  }

  const handleEdit = (record: Customer) => {
    // 再次检查编辑权限
    if (!canEditCustomer) {
      message.error('您没有编辑客户的权限')
      return
    }

    // 先使用列表中的记录，确保图片等信息在加载完整数据前可见
    setCurrentCustomer(record)
    setDetailType('edit')
    setSelectedCustomerId(record.id)

    // 打开对话框
    if (isMobile) {
      setDrawerVisible(true)
    } else {
      setModalVisible(true)
    }
  }

  // 删除客户相关的所有图片
  const deleteAllCustomerImages = async (customerId: number) => {
    try {
      // 获取完整的客户详细信息
      const response = await getCustomerById(customerId)

      if (!response || response.code !== 0 || !response.data) {
        console.error('获取客户详情失败，无法删除图片')
        return
      }

      const customer = response.data
      // let deletedCount = 0

      // 提取所有图片文件名准备删除
      const imagesToDelete: string[] = []

      // 处理对象格式的图片字段 {key: {fileName, url}}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processObjectImages = (imagesObj: Record<string, any> | undefined) => {
        if (!imagesObj) return

        Object.values(imagesObj).forEach(item => {
          if (item && typeof item === 'object' && item.fileName) {
            imagesToDelete.push(item.fileName)
          }
        })
      }

      // 处理字符串形式的图片URL {key: string} - 暂时注释掉，因为当前未使用
      // const processStringImages = (imagesObj: Record<string, any> | undefined) => {
      //   if (!imagesObj) return

      //   Object.values(imagesObj).forEach(item => {
      //     if (typeof item === 'string' && item) {
      //       // 从URL中提取文件名
      //       const urlParts = item.split('/')
      //       const fileNameWithParams = urlParts[urlParts.length - 1]
      //       const fileName = fileNameWithParams.split('?')[0] // 移除查询参数

      //       if (fileName) {
      //       imagesToDelete.push(fileName)
      //       }
      //     } else if (item && typeof item === 'object' && item.fileName) {
      //       // 处理ImageType格式
      //       imagesToDelete.push(item.fileName)
      //     }
      //   })
      // }

      processObjectImages(customer.legalPersonIdImages)
      processObjectImages(customer.legalPersonIdImagesWithId)
      processObjectImages(customer.businessLicenseImages)
      processObjectImages(customer.bankAccountLicenseImages)
      processObjectImages(customer.otherIdImages)
      processObjectImages(customer.supplementaryImages)

      // 批量删除图片文件
      for (const fileName of imagesToDelete) {
        try {
          await deleteFile(fileName)
        } catch (error) {
          console.error(`删除图片文件 ${fileName} 失败:`, error)
        }
      }
    } catch (error) {
      console.error('删除客户图片出错:', error)
    }
  }

  const handleDelete = (id: number) => {
    // 删除操作
    // 再次检查删除权限
    if (!canDeleteCustomer) {
      message.error('您没有删除客户的权限')
      return
    }

    confirm({
      title: '确认删除',
      content: '确定要删除这个客户吗？此操作不可恢复，相关的图片文件也会被删除。',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 先删除图片文件
          message.loading('正在删除客户数据及相关图片...', 0)
          await deleteAllCustomerImages(id)

          // 再删除客户记录
          const success = await removeCustomer(id)

          message.destroy() // 关闭loading消息

          if (success) {
            message.success('客户及相关图片已成功删除')
          }

          return success
        } catch (error) {
          message.destroy() // 关闭loading消息
          console.error('删除客户过程中出错:', error)
          message.error('删除客户失败')
          return false
        }
      },
    })
  }

  // 保存成功后的回调
  const handleSaveSuccess = async (isAutoSave = false, id?: number) => {
    // 刷新列表数据
    refreshCustomers()

    // 只有在非自动保存时才关闭抽屉和弹窗
    if (!isAutoSave) {
      // 关闭抽屉和弹窗
      setDrawerVisible(false)
      setModalVisible(false)
      setCurrentCustomer(null)
      setSelectedCustomerId(undefined)
    }

    // 如果提供了ID，并且正在查看或编辑，则刷新详情
    if (id && (detailType === 'edit' || detailType === 'view')) {
      // 确保选择的是当前ID
      setSelectedCustomerId(id)
      // 刷新详情数据
      refreshCustomerDetail()
    }
  }

  // 添加导出CSV功能
  const handleExport = async () => {
    try {
      message.loading('正在导出数据，请稍候...', 0)

      // 使用当前搜索参数导出数据，不包含分页限制
      const { page: _page, pageSize: _pageSize, ...exportParams } = requestParams
      const response = await exportCustomerCSV(exportParams)

      message.destroy()

      // 创建Blob对象
      const blob = new Blob([response as BlobPart], { type: 'text/csv;charset=utf-8;' })

      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // 设置下载文件名
      const date = new Date().toISOString().split('T')[0]
      link.download = `客户数据_${date}.csv`

      // 触发下载
      document.body.appendChild(link)
      link.click()

      // 清理
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      message.success('导出成功')
    } catch (error) {
      message.destroy()
      console.error('导出失败', error)
      message.error('导出失败，请联系管理员添加导出权限')
    }
  }

  // 处理导入Excel功能
  const handleImport = async (file: File) => {
    try {
      message.loading('正在导入数据，请稍候...', 0)

      const response = await importCustomerExcel(file)
      message.destroy()

      // 导入成功
      if (response.code === 0) {
        const { data } = response

        if (data.success) {
          // 有失败记录需要展示
          if (data.failedRecords && data.failedRecords.length > 0) {
            // 检查是否所有失败都是因为重复
            const allDuplicates = data.failedRecords.every(
              (record: { reason?: string }) =>
                record.reason?.includes('重复') ||
                record.reason?.includes('Duplicate')
            )

            // 创建模态框展示失败记录
            Modal.error({
              title: allDuplicates ? '导入数据重复' : '部分数据导入失败',
              content: (
                <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                  <p style={{ marginBottom: '16px', color: '#ff4d4f', fontWeight: 'bold' }}>
                    {allDuplicates
                      ? `发现 ${data.failedRecords.length} 条重复数据，请修改后重新导入`
                      : data.message}
                  </p>
                  <Table
                    dataSource={data.failedRecords.map((record, index) => ({
                      ...record,
                      key: index,
                    }))}
                    columns={[
                      {
                        title: '行号',
                        dataIndex: 'row',
                        key: 'row',
                        width: 80,
                      },
                      {
                        title: '企业名称',
                        dataIndex: 'companyName',
                        key: 'companyName',
                        width: 200,
                      },
                      {
                        title: '统一社会信用代码',
                        dataIndex: 'unifiedSocialCreditCode',
                        key: 'unifiedSocialCreditCode',
                        width: 200,
                      },
                      {
                        title: '失败原因',
                        dataIndex: 'reason',
                        key: 'reason',
                        render: (text, record) => {
                          if (record.errors && record.errors.length > 0) {
                            return (
                              <>
                                {record.errors.map((error, index) => (
                                  <div key={index}>{error}</div>
                                ))}
                              </>
                            )
                          }
                          return <span style={{ color: '#ff4d4f' }}>{text}</span>
                        },
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </div>
              ),
              width: 900,
              maskClosable: false,
              okText: '关闭',
            })
          } else {
            // 全部导入成功
            Modal.success({
              title: '导入成功',
              content: (
                <div>
                  <p>{data.message}</p>
                  <p style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    ✓ 所有数据已成功导入
                  </p>
                </div>
              ),
              okText: '确定',
              onOk: () => {
                // 刷新客户列表
                refreshCustomers()
              },
            })
          }

          // 如果有部分成功，也刷新列表
          if (data.count && data.count > 0) {
            refreshCustomers()
          }
        } else {
          // 导入完全失败
          Modal.error({
            title: '导入失败',
            content: (
              <div>
                <p>{data.message || '导入失败，请检查文件格式'}</p>
                {data.failedRecords && data.failedRecords.length > 0 && (
                  <>
                    <p style={{ marginTop: '16px', marginBottom: '8px' }}>失败详情：</p>
                    <Table
                      dataSource={data.failedRecords.map((record, index) => ({
                        ...record,
                        key: index,
                      }))}
                      columns={[
                        {
                          title: '行号',
                          dataIndex: 'row',
                          key: 'row',
                          width: 80,
                        },
                        {
                          title: '企业名称',
                          dataIndex: 'companyName',
                          key: 'companyName',
                          width: 200,
                        },
                        {
                          title: '失败原因',
                          dataIndex: 'reason',
                          key: 'reason',
                        },
                      ]}
                      pagination={false}
                      size="small"
                    />
                  </>
                )}
              </div>
            ),
            width: 900,
            okText: '关闭',
          })
        }
      } else {
        message.error(response.message || '导入失败')
      }
    } catch (error) {
      message.destroy()
      console.error('导入失败', error)
      message.error('导入失败，请稍后重试')
    }
  }

  // 处理批量替换Excel功能
  const handleUpdateExcel = async (file: File) => {
    try {
      message.loading('正在批量替换数据，请稍候...', 0)

      const response = await updateCustomerExcel(file)
      message.destroy()

      // 替换成功
      if (response.code === 0) {
        const { data } = response

        if (data.success) {
          // 有失败记录需要展示
          if (data.failedRecords && data.failedRecords.length > 0) {
            // 创建模态框展示失败记录
            Modal.error({
              title: '部分数据替换失败',
              content: (
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  <p>{data.message}</p>
                  <Table
                    dataSource={data.failedRecords.map((record, index) => ({
                      ...record,
                      key: index,
                    }))}
                    columns={[
                      {
                        title: '行号',
                        dataIndex: 'row',
                        key: 'row',
                        width: 80,
                      },
                      {
                        title: '企业名称',
                        dataIndex: 'companyName',
                        key: 'companyName',
                        width: 200,
                      },
                      {
                        title: '统一社会信用代码',
                        dataIndex: 'unifiedSocialCreditCode',
                        key: 'unifiedSocialCreditCode',
                        width: 200,
                      },
                      {
                        title: '失败原因',
                        dataIndex: 'reason',
                        key: 'reason',
                        render: (text, record) => {
                          if (record.errors && record.errors.length > 0) {
                            return (
                              <>
                                {record.errors.map((error, index) => (
                                  <div key={index}>{error}</div>
                                ))}
                              </>
                            )
                          }
                          return text
                        },
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </div>
              ),
              width: 800,
              maskClosable: false,
              okText: '关闭',
            })
          } else {
            // 全部替换成功
            message.success(data.message)
          }

          // 刷新客户列表
          refreshCustomers()
        } else {
          message.error(data.message || '批量替换失败')
        }
      } else {
        message.error(response.message || '批量替换失败')
      }
    } catch (error) {
      message.destroy()
      console.error('批量替换失败', error)
      message.error('批量替换失败，请稍后重试')
    }
  }

  // 文件上传前校验
  // 处理导入按钮点击，先弹窗再上传
  const handleImportClick = () => {
    Modal.confirm({
      title: '确认导入',
      content: '导入功能会将表格上的内容上传至系统，请确保系统内没有您需要上传的企业。',
      okText: '确认',
      cancelText: '取消',
      centered: true,
      onOk() {
        // 用户点击确认，触发隐藏的文件输入框
        const fileInput = document.getElementById('hidden-import-input') as HTMLInputElement
        if (fileInput) {
          fileInput.click()
        }
      },
      onCancel() {
        // 用户点击取消，不做任何操作
        console.log('用户取消了导入')
      },
    })
  }

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 验证文件
      const isExcel =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')

      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv')

      if (!isExcel && !isCSV) {
        message.error('只能上传Excel或CSV文件！')
        return
      }

      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error('文件大小不能超过10MB！')
        return
      }

      // 处理文件上传
      handleImport(file)
    }
    // 重置文件输入，以便可以再次选择同一文件
    event.target.value = ''
  }


  // 批量替换前校验
  const beforeUpdate = (file: File) => {
    const isExcel =
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')

    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv')

    if (!isExcel && !isCSV) {
      message.error('只能上传Excel或CSV文件！')
      return false
    }

    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('文件大小不能超过10MB！')
      return false
    }

    // 处理批量替换
    handleUpdateExcel(file)
    return false // 阻止默认上传行为
  }

  // 新的可拖拽列定义
  const resizableColumns: ResizableTableColumn<Customer>[] = [
    {
      id: 'companyName',
      accessorKey: 'companyName',
      header: '企业名称',
      enableResizing: true,
      size: isMobile ? 160 : 200,
      minSize: 120,
      fixed: 'left',
      cell: ({ getValue }) => (
        <EllipsisText text={(getValue() as string) || '-'} maxWidth={undefined} />
      ),
    },
    {
      id: 'customerLevel',
      accessorKey: 'customerLevel',
      header: '客户分级',
      size: isMobile ? 120 : 150,
      responsive: ['md'],
      cell: ({ getValue }) => (
        <CustomerLevelDisplay
          level={getValue() as string}
          maxWidth={isMobile ? 100 : 130}
          placement="right"
        />
      ),
    },
    {
      id: 'consultantAccountant',
      accessorKey: 'consultantAccountant',
      header: '顾问会计',
      size: 120,
      responsive: ['lg'],
      cell: ({ getValue }) => <EllipsisText text={(getValue() as string) || '-'} maxWidth={100} />,
    },
    {
      id: 'bookkeepingAccountant',
      accessorKey: 'bookkeepingAccountant',
      header: '记账会计',
      size: 120,
      responsive: ['lg'],
      cell: ({ getValue }) => <EllipsisText text={(getValue() as string) || '-'} maxWidth={100} />,
    },
    {
      id: 'enterpriseType',
      accessorKey: 'enterpriseType',
      header: '企业类型',
      size: 120,
      responsive: ['lg'],
      cell: ({ getValue }) => <EllipsisText text={(getValue() as string) || '-'} maxWidth={100} />,
    },
    {
      id: 'taxBureau',
      accessorKey: 'taxBureau',
      header: '所属分局',
      size: 150,
      responsive: ['lg'],
      cell: ({ getValue }) => <EllipsisText text={(getValue() as string) || '-'} maxWidth={130} />,
    },
    {
      id: 'location',
      accessorKey: 'location',
      header: '归属地',
      size: 150,
      responsive: ['lg'],
      cell: ({ getValue }) => <EllipsisText text={(getValue() as string) || '-'} maxWidth={130} />,
    },
    {
      id: 'actualResponsibleName',
      accessorFn: row => row.actualResponsibles?.[0]?.name || '-',
      header: '实际负责人',
      size: isMobile ? 100 : 120,
      responsive: ['sm'],
      cell: ({ getValue }) => (
        <EllipsisText text={(getValue() as string) || '-'} maxWidth={isMobile ? 80 : 100} />
      ),
    },
    {
      id: 'actualResponsiblePhone',
      accessorFn: row => row.actualResponsibles?.[0]?.phone || '-',
      header: '联系电话',
      size: isMobile ? 100 : 120,
      responsive: ['md'],
      cell: ({ getValue }) => (
        <EllipsisText text={(getValue() as string) || '-'} maxWidth={isMobile ? 80 : 100} />
      ),
    },
    {
      id: 'enterpriseStatus',
      accessorKey: 'enterpriseStatus',
      header: '工商状态',
      size: isMobile ? 80 : 100,
      cell: ({ getValue }) => {
        const status = getValue() as string
        if (!status) {
          return (
            <Tooltip title="未设置" placement="topLeft" mouseEnterDelay={0.3}>
              <Tag color="default">未设置</Tag>
            </Tooltip>
          )
        }

        const color =
          ENTERPRISE_STATUS_COLOR_MAP[status as keyof typeof ENTERPRISE_STATUS_COLOR_MAP] ||
          'default'
        const label = ENTERPRISE_STATUS_MAP[status as keyof typeof ENTERPRISE_STATUS_MAP] || status

        return (
          <Tooltip title={label} placement="topLeft" mouseEnterDelay={0.3}>
            <Tag color={color}>{label}</Tag>
          </Tooltip>
        )
      },
    },
    {
      id: 'businessStatus',
      accessorKey: 'businessStatus',
      header: '税务状态',
      size: isMobile ? 80 : 100,
      cell: ({ getValue }) => {
        const status = getValue() as string
        if (!status) {
          return (
            <Tooltip title="未设置" placement="topLeft" mouseEnterDelay={0.3}>
              <Tag color="default">未设置</Tag>
            </Tooltip>
          )
        }

        const color =
          BUSINESS_STATUS_COLOR_MAP[status as keyof typeof BUSINESS_STATUS_COLOR_MAP] || 'default'
        const label = BUSINESS_STATUS_MAP[status as keyof typeof BUSINESS_STATUS_MAP] || status

        return (
          <Tooltip title={label} placement="topLeft" mouseEnterDelay={0.3}>
            <Tag color={color}>{label}</Tag>
          </Tooltip>
        )
      },
    },
    {
      id: 'customerGroup',
      accessorKey: 'customerGroup',
      header: '客户群',
      size: isMobile ? 100 : 120,
      responsive: ['lg'],
      cell: ({ getValue }) => {
        const value = getValue() as string
        return <EllipsisText text={value || '-'} maxWidth={isMobile ? 80 : 100} />
      },
    },
    {
      id: 'maintenanceAgent',
      accessorKey: 'maintenanceAgent',
      header: '维护代理端',
      size: isMobile ? 100 : 120,
      responsive: ['lg'],
      cell: ({ getValue }) => {
        const value = getValue() as string
        return <EllipsisText text={value || '-'} maxWidth={isMobile ? 80 : 100} />
      },
    },
    {
      id: 'accountingSoftware',
      accessorKey: 'accountingSoftware',
      header: '记账软件',
      size: isMobile ? 100 : 120,
      responsive: ['lg'],
      cell: ({ getValue }) => {
        const value = getValue() as string
        return <EllipsisText text={value || '-'} maxWidth={isMobile ? 80 : 100} />
      },
    },
    {
      id: 'createTime',
      accessorKey: 'createTime',
      header: '创建时间',
      size: isMobile ? 130 : 180,
      responsive: ['lg'],
      cell: ({ getValue }) => {
        const date = getValue() as string
        const formattedDate = dayjs.utc(date).local().format('YYYY-MM-DD HH:mm:ss')
        return <EllipsisText text={formattedDate} maxWidth={isMobile ? 110 : 160} />
      },
    },
    {
      id: 'actions',
      header: '操作',
      fixed: 'right',
      size: isMobile ? 110 : 140,
      minSize: isMobile ? 100 : 130,
      cell: ({ row }) => {
        const record = row.original
        // 调试权限状态
        // 操作列渲染权限检查
        return (
          <Space size="small" className="flex flex-nowrap justify-start">
            <Tooltip title="查看">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleView(record)}
                className="p-1 m-0 h-auto min-w-0"
              />
            </Tooltip>
            {canEditCustomer && (
              <Tooltip title="编辑">
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  className="p-1 m-0 h-auto min-w-0"
                />
              </Tooltip>
            )}
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                className="p-1 m-0 h-auto min-w-0"
                style={{ color: '#ff4d4f' }}
              />
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  // 处理关闭抽屉
  const handleCloseDrawer = () => {
    handleCloseDetail()
  }

  // 处理关闭模态框
  const handleCloseModal = () => {
    handleCloseDetail()
  }

  // 处理关闭详情页面
  const handleCloseDetail = () => {
    // 关闭弹窗
    setModalVisible(false)
    setDrawerVisible(false)
    
    // 清理状态
    if (detailType === 'view') {
      // 延迟清理状态，避免视觉闪烁
      requestAnimationFrame(() => {
        setCurrentCustomer(null)
        setSelectedCustomerId(undefined)
        // 清除该客户的SWR缓存
        if (customerDetail?.id) {
          mutate(`/customer/${customerDetail.id}`, undefined, { revalidate: false })
        }
      })
    } else if (detailType === 'add' || detailType === 'edit') {
      // 如果表单引用还存在，应该调用它的取消方法（包含图片清理等操作）
      const formElement = document.querySelector('.customer-form')
      if (formElement) {
        // 模拟点击取消按钮
        const cancelButton = formElement.querySelector('.customer-form-footer button')
        if (cancelButton) {
          (cancelButton as HTMLButtonElement).click()
        }
      }
    }
    
    // 如果有来源页面，则返回到来源页面
    if (fromPage) {
      // 检查来源页面是否是报表服务到期客户页面
      const LAST_REPORT_SUBPAGE_KEY = 'lastReportSubpage'
      // 如果来源是服务到期客户页面，保存该路径到localStorage
      if (fromPage.includes('reports/service-expiry')) {
        localStorage.setItem(LAST_REPORT_SUBPAGE_KEY, fromPage)
      }
      navigate(fromPage)
    }
  }

  // 修改所有关闭弹窗的地方，使用handleCloseDetail函数
  const _handleFormCancel = () => {
    handleCloseDetail()
  }

  // 修改表单提交后的处理
  const _handleFormSuccess = (isAdd: boolean, customerId?: number) => {
    // 关闭表单
    handleCloseDetail()

    // 刷新客户列表
    refreshCustomers()

    // 显示成功消息
    message.success(isAdd ? '客户创建成功' : '客户信息更新成功')

    // 如果是新建客户，且需要查看详情，则打开详情页面
    if (isAdd && customerId) {
      // 延迟打开详情，确保列表已刷新
      setTimeout(() => {
        getCustomerById(customerId).then(response => {
          if (response.code === 0 && response.data) {
            setCurrentCustomer(response.data)
            setDetailType('view')
            setSelectedCustomerId(customerId)
            if (isMobile) {
              setDrawerVisible(true)
            } else {
              setModalVisible(true)
            }
          }
        })
      }, 500)
    }
  }

  return (
    <div className="customer-management-container">
      <style>
        {`
          .customer-table-tooltip {
            max-width: 300px;
            word-wrap: break-word;
            z-index: 1060;
          }
          .customer-management-container .ant-table-tbody > tr > td {
            position: relative;
          }
        `}
      </style>
      {/* 搜索和操作工具栏 */}
      <div className="mb-4">
        <Form layout="inline" className="customer-search-form">
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2">
              <Form.Item label="企业名称" className="mb-2">
                <Input
                  placeholder="请输入企业名称关键词"
                  value={searchQueryParams.keyword}
                  onChange={e => setSearchQueryParams({ ...searchQueryParams, keyword: e.target.value })}
                  className="w-full"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="统一社会信用代码" className="mb-2">
                <Input
                  placeholder="请输入统一社会信用代码"
                  value={searchQueryParams.unifiedSocialCreditCode}
                  onChange={e =>
                    setSearchQueryParams({ ...searchQueryParams, unifiedSocialCreditCode: e.target.value })
                  }
                  className="w-full"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="客户分级" className="mb-2">
                <Select
                  mode="multiple"
                  placeholder="请选择客户分级"
                  value={searchQueryParams.customerLevel}
                  onChange={value =>
                    setSearchQueryParams({ ...searchQueryParams, customerLevel: value })
                  }
                  allowClear
                  className="w-full"
                  maxTagCount="responsive"
                  options={[
                    // 添加空值选项
                    { value: '__EMPTY__', label: '-（未设置）' },
                    // 添加数据库中的实际值
                    ...(Array.isArray(customerLevelOptions) ? customerLevelOptions.map(level => ({
                      value: level,
                      label: level,
                    })) : [])
                  ]}
                  loading={!customerLevelsData}
                  notFoundContent={!customerLevelsData ? '加载中...' : (customerLevelOptions.length === 0 ? '暂无数据' : undefined)}
                />
              </Form.Item>

              <Form.Item label="顾问会计" className="mb-2">
                <Input
                  placeholder="请输入顾问会计"
                  value={searchQueryParams.consultantAccountant?.[0] || ''}
                  onChange={e =>
                    setSearchQueryParams({ 
                      ...searchQueryParams, 
                      consultantAccountant: e.target.value ? [e.target.value] : []
                    })
                  }
                  className="w-full"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="记账会计" className="mb-2">
                <Input
                  placeholder="请输入记账会计"
                  value={searchQueryParams.bookkeepingAccountant?.[0] || ''}
                  onChange={e =>
                    setSearchQueryParams({ 
                      ...searchQueryParams, 
                      bookkeepingAccountant: e.target.value ? [e.target.value] : []
                    })
                  }
                  className="w-full"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="企业类型" className="mb-2">
                <Select
                  mode="multiple"
                  placeholder="请选择企业类型"
                  value={searchQueryParams.enterpriseType}
                  onChange={value =>
                    setSearchQueryParams({ ...searchQueryParams, enterpriseType: value })
                  }
                  className="w-full"
                  allowClear
                  maxTagCount="responsive"
                >
                  <Select.Option value="小规模（公司）">小规模（公司）</Select.Option>
                  <Select.Option value="小规模（个体）">小规模（个体）</Select.Option>
                  <Select.Option value="一般纳税人">一般纳税人</Select.Option>
                  <Select.Option value="小规模（个人独资）">小规模（个人独资）</Select.Option>
                  <Select.Option value="合作社">合作社</Select.Option>
                  <Select.Option value="民办非企业单位">民办非企业单位</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                  <Select.Option value="__EMPTY__">-</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="所属分局" className="mb-2">
                <Input
                  placeholder="请输入所属分局"
                  value={searchQueryParams.taxBureau?.[0] || ''}
                  onChange={e =>
                    setSearchQueryParams({ 
                      ...searchQueryParams, 
                      taxBureau: e.target.value ? [e.target.value] : []
                    })
                  }
                  className="w-full"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="归属地" className="mb-2">
                <Select
                  mode="multiple"
                  placeholder="请选择归属地"
                  value={searchQueryParams.location}
                  onChange={value => setSearchQueryParams({ ...searchQueryParams, location: value })}
                  allowClear
                  className="w-full"
                  maxTagCount="responsive"
                  options={LOCATION_OPTIONS}
                />
              </Form.Item>

              <Form.Item label="行业大类" className="mb-2">
                <Input
                  placeholder="请输入行业大类"
                  value={searchQueryParams.industryCategory?.[0] || ''}
                  onChange={e =>
                    setSearchQueryParams({ 
                      ...searchQueryParams, 
                      industryCategory: e.target.value ? [e.target.value] : []
                    })
                  }
                  className="w-full"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="工商状态" className="mb-2">
                <Select
                  mode="multiple"
                  placeholder="请选择工商状态"
                  value={searchQueryParams.enterpriseStatus}
                  onChange={value => setSearchQueryParams({ ...searchQueryParams, enterpriseStatus: value })}
                  allowClear
                  className="w-full"
                  maxTagCount="responsive"
                  options={[
                    ...Object.entries(ENTERPRISE_STATUS_MAP).map(([value, label]) => ({
                      value,
                      label,
                    })),
                    { value: '__EMPTY__', label: '-' },
                  ]}
                />
              </Form.Item>

              <Form.Item label="税务状态" className="mb-2">
                <Select
                  mode="multiple"
                  placeholder="请选择税务状态"
                  value={searchQueryParams.businessStatus}
                  onChange={value => setSearchQueryParams({ ...searchQueryParams, businessStatus: value })}
                  allowClear
                  className="w-full"
                  maxTagCount="responsive"
                  options={[
                    ...Object.entries(BUSINESS_STATUS_MAP).map(([value, label]) => ({
                      value,
                      label,
                    })),
                    { value: '__EMPTY__', label: '-' },
                  ]}
                />
              </Form.Item>

              <Form.Item label="创建日期" className="mb-2">
                <DatePicker.RangePicker
                  placeholder={['开始日期', '结束日期']}
                  value={searchQueryParams.dateRange}
                  onChange={dates => {
                    setSearchQueryParams({
                      ...searchQueryParams,
                      dateRange: dates,
                      // 同时更新startDate和endDate以保持兼容性
                      startDate: dates && dates[0] ? dates[0].format('YYYY-MM-DD') : '',
                      endDate: dates && dates[1] ? dates[1].format('YYYY-MM-DD') : '',
                    })
                  }}
                  className="w-60"
                />
              </Form.Item>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-between items-center">
              <div className="flex flex-wrap gap-2">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetSearch}
                  className="w-full sm:w-auto"
                >
                  重置
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {canCreateCustomer && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    className="w-full sm:w-auto"
                  >
                    添加客户
                  </Button>
                )}
                <Button
                  type="default"
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  className="w-full sm:w-auto"
                >
                  导出
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      type="default"
                      icon={<UploadOutlined />}
                      onClick={handleImportClick}
                      className="w-full sm:w-auto"
                    >
                      导入
                    </Button>
                    <input
                      id="hidden-import-input"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </>
                )}
                {isAdmin && (
                  <Upload showUploadList={false} beforeUpload={beforeUpdate} accept=".xlsx,.xls,.csv">
                    <Button type="default" icon={<FileExcelOutlined />} className="w-full sm:w-auto">
                      批量替换
                    </Button>
                  </Upload>
                )}
              </div>
            </div>
          </div>
        </Form>
      </div>

      {/* 数据表格 */}
      <ResizableTable
        columns={resizableColumns}
        dataSource={customers}
        rowKey="id"
        tableKey="customers-table"
        pagination={
          <Pagination
            total={total}
            current={current}
            pageSize={10}
            showSizeChanger={false}
            showQuickJumper={true}
            showTotal={total => `共 ${total} 条记录`}
            onChange={(page) => {
              setCurrent(page)
            }}
            size={isMobile ? 'small' : 'default'}
            simple={isMobile}
          />
        }
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        size={isMobile ? 'small' : 'middle'}
        sticky={{ offsetHeader: 0 }}
        className="customer-table"
      />

      {/* 客户详情抽屉（移动端） */}
      <Drawer
        title={
          detailType === 'add'
            ? '添加客户'
            : detailType === 'edit'
            ? '编辑客户'
            : `客户详情 - ${currentCustomer?.companyName || ''}`
        }
        placement="right"
        onClose={handleCloseDrawer}
        open={drawerVisible}
        width="100%"
        destroyOnClose
      >
        {detailType === 'view' ? (
          customerDetail || currentCustomer ? (
            <CustomerDetail
              customer={customerDetail || currentCustomer!}
              onClose={() => setDrawerVisible(false)}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <LoadingOutlined style={{ fontSize: 24 }} spin />
              <p>加载中...</p>
            </div>
          )
        ) : (
          <CustomerForm
            customer={currentCustomer}
            mode={detailType}
            onSuccess={isAutoSave => handleSaveSuccess(isAutoSave, currentCustomer?.id)}
            onCancel={() => setDrawerVisible(false)}
          />
        )}
      </Drawer>

      {/* 客户详情模态框（桌面端） */}
      <Modal
        title={
          detailType === 'add'
            ? '添加客户'
            : detailType === 'edit'
            ? '编辑客户'
            : `客户详情 - ${currentCustomer?.companyName || ''}`
        }
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={1200}
        style={{ top: 20 }}
        destroyOnClose
      >
        {detailType === 'view' ? (
          customerDetail || currentCustomer ? (
            <CustomerDetail
              customer={customerDetail || currentCustomer!}
              onClose={() => setModalVisible(false)}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <LoadingOutlined style={{ fontSize: 24 }} spin />
              <p>加载中...</p>
            </div>
          )
        ) : (
          <CustomerForm
            customer={currentCustomer}
            mode={detailType}
            onSuccess={isAutoSave => handleSaveSuccess(isAutoSave, currentCustomer?.id)}
            onCancel={() => setModalVisible(false)}
          />
        )}
      </Modal>
    </div>
  )
}

// 客户详情组件
const CustomerDetail = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => {
  const [isMobile, setIsMobile] = useState(false)
  const [imagePreview, setImagePreview] = useState<{ visible: boolean; url: string }>({
    visible: false,
    url: '',
  })
  const [filePreview, setFilePreview] = useState<{ visible: boolean; url: string; fileName: string }>({
    visible: false,
    url: '',
    fileName: '',
  })

  // 获取客户的宗族详情（如果有clanId）
  const customerClanId = customer?.clanId
  const { clan: customerClan } = useClanDetail(customerClanId)

  // 凭证记录相关hooks
  const { exportToExcel, loading: exportLoading } = useVoucherRecordActions()
  const { canExport: _canExport } = useVoucherPermission()

  const [activeTabKey, setActiveTabKey] = useState(
    usePageStates.getState().getState('customerDetailTab') || 'basic'
  )

  // 使用深拷贝防止引用问题
  const [currentCustomerDetail, setCurrentCustomerDetail] = useState<Customer>(() => {
    // 确保创建一个包含所有必要字段的初始对象
    return {
      ...customer,
      // 确保图片对象初始化为空对象而不是undefined
      legalPersonIdImages: customer.legalPersonIdImages || {},
      legalPersonIdImagesWithId: customer.legalPersonIdImagesWithId || {},
      businessLicenseImages: customer.businessLicenseImages || {},
      bankAccountLicenseImages: customer.bankAccountLicenseImages || {},
      otherIdImages: customer.otherIdImages || {},
      supplementaryImages: customer.supplementaryImages || {},
      // 初始化宗族信息
      clan: customer.clan,
    }
  })

  // 当宗族数据更新时，合并到客户详情中
  useEffect(() => {
    if (customerClan) {
      setCurrentCustomerDetail(prev => ({
        ...prev,
        clan: customerClan,
      }))
    }
  }, [customerClan])

  // 记录重试次数
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  // 重试逻辑
  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      // 触发SWR重新验证
      mutate(`/customer/${customer.id}`)
    }
  }, [customer.id, retryCount])

  // 优化useSWR配置，防止过早或不必要的请求
  const { data, isLoading } = useSWR(
    customer?.id ? `/customer/${customer.id}` : null,
    () => (customer?.id ? getCustomerDetail(customer.id) : null),
    {
      revalidateOnFocus: false, // 改为false，避免焦点变化触发刷新
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // 增加去重间隔，防止频繁请求
      revalidateIfStale: true,
      shouldRetryOnError: true,
      refreshInterval: 0,
      onSuccess: response => {
        if (response && response.code === 0 && response.data) {
          // 确保正确处理图片字段
          const processedData = {
            ...response.data,
            legalPersonIdImages: response.data.legalPersonIdImages || {},
            legalPersonIdImagesWithId: response.data.legalPersonIdImagesWithId || {},
            businessLicenseImages: response.data.businessLicenseImages || {},
            bankAccountLicenseImages: response.data.bankAccountLicenseImages || {},
            otherIdImages: response.data.otherIdImages || {},
            supplementaryImages: response.data.supplementaryImages || {},
          }

          // SWR获取到客户详情数据，合并宗族信息
          setCurrentCustomerDetail(prev => ({
            ...processedData,
            clan: prev.clan || processedData.clan, // 保留之前的宗族信息或使用新的宗族信息
          }))
          setRetryCount(0)
        }
      },
      onError: err => {
        console.error('获取客户详情失败:', err)
        if (retryCount < maxRetries) {
          const retryDelay = Math.pow(2, retryCount) * 1000
          // 使用 promise 和 requestAnimationFrame 代替 setTimeout
          const delay = (ms: number) =>
            new Promise(resolve => {
              const startTime = performance.now()
              const checkTime = () => {
                const elapsed = performance.now() - startTime
                if (elapsed >= ms) {
                  resolve(undefined)
                } else {
                  requestAnimationFrame(checkTime)
                }
              }
              requestAnimationFrame(checkTime)
            })

          delay(retryDelay).then(handleRetry)
        }
      },
    }
  )

  // 修改fetchedCustomerDetail的处理，确保数据结构正确
  const fetchedCustomerDetail = useMemo(() => {
    if (!data || data.code !== 0 || !data.data) return null

    // 确保返回的对象包含所有必要字段
    return {
      ...data.data,
      // 确保图片对象始终为对象而不是undefined
      legalPersonIdImages: data.data.legalPersonIdImages || {},
      legalPersonIdImagesWithId: data.data.legalPersonIdImagesWithId || {},
      businessLicenseImages: data.data.businessLicenseImages || {},
      bankAccountLicenseImages: data.data.bankAccountLicenseImages || {},
      otherIdImages: data.data.otherIdImages || {},
      supplementaryImages: data.data.supplementaryImages || {},
    }
  }, [data])

  // 如果获取到了新数据，更新当前显示的客户详情
  useEffect(() => {
    if (fetchedCustomerDetail && Object.keys(fetchedCustomerDetail).length > 0) {
      setCurrentCustomerDetail(prev => ({
        ...fetchedCustomerDetail,
        clan: prev.clan || fetchedCustomerDetail.clan, // 保留之前的宗族信息
      }))
    }
  }, [fetchedCustomerDetail])

  // 保证在组件挂载时至少有初始数据可用
  useEffect(() => {
    if (customer && Object.keys(customer).length > 0) {
      setCurrentCustomerDetail(prev => ({
        ...customer,
        clan: prev?.clan || customer.clan, // 保留之前的宗族信息
      }))
    }
  }, [customer])

  const handleTabChange = (key: string) => {
    setActiveTabKey(key)
    // Save tab state
    usePageStates.getState().setState('customerDetailTab', key)
    // Save scroll position
    usePageStates
      .getState()
      .setState('customerDetailScrollPosition', document.documentElement.scrollTop)
  }

  useEffect(() => {
    // Restore scroll position when tab changes
    const scrollPosition = usePageStates.getState().getState('customerDetailScrollPosition')
    if (scrollPosition) {
      window.scrollTo(0, scrollPosition)
    }
  }, [activeTabKey])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const formatDate = (
    dateString: string | null | undefined,
    includeTime = true,
    fieldType?: string
  ) => {
    if (!dateString) {
      // 当日期为空时，如果是营业执照到期日期字段，返回"无固定期限"
      if (fieldType === 'licenseExpiryDate') {
        return '无固定期限'
      }
      return '-'
    }

    // 如果是营业执照到期日期且值为 9999-12-31，则显示为"无固定期限"
    if (fieldType === 'licenseExpiryDate' && dateString === '9999-12-31') {
      return '无固定期限'
    }

    try {
      if (includeTime) {
        return dayjs.utc(dateString).local().format('YYYY/MM/DD HH:mm')
      }
      return dayjs.utc(dateString).local().format('YYYY/MM/DD')
    } catch {
      return dateString || '-'
    }
  }

  // 格式化状态显示
  const formatStatus = (status: string | null, type: 'business' | 'enterprise') => {
    if (!status) return <Tag color="default">未设置</Tag>

    if (type === 'business') {
      const color =
        BUSINESS_STATUS_COLOR_MAP[status as keyof typeof BUSINESS_STATUS_COLOR_MAP] || 'default'
      const label = BUSINESS_STATUS_MAP[status as keyof typeof BUSINESS_STATUS_MAP] || status
      return <Tag color={color}>{label}</Tag>
    } else {
      const color =
        ENTERPRISE_STATUS_COLOR_MAP[status as keyof typeof ENTERPRISE_STATUS_COLOR_MAP] || 'default'
      const label = ENTERPRISE_STATUS_MAP[status as keyof typeof ENTERPRISE_STATUS_MAP] || status
      return <Tag color={color}>{label}</Tag>
    }
  }

  // 定义文件类型图标映射
  const FILE_ICONS: Record<string, React.ReactNode> = {
    pdf: <FilePdfOutlined />,
    doc: <FileWordOutlined />,
    docx: <FileWordOutlined />,
    xls: <FileExcelOutlined />,
    xlsx: <FileExcelOutlined />,
    csv: <FileTextOutlined />,
    jpg: <FileJpgOutlined />,
    jpeg: <FileJpgOutlined />,
    png: <FileImageOutlined />,
    gif: <FileImageOutlined />,
    bmp: <FileImageOutlined />,
    webp: <FileImageOutlined />,
    txt: <FileTextOutlined />,
    default: <FileOutlined />,
  }

  // 判断文件类型
  const getFileType = (fileName: string): string => {
    if (!fileName) return 'default'
    const extension = fileName.split('.').pop()?.toLowerCase() || 'default'
    return FILE_ICONS[extension] ? extension : 'default'
  }

  // 判断是否为图片
  const checkIsImage = (fileName: string): boolean => {
    if (!fileName) return false
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    return imageExtensions.includes(extension)
  }

  // 获取文件图标
  const getFileIcon = (fileName: string) => {
    const fileType = getFileType(fileName)
    return FILE_ICONS[fileType] || FILE_ICONS.default
  }

  // 获取文件扩展名
  const getFileExtension = (fileName: string) => {
    if (!fileName) return ''
    return fileName.split('.').pop()?.toUpperCase() || ''
  }

  // 渲染单张文件（图片或其他文件）
  const renderImage = (image: ImageType | ImageTypeWithRemarks | undefined, label: string) => {
    if (!image || !image.url) {
      return <div className="no-image-placeholder">暂无文件</div>
    }

    try {
      // 使用fileName构建完整URL
      const fileUrl = image.fileName ? buildImageUrl(image.fileName) : image.url || ''

      // 确保URL是有效的
      if (!fileUrl || fileUrl === 'undefined' || fileUrl === 'null') {
        return <div className="no-image-placeholder">文件链接无效</div>
      }

      // 检查是否为图片文件
      const isImage = image.fileName ? checkIsImage(image.fileName) : true // 兼容旧数据，默认当作图片处理

      if (isImage) {
        // 图片文件 - 显示图片预览
        const handlePreviewClick = (e: React.MouseEvent) => {
          // 如果点击的是已经加载失败的图片（有opacity-60类），不执行预览
          const targetElement = e.target as HTMLElement
          const imgElement =
            targetElement.tagName === 'IMG' ? targetElement : targetElement.querySelector('img')
          if (imgElement && imgElement.classList.contains('opacity-60')) {
            return
          }

          setImagePreview({ visible: true, url: fileUrl })
        }

        // 检查是否有备注
        const hasRemarks = 'remarks' in image && image.remarks?.trim()

        return (
          <div className="customer-image-container">
            <div className="customer-image-preview cursor-pointer" onClick={handlePreviewClick}>
              <img
                src={fileUrl}
                alt={label}
                className="w-full h-24 object-cover rounded-md border border-gray-200"
                onError={e => {
                  ;(e.target as HTMLImageElement).onerror = null
                  ;(e.target as HTMLImageElement).src = '/images/image-placeholder.svg'
                  ;(e.target as HTMLImageElement).className =
                    'w-full h-24 object-contain rounded-md opacity-60 border border-gray-200'
                  ;(e.target as HTMLImageElement).style.cursor = 'not-allowed'
                }}
              />
            </div>
            {hasRemarks && (
              <div className="image-remarks mt-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border">
                <span className="font-medium">备注：</span>
                {(image as ImageTypeWithRemarks).remarks}
              </div>
            )}
          </div>
        )
      } else {
        // 非图片文件 - 显示文件图标和下载功能
        const handleDownloadClick = () => {
          window.open(fileUrl, '_blank')
        }

        return (
          <div
            className="customer-file-preview cursor-pointer border border-gray-200 rounded-md p-4 h-24 flex flex-col items-center justify-center hover:border-blue-500 hover:shadow-md transition-all"
            onClick={handleDownloadClick}
          >
            <div className="text-2xl mb-1 text-gray-600">
              {image.fileName ? getFileIcon(image.fileName) : <FileOutlined />}
            </div>
            <div className="text-xs text-gray-500 text-center">
              {image.fileName ? getFileExtension(image.fileName) : '文件'}
            </div>
            <div className="text-xs text-blue-500 mt-1">点击下载</div>
          </div>
        )
      }
    } catch (err) {
      console.error('渲染文件出错:', err)
      return <div className="no-image-placeholder">文件处理异常</div>
    }
  }

  // 渲染文件集合
  const renderImages = (images: Record<string, ImageType> | undefined) => {
    if (!images || Object.keys(images).length === 0) {
      return <div className="no-image-placeholder">暂无文件</div>
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(images).map(([key, image]) => (
          <div key={key} className="mb-2">
            <div className="mb-1">{image.fileName || key}</div>
            {renderImage(image, key)}
          </div>
        ))}
      </div>
    )
  }

  // 在验证displayCustomer之前，确保对象结构完整
  const displayCustomer = useMemo(() => {
    // 如果currentCustomerDetail是完整的客户对象
    if (currentCustomerDetail && typeof currentCustomerDetail.companyName === 'string') {
      return currentCustomerDetail as Customer
    }

    // 如果是API响应对象，尝试提取data部分
    if (
      currentCustomerDetail &&
      typeof currentCustomerDetail === 'object' &&
      'code' in currentCustomerDetail &&
      'data' in currentCustomerDetail &&
      currentCustomerDetail.data
    ) {
      const data = currentCustomerDetail.data as Customer
      return {
        ...data,
        legalPersonIdImages: data.legalPersonIdImages || {},
        legalPersonIdImagesWithId: data.legalPersonIdImagesWithId || {},
        businessLicenseImages: data.businessLicenseImages || {},
        bankAccountLicenseImages: data.bankAccountLicenseImages || {},
        otherIdImages: data.otherIdImages || {},
        supplementaryImages: data.supplementaryImages || {},
      } as Customer
    }

    // 如果客户对象不完整，使用原始customer
    return {
      ...customer,
      legalPersonIdImages: customer.legalPersonIdImages || {},
      legalPersonIdImagesWithId: customer.legalPersonIdImagesWithId || {},
      businessLicenseImages: customer.businessLicenseImages || {},
      bankAccountLicenseImages: customer.bankAccountLicenseImages || {},
      otherIdImages: customer.otherIdImages || {},
      supplementaryImages: customer.supplementaryImages || {},
    } as Customer
  }, [currentCustomerDetail, customer])

  // 改进验证逻辑，多检查一些关键字段
  if (
    !displayCustomer ||
    typeof displayCustomer !== 'object' ||
    typeof displayCustomer.companyName !== 'string' ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((displayCustomer as any).code !== undefined && (displayCustomer as any).data === undefined)
  ) {
    console.error('CustomerDetail: 客户数据无效', displayCustomer)
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="mb-4 text-red-500 text-lg">数据加载异常</div>
        <Button type="primary" onClick={() => window.location.reload()}>
          刷新页面
        </Button>
      </div>
    )
  }

  // 渲染附件中的文件
  const renderAttachmentImages = (images: Record<string, ImageType>, isMobile: boolean) => {
    if (!images || typeof images !== 'object' || Object.keys(images).length === 0) {
      return <div className="text-gray-500">无附件</div>
    }

    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(images).map(([key, img], index) => {
          const fileData = img as ImageType
          const fileUrl = fileData.url || '#'

          // 检查是否为图片文件
          const isImage = fileData.fileName ? checkIsImage(fileData.fileName) : true // 兼容旧数据

          if (isImage) {
            // 图片文件 - 使用 Image 组件预览
            return (
              <div key={index} className="mb-2 flex flex-col items-center">
                <div className="relative group">
                  <Image
                    src={fileUrl}
                    alt={key}
                    width={isMobile ? 80 : 100}
                    height={isMobile ? 80 : 100}
                    className="object-cover rounded border border-gray-200"
                    style={{ objectFit: 'cover' }}
                    fallback="/images/image-placeholder.svg"
                    preview={{
                      src: fileUrl,
                      mask: <div className="text-white">预览</div>,
                    }}
                  />
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 mt-1 hover:underline truncate w-full text-center"
                >
                  {fileData.fileName || key}
                </a>
              </div>
            )
          } else {
            // 非图片文件 - 显示文件图标
            return (
              <div key={index} className="mb-2 flex flex-col items-center">
                <div
                  className="relative group cursor-pointer border border-gray-200 rounded p-2 hover:border-blue-500 hover:shadow-md transition-all"
                  style={{ width: isMobile ? 80 : 100, height: isMobile ? 80 : 100 }}
                  onClick={() => window.open(fileUrl, '_blank')}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-xl mb-1 text-gray-600">
                      {fileData.fileName ? getFileIcon(fileData.fileName) : <FileOutlined />}
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {fileData.fileName ? getFileExtension(fileData.fileName) : '文件'}
                    </div>
                  </div>
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 mt-1 hover:underline truncate w-full text-center"
                >
                  {fileData.fileName || key}
                </a>
              </div>
            )
          }
        })}
      </div>
    )
  }

  const tabs: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Descriptions
          bordered
          column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
          size={isMobile ? 'small' : 'default'}
          className={isMobile ? 'text-sm' : ''}
        >
          <Descriptions.Item label="企业名称" span={3}>
            {displayCustomer.companyName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="统一社会信用代码">
            {displayCustomer.unifiedSocialCreditCode || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="客户分级">
            <CustomerLevelDisplay level={displayCustomer.customerLevel} />
          </Descriptions.Item>
          <Descriptions.Item label="税号">{displayCustomer.taxNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="企业类型">
            {displayCustomer.enterpriseType || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="所属分局">{displayCustomer.taxBureau || '-'}</Descriptions.Item>
          <Descriptions.Item label="归属地">{displayCustomer.location || '-'}</Descriptions.Item>
          <Descriptions.Item label="顾问会计">
            {displayCustomer.consultantAccountant || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="记账会计">
            {displayCustomer.bookkeepingAccountant || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="开票员">
            {displayCustomer.invoiceOfficer || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="工商状态">
            {formatStatus(displayCustomer.enterpriseStatus || null, 'enterprise')}
          </Descriptions.Item>
          <Descriptions.Item label="税务状态">
            {formatStatus(displayCustomer.businessStatus || null, 'business')}
          </Descriptions.Item>
          <Descriptions.Item label="注册地址" span={3}>
            {displayCustomer.registeredAddress || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="客户群" span={3}>
            {displayCustomer.customerGroupRemark || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="维护代理端" span={3}>
            {displayCustomer.maintenanceAgentRemark || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="记账软件" span={3}>
            {displayCustomer.accountingSoftwareRemark || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="经营地址" span={3}>
            {displayCustomer.businessAddress || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="老板画像" span={3}>
            {displayCustomer.bossProfile || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="企业画像" span={3}>
            {displayCustomer.enterpriseProfile || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="所属宗族">
            {displayCustomer.clan?.clanName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="同宗企业成员" span={2}>
            {displayCustomer.clan?.memberList && displayCustomer.clan.memberList.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {displayCustomer.clan.memberList.map((member, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    {member}
                  </span>
                ))}
              </div>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="行业大类">
            {displayCustomer.industryCategory || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="行业细分">
            {displayCustomer.industrySubcategory || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="是否有税收优惠">
            {displayCustomer.hasTaxBenefits ? '是' : '否'}
          </Descriptions.Item>
          <Descriptions.Item label="工商公示密码">
            {displayCustomer.businessPublicationPassword || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="营业执照到期日期">
            {formatDate(displayCustomer.licenseExpiryDate, false, 'licenseExpiryDate')}
          </Descriptions.Item>
          <Descriptions.Item label="注册资本">
            {displayCustomer.registeredCapital
              ? `${displayCustomer.registeredCapital.toLocaleString()}万元`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="认缴到期日期">
            {formatDate(displayCustomer.capitalContributionDeadline, false)}
          </Descriptions.Item>
          <Descriptions.Item label="提交人">{displayCustomer.submitter || '-'}</Descriptions.Item>
          <Descriptions.Item label="备注信息" span={3}>
            {displayCustomer.remarks || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatDate(displayCustomer.createTime)}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {formatDate(displayCustomer.updateTime)}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'paid-capital',
      label: '实缴资本',
      children: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">实缴资本</h3>
            <span className="text-lg font-bold">
              {Array.isArray(displayCustomer.paidInCapital)
                ? displayCustomer.paidInCapital.reduce((sum, item) => sum + (item.amount || 0), 0)
                : 0}
              万
            </span>
          </div>

          <Table
            dataSource={
              Array.isArray(displayCustomer.paidInCapital)
                ? displayCustomer.paidInCapital.map((item, index) => ({ ...item, key: index }))
                : []
            }
            pagination={false}
            size={isMobile ? 'small' : 'middle'}
            className="mb-4"
            columns={[
              {
                title: '姓名',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: '出资日期',
                dataIndex: 'contributionDate',
                key: 'contributionDate',
                render: text => formatDate(text, false),
              },
              {
                title: '出资金额',
                dataIndex: 'amount',
                key: 'amount',
                render: amount => `${amount || 0}万`,
              },
              {
                title: '附件',
                dataIndex: 'images',
                key: 'images',
                render: images => renderAttachmentImages(images, isMobile),
              },
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
          </div>

          <Table
            dataSource={
              displayCustomer.administrativeLicense?.map((item, index) => ({
                ...item,
                key: index,
              })) || []
            }
            pagination={false}
            size="small"
            className="mt-4"
            columns={[
              {
                title: '行政许可类型',
                dataIndex: 'licenseType',
                key: 'licenseType',
              },
              {
                title: '行政许可开始日期',
                dataIndex: 'startDate',
                key: 'startDate',
                render: date => formatDate(date, false),
              },
              {
                title: '行政许可到期日期',
                dataIndex: 'expiryDate',
                key: 'expiryDate',
                render: date => formatDate(date, false),
              },
              {
                title: '附件',
                dataIndex: 'images',
                key: 'images',
                render: images => renderAttachmentImages(images, isMobile),
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
          </div>

          <Table
            dataSource={
              Array.isArray(displayCustomer.actualResponsibles)
                ? displayCustomer.actualResponsibles.map((item, index) => ({ ...item, key: index }))
                : []
            }
            pagination={false}
            size={isMobile ? 'small' : 'middle'}
            className="mb-4"
            columns={[
              {
                title: '实际负责人姓名',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: '实际负责人电话',
                dataIndex: 'phone',
                key: 'phone',
              },
            ]}
          />

          <div className="mt-6">
            <h3 className="text-base font-medium mb-2">备注</h3>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 min-h-[80px]">
              {displayCustomer.actualResponsibleRemark || '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'bank',
      label: '银行信息',
      children: (
        <Descriptions
          bordered
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          size={isMobile ? 'small' : 'default'}
          className={isMobile ? 'text-sm' : ''}
        >
          <Descriptions.Item label="对公开户行">
            {displayCustomer.publicBank || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="开户行账号">
            {displayCustomer.bankAccountNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="对公开户时间">
            {formatDate(displayCustomer.publicBankOpeningDate, false)}
          </Descriptions.Item>
          <Descriptions.Item label="网银托管档案号">
            {displayCustomer.onlineBankingArchiveNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="基本存款账户编号">
            {displayCustomer.basicDepositAccountNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="一般户开户行">
            {displayCustomer.generalAccountBank || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="一般户账号">
            {displayCustomer.generalAccountNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="一般户开户时间">
            {formatDate(displayCustomer.generalAccountOpeningDate, false)}
          </Descriptions.Item>
          <Descriptions.Item label="三方协议扣款账户">
            {displayCustomer.tripartiteAgreementAccount || '-'}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'tax',
      label: '税务信息',
      children: (
        <Descriptions
          bordered
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          size={isMobile ? 'small' : 'default'}
          className={isMobile ? 'text-sm' : ''}
        >
          <Descriptions.Item label="报税登录方式">
            {displayCustomer.taxReportLoginMethod || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="税种">{displayCustomer.taxCategories || '-'}</Descriptions.Item>
          <Descriptions.Item label="社保险种">
            {displayCustomer.socialInsuranceTypes || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="参保人员">
            {displayCustomer.insuredPersonnel || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="实名密码">
            {displayCustomer.realNamePassword || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="网报密码">
            {displayCustomer.netReportPassword || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="个税申报人员">
            {displayCustomer.personalIncomeTaxStaff || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="开票软件">
            {displayCustomer.invoicingSoftware || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="开票注意事项" span={2}>
            {displayCustomer.invoicingNotes || '-'}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'personnel',
      label: '人员信息',
      children: (
        <>
          <h3 className="mt-4 mb-2 font-medium">法定代表人</h3>
          <Descriptions
            bordered
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            size={isMobile ? 'small' : 'default'}
            className={isMobile ? 'text-sm' : ''}
          >
            <Descriptions.Item label="姓名">
              {displayCustomer.legalRepresentativeName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {displayCustomer.legalRepresentativePhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话2">
              {displayCustomer.legalRepresentativePhone2 || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              {displayCustomer.legalRepresentativeId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="税务密码">
              {displayCustomer.legalRepresentativeTaxPassword || '-'}
            </Descriptions.Item>
          </Descriptions>

          <h3 className="mt-4 mb-2 font-medium">财务负责人</h3>
          <Descriptions
            bordered
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            size={isMobile ? 'small' : 'default'}
            className={isMobile ? 'text-sm' : ''}
          >
            <Descriptions.Item label="姓名">
              {displayCustomer.financialContactName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {displayCustomer.financialContactPhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              {displayCustomer.financialContactId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="税务密码">
              {displayCustomer.financialContactTaxPassword || '-'}
            </Descriptions.Item>
          </Descriptions>

          <h3 className="mt-4 mb-2 font-medium">办税员</h3>
          <Descriptions
            bordered
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            size={isMobile ? 'small' : 'default'}
            className={isMobile ? 'text-sm' : ''}
          >
            <Descriptions.Item label="姓名">
              {displayCustomer.taxOfficerName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {displayCustomer.taxOfficerPhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              {displayCustomer.taxOfficerId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="税务密码">
              {displayCustomer.taxOfficerTaxPassword || '-'}
            </Descriptions.Item>
          </Descriptions>

          <h3 className="mt-4 mb-2 font-medium">开票员</h3>
          <Descriptions
            bordered
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            size={isMobile ? 'small' : 'default'}
            className={isMobile ? 'text-sm' : ''}
          >
            <Descriptions.Item label="姓名">
              {displayCustomer.invoiceOfficerName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {displayCustomer.invoiceOfficerPhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              {displayCustomer.invoiceOfficerId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="税务密码">
              {displayCustomer.invoiceOfficerTaxPassword || '-'}
            </Descriptions.Item>
          </Descriptions>
        </>
      ),
    },
    {
      key: 'archive',
      label: '档案存放信息',
      children: (
        <div className="space-y-6">
          <Descriptions
            bordered
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            size={isMobile ? 'small' : 'default'}
            className={isMobile ? 'text-sm' : ''}
          >
            <Descriptions.Item label="印章存放档案编号">
              {displayCustomer.sealStorageNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="纸质资料档案编号">
              {displayCustomer.paperArchiveNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="网银托管存放编号">
              {displayCustomer.onlineBankingStorageNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="档案存放备注" span={2}>
              {displayCustomer.archiveStorageRemarks || '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* 凭证存放记录 */}
          {displayCustomer.id && (
            <div>
              <div className="mb-4">
                <h3 className="text-base font-medium text-gray-800 mb-2 flex items-center">
                  <span className="w-1 h-4 bg-blue-500 rounded-sm mr-2"></span>
                  凭证存放记录
                </h3>
              </div>
              <VoucherRecordReadOnly
                customerId={displayCustomer.id}
                exportLoading={exportLoading}
                onExport={async (customerId, year) => {
                  try {
                    const exportData: ExportVoucherRecordDto = {
                      year: year,
                      format: 'excel',
                      includeMonthDetails: true,
                      customerIds: [customerId],
                    }

                    await exportToExcel(exportData)
                  } catch (error) {
                    console.error('导出失败:', error)
                  }
                }}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'images',
      label: '档案资料',
      children: (
        <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
          <div>
            <h3 className="font-medium mb-2">法人身份证照片</h3>
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
              <div>
                <div className="mb-1">身份证正面</div>
                {renderImage(displayCustomer.legalPersonIdImages?.front, '身份证正面')}
              </div>
              <div>
                <div className="mb-1">身份证反面</div>
                {renderImage(displayCustomer.legalPersonIdImages?.back, '身份证反面')}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">营业执照照片</h3>
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
              <div>
                <div className="mb-1">营业执照</div>
                {renderImage(displayCustomer.businessLicenseImages?.main, '营业执照')}
              </div>
              <div>
                <div className="mb-1">营业执照副本</div>
                {renderImage(displayCustomer.businessLicenseImages?.copy, '营业执照副本')}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">开户许可证照片</h3>
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
              <div>
                <div className="mb-1">基本户开户许可证</div>
                {renderImage(displayCustomer.bankAccountLicenseImages?.basic, '基本户开户许可证')}
              </div>
              <div>
                <div className="mb-1">一般户开户许可证</div>
                {renderImage(displayCustomer.bankAccountLicenseImages?.general, '一般户开户许可证')}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">法人手持身份证照片</h3>
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-6'}`}>
              <div>
                <div className="mb-1">法人手持身份证</div>
                {renderImage(displayCustomer.legalPersonIdImagesWithId?.holdingIdCard, '法人手持身份证')}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">其他人员身份证资料</h3>
            {renderImages(displayCustomer.otherIdImages)}
          </div>

          <div>
            <h3 className="font-medium mb-2">补充资料文件</h3>
            {renderImages(displayCustomer.supplementaryImages)}
          </div>
        </div>
      ),
    },
    {
      key: 'expense',
      label: '费用记录',
      children: (
        <div className="space-y-6">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-800 mb-2 flex items-center">
              <span className="w-1 h-4 bg-blue-500 rounded-sm mr-2"></span>
              费用记录
            </h3>
          </div>
          <ExpenseRecords customerId={displayCustomer.id} companyName={displayCustomer.companyName} />
        </div>
      ),
    },
    {
      key: 'followup',
      label: '跟进记录',
      children: (
        <div className="space-y-6">
          <FollowUpRecords 
            records={displayCustomer.followUpRecords || []}
            readonly={true}
            title="客户跟进记录"
          />
        </div>
      ),
    },
    {
      key: 'accounting-files',
      label: '做账所需资料',
      children: (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-700">
              客户上传的做账所需资料文件列表
            </p>
          </div>
          
          {displayCustomer.accountingRequiredFiles && displayCustomer.accountingRequiredFiles.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold">已上传的文件 ({displayCustomer.accountingRequiredFiles.length})</h3>
              <div className="space-y-2">
                {displayCustomer.accountingRequiredFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-lg text-gray-600">
                        {file.fileName ? getFileIcon(file.fileName) : <FileOutlined />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.categoryPath && (
                            <span className="text-xs text-gray-500 mr-1">
                              {file.categoryPath} /
                            </span>
                          )}
                          {file.fileName || `文件 ${index + 1}`}
                        </p>
                        {file.uploadTime && (
                          <p className="text-xs text-gray-500 mt-1">
                            上传时间: {formatDate(file.uploadTime)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {file.url && (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => {
                            setFilePreview({
                              visible: true,
                              url: file.url || '',
                              fileName: file.fileName || `文件 ${index + 1}`,
                            })
                          }}
                        >
                          查看
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">暂无上传的文件</p>
            </div>
          )}
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingOutlined style={{ fontSize: 48 }} />
        <span className="ml-3 text-lg">加载客户详情...</span>
      </div>
    )
  }

  return (
    <div className="customer-detail-container">
      <div className="customer-detail-scroll-container">
        <Tabs
          defaultActiveKey="basic"
          items={tabs}
          className="customer-detail-tabs"
          activeKey={activeTabKey}
          onChange={handleTabChange}
          size={isMobile ? 'small' : 'middle'}
          tabBarGutter={isMobile ? 12 : 24}
          tabBarStyle={isMobile ? { margin: '0 -12px 16px -12px', paddingLeft: '12px' } : undefined}
        />

        {/* 图片预览组件 */}
        <Image
          width={0}
          style={{ display: 'none' }}
          src={imagePreview.url}
          preview={{
            visible: imagePreview.visible,
            src: imagePreview.url,
            onVisibleChange: visible => {
              setImagePreview(prev => ({ ...prev, visible }))
            },
          }}
        />

        {/* 文件预览弹窗 */}
        <Modal
          title={`查看文件 - ${filePreview.fileName}`}
          open={filePreview.visible}
          onCancel={() => setFilePreview(prev => ({ ...prev, visible: false }))}
          footer={[
            <Button key="close" onClick={() => setFilePreview(prev => ({ ...prev, visible: false }))}>
              关闭
            </Button>,
            <Button key="download" type="primary" onClick={() => window.open(filePreview.url, '_blank')}>
              下载
            </Button>,
          ]}
          width={800}
          style={{ maxHeight: '80vh' }}
        >
          <div style={{ textAlign: 'center', maxHeight: '60vh', overflow: 'auto' }}>
            {filePreview.url && (
              <>
                {/* 检查是否是图片 */}
                {/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filePreview.fileName) ? (
                  <img
                    src={filePreview.url}
                    alt={filePreview.fileName}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <FileOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
                    <p style={{ marginTop: 16, color: '#666' }}>
                      该文件类型不支持在线预览
                    </p>
                    <p style={{ color: '#999', fontSize: 12 }}>
                      请点击下载按钮下载文件查看
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      </div>
      <div className="customer-detail-footer">
        <Button onClick={onClose}>关闭</Button>
      </div>
    </div>
  )
}
