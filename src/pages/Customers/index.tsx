import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
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
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  LoadingOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Customer, ImageType } from '../../types'
import type { TabsProps } from 'antd'
import type { UploadProps } from 'antd'
import CustomerForm from './CustomerForm'
import {
  BUSINESS_STATUS_MAP,
  ENTERPRISE_STATUS_MAP,
  BUSINESS_STATUS_COLOR_MAP,
  ENTERPRISE_STATUS_COLOR_MAP,
} from '../../constants'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { usePageStates, PageStatesStore } from '../../store/pageStates'
import { useCustomerList, useCustomerDetail } from '../../hooks/useCustomer'
import { usePermission } from '../../hooks/usePermission'
import { useDebouncedValue } from '../../hooks/useDebounce'
import useSWR, { mutate } from 'swr'
import {
  getCustomerDetail,
  getCustomerById,
  exportCustomerCSV,
  importCustomerExcel,
  updateCustomerExcel,
} from '../../api/customer'
import { deleteFile, buildImageUrl } from '../../utils/upload'

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
  // 使用 pageStates 存储来保持状态
  const getState = usePageStates((state: PageStatesStore) => state.getState)
  const setState = usePageStates((state: PageStatesStore) => state.setState)

  // 获取权限相关信息
  const { customerPermissions, loading: permissionLoading, refreshPermissions } = usePermission()

  // 从 pageStates 恢复搜索参数
  const savedSearchParams = getState('customersSearchParams')
  const savedPagination = getState('customersPagination')

  const [current, setCurrent] = useState(savedPagination?.current || 1)
  const [pageSize, setPageSize] = useState(savedPagination?.pageSize || 10)
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    unifiedSocialCreditCode: '',
    customerLevel: '',
    consultantAccountant: '',
    bookkeepingAccountant: '',
    taxBureau: '',
    enterpriseType: '',
    industryCategory: '',
    enterpriseStatus: '',
    businessStatus: '',
    location: '',
    remarks: '',
    startDate: '',
    endDate: '',
    ...(savedSearchParams || {}), // 恢复之前保存的搜索条件
  })
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  const [detailType, setDetailType] = useState<'view' | 'edit' | 'add'>('view')
  const [isMobile, setIsMobile] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>()

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
  const debouncedSearchParams = useDebouncedValue(searchParams, 500)

  // 构建请求参数
  const requestParams = {
    page: current,
    pageSize,
    ...debouncedSearchParams,
  }

  // 使用SWR获取客户列表数据
  const {
    customerList: customers,
    pagination: { total },
    loading: isLoading,
    refreshCustomerList: refreshCustomers,
    deleteCustomer: removeCustomer,
  } = useCustomerList(requestParams)

  // 使用SWR获取客户详情数据
  const {
    customer: customerDetail,
    loading: isDetailLoading,
    refreshCustomerDetail: refreshCustomerDetail,
  } = useCustomerDetail(selectedCustomerId)

  // 当客户详情数据更新时，更新当前客户状态
  useEffect(() => {
    if (customerDetail && (detailType === 'view' || detailType === 'edit')) {
      // 更新当前客户信息，确保图片字段正确保留
      setCurrentCustomer(customerDetail)
    }
  }, [customerDetail, detailType])

  // 当搜索参数变化时，保存到 pageStates
  useEffect(() => {
    setState('customersSearchParams', searchParams)
  }, [searchParams, setState])

  // 当分页参数变化时，保存到 pageStates
  useEffect(() => {
    setState('customersPagination', { current, pageSize })
  }, [current, pageSize, setState])

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

  const handleSearch = () => {
    setCurrent(1) // 重置到第一页
    // SWR会自动触发新请求
  }

  // 当搜索参数变化时，自动重置到第一页（仅当不是初始加载时）
  useEffect(() => {
    if (current !== 1) {
      setCurrent(1)
    }
  }, [
    searchParams.keyword,
    searchParams.unifiedSocialCreditCode,
    searchParams.consultantAccountant,
    searchParams.bookkeepingAccountant,
    searchParams.taxBureau,
    searchParams.enterpriseType,
    searchParams.industryCategory,
    searchParams.enterpriseStatus,
    searchParams.businessStatus,
    searchParams.location,
    searchParams.startDate,
    searchParams.endDate,
  ])

  const resetSearch = () => {
    setSearchParams({
      keyword: '',
      unifiedSocialCreditCode: '',
      customerLevel: '',
      consultantAccountant: '',
      bookkeepingAccountant: '',
      taxBureau: '',
      enterpriseType: '',
      industryCategory: '',
      enterpriseStatus: '',
      businessStatus: '',
      location: '',
      remarks: '',
      startDate: '',
      endDate: '',
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
    isMobile ? setDrawerVisible(true) : setModalVisible(true)
  }

  const handleView = (record: Customer) => {
    // 先清除可能存在的缓存，关键步骤!
    mutate(`/customer/${record.id}`, undefined, { revalidate: false })

    // 只使用基本信息初始化
    setCurrentCustomer({
      ...record,
      // 确保图片对象初始化为空对象而不是undefined
      legalPersonIdImages: record.legalPersonIdImages || {},
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
      isMobile ? setDrawerVisible(true) : setModalVisible(true)
    })
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
      let deletedCount = 0

      // 提取所有图片文件名准备删除
      const imagesToDelete: string[] = []

      // 处理对象格式的图片字段 {key: {fileName, url}}
      const processObjectImages = (imagesObj: Record<string, any> | undefined) => {
        if (!imagesObj) return

        Object.values(imagesObj).forEach(item => {
          if (item && typeof item === 'object' && item.fileName) {
            imagesToDelete.push(item.fileName)
          }
        })
      }

      // 处理字符串形式的图片URL {key: string}
      const processStringImages = (imagesObj: Record<string, any> | undefined) => {
        if (!imagesObj) return

        Object.values(imagesObj).forEach(item => {
          if (typeof item === 'string' && item) {
            // 从URL中提取文件名
            const urlParts = item.split('/')
            const fileNameWithParams = urlParts[urlParts.length - 1]
            const fileName = fileNameWithParams.split('?')[0] // 移除查询参数

            if (fileName) {
              imagesToDelete.push(fileName)
            }
          } else if (item && typeof item === 'object' && item.fileName) {
            // 处理ImageType格式
            imagesToDelete.push(item.fileName)
          }
        })
      }

      processObjectImages(customer.legalPersonIdImages)
      processObjectImages(customer.businessLicenseImages)
      processObjectImages(customer.bankAccountLicenseImages)
      processObjectImages(customer.otherIdImages)
      processObjectImages(customer.supplementaryImages)

      // 批量删除图片文件
      for (const fileName of imagesToDelete) {
        try {
          const success = await deleteFile(fileName)
          if (success) {
            deletedCount++
          }
        } catch (error) {
          console.error(`删除图片文件 ${fileName} 失败:`, error)
        }
      }
    } catch (error) {
      console.error('删除客户图片出错:', error)
    }
  }

  const handleDelete = (id: number) => {
    console.log('delete click!')
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
      
      // 使用当前搜索和分页参数导出数据
      // 移除分页大小参数，导出所有匹配条件的数据
      const { pageSize: _, ...exportParams } = requestParams
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
      message.error('导出失败，请稍后重试')
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
            // 创建模态框展示失败记录
            Modal.error({
              title: '部分数据导入失败',
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
            // 全部导入成功
            message.success(data.message)
          }

          // 刷新客户列表
          refreshCustomers()
        } else {
          message.error(data.message || '导入失败')
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
  const beforeUpload = (file: File) => {
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

    // 处理文件上传
    handleImport(file)
    return false // 阻止默认上传行为
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

  const columns: ColumnsType<Customer> = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: isMobile ? 160 : 200,
      fixed: 'left',
      render: text => <EllipsisText text={text || '-'} maxWidth={isMobile ? 140 : 180} />,
    },
    {
      title: '客户分级',
      dataIndex: 'customerLevel',
      key: 'customerLevel',
      width: isMobile ? 120 : 150,
      responsive: ['md'],
      render: text => <EllipsisText text={text || '-'} maxWidth={isMobile ? 100 : 130} />,
    },
    {
      title: '企业类型',
      dataIndex: 'enterpriseType',
      key: 'enterpriseType',
      width: 120,
      responsive: ['lg'],
      render: text => <EllipsisText text={text || '-'} maxWidth={100} />,
    },
    {
      title: '所属分局',
      dataIndex: 'taxBureau',
      key: 'taxBureau',
      width: 150,
      responsive: ['lg'],
      render: text => <EllipsisText text={text || '-'} maxWidth={130} />,
    },
    {
      title: '归属地',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      responsive: ['lg'],
      render: text => <EllipsisText text={text || '-'} maxWidth={130} />,
    },
    {
      title: '实际负责人',
      dataIndex: 'actualResponsibleName',
      key: 'actualResponsibleName',
      width: isMobile ? 100 : 120,
      responsive: ['sm'],
      render: text => <EllipsisText text={text || '-'} maxWidth={isMobile ? 80 : 100} />,
    },
    {
      title: '联系电话',
      dataIndex: 'actualResponsiblePhone',
      key: 'actualResponsiblePhone',
      width: isMobile ? 100 : 120,
      responsive: ['md'],
      render: text => <EllipsisText text={text || '-'} maxWidth={isMobile ? 80 : 100} />,
    },
    {
      title: '工商状态',
      dataIndex: 'enterpriseStatus',
      key: 'enterpriseStatus',
      width: isMobile ? 80 : 100,
      render: (status: string) => {
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
      title: '税务状态',
      dataIndex: 'businessStatus',
      key: 'businessStatus',
      width: isMobile ? 80 : 100,
      render: (status: string) => {
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
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: isMobile ? 130 : 180,
      responsive: ['lg'],
      render: (date: string) => {
        const formattedDate = dayjs.utc(date).local().format('YYYY-MM-DD HH:mm:ss')
        return <EllipsisText text={formattedDate} maxWidth={isMobile ? 110 : 160} />
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: isMobile ? 90 : 150,
      render: (_, record) => (
        <Space size={isMobile ? 'small' : 'middle'} className="flex flex-nowrap">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            className={isMobile ? 'p-1 m-0 h-auto min-w-0' : ''}
          >
            {!isMobile && '查看'}
          </Button>
          {canEditCustomer && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className={isMobile ? 'p-1 m-0 h-auto min-w-0' : ''}
            >
              {!isMobile && '编辑'}
            </Button>
          )}
          {canDeleteCustomer && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              className={isMobile ? 'p-1 m-0 h-auto min-w-0' : ''}
            >
              {!isMobile && '删除'}
            </Button>
          )}
        </Space>
      ),
    },
  ]

  // 处理关闭抽屉
  const handleCloseDrawer = () => {
    if (detailType === 'add' || detailType === 'edit') {
      // 如果表单引用还存在，应该调用它的取消方法（包含图片清理等操作）
      const formElement = document.querySelector('.customer-form')
      if (formElement) {
        // 模拟点击取消按钮
        const cancelButton = formElement.querySelector('.customer-form-footer button')
        if (cancelButton) {
          ;(cancelButton as HTMLButtonElement).click()
          return // 点击取消按钮会触发handleCancel，会自动关闭抽屉
        }
      }
      // 如果找不到取消按钮，也要关闭抽屉
      setDrawerVisible(false)
    } else {
      // 如果不是表单模式，直接关闭
      setDrawerVisible(false)
    }
  }

  // 处理关闭模态框
  const handleCloseModal = () => {
    if (detailType === 'add' || detailType === 'edit') {
      // 如果表单引用还存在，应该调用它的取消方法（包含图片清理等操作）
      const formElement = document.querySelector('.customer-form')
      if (formElement) {
        // 模拟点击取消按钮
        const cancelButton = formElement.querySelector('.customer-form-footer button')
        if (cancelButton) {
          ;(cancelButton as HTMLButtonElement).click()
          return // 点击取消按钮会触发handleCancel，会自动关闭模态框
        }
      }
      // 如果找不到取消按钮，也要关闭模态框
      setModalVisible(false)
    } else {
      // 如果不是表单模式，直接关闭
      setModalVisible(false)
      // 延迟清理状态，避免视觉闪烁
      requestAnimationFrame(() => {
        setCurrentCustomer(null)
        setSelectedCustomerId(undefined)
        // 清除该客户的SWR缓存
        if (customerDetail?.id) {
          mutate(`/customer/${customerDetail.id}`, undefined, { revalidate: false })
        }
      })
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
                  value={searchParams.keyword}
                  onChange={e => setSearchParams({ ...searchParams, keyword: e.target.value })}
                  className="w-40"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="统一社会信用代码" className="mb-2">
                <Input
                  placeholder="请输入统一社会信用代码"
                  value={searchParams.unifiedSocialCreditCode}
                  onChange={e =>
                    setSearchParams({ ...searchParams, unifiedSocialCreditCode: e.target.value })
                  }
                  className="w-40"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="客户分级" className="mb-2">
                <Input
                  placeholder="请输入客户分级"
                  value={searchParams.customerLevel}
                  onChange={e =>
                    setSearchParams({ ...searchParams, customerLevel: e.target.value })
                  }
                  className="w-40"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="顾问会计" className="mb-2">
                <Input
                  placeholder="请输入顾问会计"
                  value={searchParams.consultantAccountant}
                  onChange={e =>
                    setSearchParams({ ...searchParams, consultantAccountant: e.target.value })
                  }
                  className="w-40"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="记账会计" className="mb-2">
                <Input
                  placeholder="请输入记账会计"
                  value={searchParams.bookkeepingAccountant}
                  onChange={e =>
                    setSearchParams({ ...searchParams, bookkeepingAccountant: e.target.value })
                  }
                  className="w-40"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="企业类型" className="mb-2">
                <Input
                  placeholder="请输入企业类型"
                  value={searchParams.enterpriseType}
                  onChange={e =>
                    setSearchParams({ ...searchParams, enterpriseType: e.target.value })
                  }
                  className="w-40"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="所属分局" className="mb-2">
                <Input
                  placeholder="请输入所属分局"
                  value={searchParams.taxBureau}
                  onChange={e => setSearchParams({ ...searchParams, taxBureau: e.target.value })}
                  className="w-40"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="归属地" className="mb-2">
                <Input
                  placeholder="请输入归属地"
                  value={searchParams.location}
                  onChange={e => setSearchParams({ ...searchParams, location: e.target.value })}
                  className="w-40"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="行业大类" className="mb-2">
                <Input
                  placeholder="请输入行业大类"
                  value={searchParams.industryCategory}
                  onChange={e =>
                    setSearchParams({ ...searchParams, industryCategory: e.target.value })
                  }
                  className="w-40"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="工商状态" className="mb-2">
                <Select
                  placeholder="请选择工商状态"
                  value={searchParams.enterpriseStatus || undefined}
                  onChange={value => setSearchParams({ ...searchParams, enterpriseStatus: value })}
                  allowClear
                  className="w-40"
                  options={Object.entries(ENTERPRISE_STATUS_MAP).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Form.Item>

              <Form.Item label="税务状态" className="mb-2">
                <Select
                  placeholder="请选择税务状态"
                  value={searchParams.businessStatus || undefined}
                  onChange={value => setSearchParams({ ...searchParams, businessStatus: value })}
                  allowClear
                  className="w-40"
                  options={Object.entries(BUSINESS_STATUS_MAP).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Form.Item>

              <Form.Item label="开始日期" className="mb-2">
                <DatePicker
                  placeholder="请选择开始日期"
                  value={searchParams.startDate ? dayjs.utc(searchParams.startDate).local() : null}
                  onChange={date =>
                    setSearchParams({
                      ...searchParams,
                      startDate: date ? date.format('YYYY-MM-DD') : '',
                    })
                  }
                  className="w-40"
                />
              </Form.Item>

              <Form.Item label="结束日期" className="mb-2">
                <DatePicker
                  placeholder="请选择结束日期"
                  value={searchParams.endDate ? dayjs.utc(searchParams.endDate).local() : null}
                  onChange={date =>
                    setSearchParams({
                      ...searchParams,
                      endDate: date ? date.format('YYYY-MM-DD') : '',
                    })
                  }
                  className="w-40"
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
                <Upload showUploadList={false} beforeUpload={beforeUpload} accept=".xlsx,.xls,.csv">
                  <Button type="default" icon={<UploadOutlined />} className="w-full sm:w-auto">
                    导入
                  </Button>
                </Upload>
                <Upload showUploadList={false} beforeUpload={beforeUpdate} accept=".xlsx,.xls,.csv">
                  <Button type="default" icon={<FileExcelOutlined />} className="w-full sm:w-auto">
                    批量替换
                  </Button>
                </Upload>
              </div>
            </div>
          </div>
        </Form>
      </div>

      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={customers}
        rowKey="id"
        pagination={{
          total,
          current,
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条记录`,
          onChange: (page, size) => {
            setCurrent(page)
            if (size !== pageSize) {
              setPageSize(size)
            }
          },
          size: isMobile ? 'small' : 'default',
          simple: isMobile,
        }}
        loading={isLoading}
        scroll={{ x: 'max-content' }}
        size={isMobile ? 'small' : 'middle'}
        sticky={{ offsetHeader: 0 }}
        className="customer-table"
      />

      {/* 客户详情抽屉（移动端） */}
      <Drawer
        title={detailType === 'add' ? '添加客户' : detailType === 'edit' ? '编辑客户' : '客户详情'}
        width={isMobile ? '100%' : 900}
        onClose={handleCloseDrawer}
        open={drawerVisible}
        destroyOnClose
        styles={{ body: { padding: isMobile ? '12px 8px' : '16px' } }}
        className="customer-drawer"
        placement={isMobile ? 'bottom' : 'right'}
        height={isMobile ? '90%' : undefined}
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
        title={detailType === 'add' ? '添加客户' : detailType === 'edit' ? '编辑客户' : '客户详情'}
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={isMobile ? '100%' : 1000}
        style={isMobile ? { top: 10, padding: 0 } : undefined}
        styles={
          isMobile
            ? { body: { padding: '12px 8px', maxHeight: 'calc(100vh - 100px)', overflow: 'auto' } }
            : undefined
        }
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
      businessLicenseImages: customer.businessLicenseImages || {},
      bankAccountLicenseImages: customer.bankAccountLicenseImages || {},
      otherIdImages: customer.otherIdImages || {},
      supplementaryImages: customer.supplementaryImages || {},
    }
  })

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
  const { data, isLoading, error } = useSWR(
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
            businessLicenseImages: response.data.businessLicenseImages || {},
            bankAccountLicenseImages: response.data.bankAccountLicenseImages || {},
            otherIdImages: response.data.otherIdImages || {},
            supplementaryImages: response.data.supplementaryImages || {},
          }

          console.log('SWR获取到客户详情数据，已处理:', processedData)
          setCurrentCustomerDetail(processedData)
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
              let startTime = performance.now()
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
      businessLicenseImages: data.data.businessLicenseImages || {},
      bankAccountLicenseImages: data.data.bankAccountLicenseImages || {},
      otherIdImages: data.data.otherIdImages || {},
      supplementaryImages: data.data.supplementaryImages || {},
    }
  }, [data])

  // 如果获取到了新数据，更新当前显示的客户详情
  useEffect(() => {
    if (fetchedCustomerDetail && Object.keys(fetchedCustomerDetail).length > 0) {
      setCurrentCustomerDetail(fetchedCustomerDetail)
    }
  }, [fetchedCustomerDetail])

  // 保证在组件挂载时至少有初始数据可用
  useEffect(() => {
    if (customer && Object.keys(customer).length > 0) {
      setCurrentCustomerDetail(customer)
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
    } catch (e) {
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

  // 渲染单张图片
  const renderImage = (image: ImageType | undefined, label: string) => {
    if (!image || !image.url) {
      return <div className="no-image-placeholder">暂无图片</div>
    }

    try {
      // 使用fileName构建完整URL
      const imageUrl = image.fileName ? buildImageUrl(image.fileName) : image.url || ''

      // 确保URL是有效的
      if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
        return <div className="no-image-placeholder">图片链接无效</div>
      }

      const handlePreviewClick = (e: React.MouseEvent) => {
        // 如果点击的是已经加载失败的图片（有opacity-60类），不执行预览
        const targetElement = e.target as HTMLElement
        const imgElement =
          targetElement.tagName === 'IMG' ? targetElement : targetElement.querySelector('img')
        if (imgElement && imgElement.classList.contains('opacity-60')) {
          return
        }

        setImagePreview({ visible: true, url: imageUrl })
      }

      return (
        <div className="customer-image-preview cursor-pointer" onClick={handlePreviewClick}>
          <img
            src={imageUrl}
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
      )
    } catch (err) {
      console.error('渲染图片出错:', err)
      return <div className="no-image-placeholder">图片处理异常</div>
    }
  }

  // 渲染图片集合
  const renderImages = (images: Record<string, ImageType> | undefined) => {
    if (!images || Object.keys(images).length === 0) {
      return <div className="no-image-placeholder">暂无图片</div>
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(images).map(([key, image]) => (
          <div key={key} className="mb-2">
            <div className="mb-1">{key}</div>
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

  // 渲染附件中的图片
  const renderAttachmentImages = (images: Record<string, ImageType>, isMobile: boolean) => {
    if (!images || typeof images !== 'object' || Object.keys(images).length === 0) {
      return <div className="text-gray-500">无附件</div>
    }

    return (
      <div className="flex flex-wrap gap-2">
        {Object.entries(images).map(([key, img], index) => {
          const imageData = img as ImageType
          const imageUrl = imageData.url || '#'

          return (
            <div key={index} className="mb-2 flex flex-col items-center">
              <div className="relative group">
                <Image
                  src={imageUrl}
                  alt={key}
                  width={isMobile ? 80 : 100}
                  height={isMobile ? 80 : 100}
                  className="object-cover rounded border border-gray-200"
                  style={{ objectFit: 'cover' }}
                  fallback="/images/image-placeholder.svg"
                  preview={{
                    src: imageUrl,
                    mask: <div className="text-white">预览</div>,
                  }}
                />
              </div>
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 mt-1 hover:underline truncate w-full text-center"
              >
                {key}
              </a>
            </div>
          )
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
          title="基本信息"
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
            {displayCustomer.customerLevel || '-'}
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
          <Descriptions.Item label="经营地址" span={3}>
            {displayCustomer.businessAddress || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="老板画像" span={3}>
            {displayCustomer.bossProfile || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="企业画像" span={3}>
            {displayCustomer.enterpriseProfile || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="同宗企业" span={3}>
            {displayCustomer.affiliatedEnterprises || '-'}
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
          <Descriptions.Item label="个税密码">
            {displayCustomer.personalIncomeTaxPassword || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="个税申报人员">
            {displayCustomer.personalIncomeTaxStaff || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="企业信息表编号">
            {displayCustomer.enterpriseInfoSheetNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="章存放编号">
            {displayCustomer.sealStorageNumber || '-'}
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
      key: 'images',
      label: '图片资料',
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
            <h3 className="font-medium mb-2">其他人员身份证照片</h3>
            {renderImages(displayCustomer.otherIdImages)}
          </div>

          <div>
            <h3 className="font-medium mb-2">补充资料照片</h3>
            {renderImages(displayCustomer.supplementaryImages)}
          </div>
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
      </div>
      <div className="customer-detail-footer">
        <Button onClick={onClose}>关闭</Button>
      </div>
    </div>
  )
}
