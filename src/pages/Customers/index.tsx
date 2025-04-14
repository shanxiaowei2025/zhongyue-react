import { useState, useEffect } from 'react'
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
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  LoadingOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Customer } from '../../types'
import type { TabsProps } from 'antd'
import CustomerForm from './CustomerForm'
import { BUSINESS_STATUS_MAP } from '../../constants'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { usePageStates, PageStatesStore } from '../../store/pageStates'
import { useCustomerList, useCustomerDetail } from '../../hooks/useCustomer'
import useSWR from 'swr'
import { getCustomerDetail, getCustomerById } from '../../api/customer'
import { deleteFile } from '../../utils/upload'

// 启用 dayjs 插件
dayjs.extend(utc)
dayjs.extend(timezone)

const { confirm } = Modal

export default function Customers() {
  // 使用 pageStates 存储来保持状态
  const getState = usePageStates((state: PageStatesStore) => state.getState)
  const setState = usePageStates((state: PageStatesStore) => state.setState)

  // 从 pageStates 恢复搜索参数
  const savedSearchParams = getState('customersSearchParams')
  const savedPagination = getState('customersPagination')

  const [current, setCurrent] = useState(savedPagination?.current || 1)
  const [pageSize, setPageSize] = useState(savedPagination?.pageSize || 10)
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    companyName: '',
    taxNumber: '',
    enterpriseType: '',
    taxBureau: '',
    enterpriseStatus: '',
    businessStatus: '',
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

  // 构建请求参数
  const requestParams = {
    page: current,
    pageSize,
    ...searchParams,
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

  const resetSearch = () => {
    setSearchParams({
      keyword: '',
      companyName: '',
      taxNumber: '',
      enterpriseType: '',
      taxBureau: '',
      enterpriseStatus: '',
      businessStatus: '',
      startDate: '',
      endDate: '',
    })
    setCurrent(1)
  }

  const handleAdd = () => {
    setCurrentCustomer(null)
    setSelectedCustomerId(undefined)
    setDetailType('add')
    isMobile ? setDrawerVisible(true) : setModalVisible(true)
  }

  const handleView = (record: Customer) => {
    // 先设置基本信息，保证界面快速响应
    setCurrentCustomer(record)
    setDetailType('view')

    // 确保先设置选中的客户ID再打开对话框，避免重复触发请求
    setSelectedCustomerId(record.id)

    // 打开对话框
    setTimeout(() => {
      isMobile ? setDrawerVisible(true) : setModalVisible(true)
    }, 0)
  }

  const handleEdit = (record: Customer) => {
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

        Object.values(imagesObj).forEach(url => {
          if (typeof url === 'string' && url) {
            // 从URL中提取文件名
            const urlParts = url.split('/')
            const fileNameWithParams = urlParts[urlParts.length - 1]
            const fileName = fileNameWithParams.split('?')[0] // 移除查询参数

            if (fileName) {
              imagesToDelete.push(fileName)
            }
          }
        })
      }

      // 处理各种图片字段
      // 处理法人身份证图片
      processObjectImages(customer.legalPersonIdImages)

      // 处理营业执照图片
      processObjectImages(customer.businessLicenseImages)

      // 处理开户许可证图片
      processObjectImages(customer.bankAccountLicenseImages)

      // 处理其他人员身份证照片
      processStringImages(customer.otherIdImages)

      // 处理补充资料照片
      processStringImages(customer.supplementaryImages)

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

  const columns: ColumnsType<Customer> = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      fixed: 'left',
    },
    {
      title: '税号',
      dataIndex: 'taxNumber',
      key: 'taxNumber',
      width: 150,
    },
    {
      title: '企业类型',
      dataIndex: 'enterpriseType',
      key: 'enterpriseType',
      width: 120,
    },
    {
      title: '所属分局',
      dataIndex: 'taxBureau',
      key: 'taxBureau',
      width: 150,
    },
    {
      title: '实际负责人',
      dataIndex: 'actualResponsibleName',
      key: 'actualResponsibleName',
      width: 120,
    },
    {
      title: '联系电话',
      dataIndex: 'actualResponsiblePhone',
      key: 'actualResponsiblePhone',
      width: 120,
    },
    {
      title: '企业状态',
      dataIndex: 'enterpriseStatus',
      key: 'enterpriseStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '正常' : '停用'}
        </Tag>
      ),
    },
    {
      title: '业务状态',
      dataIndex: 'businessStatus',
      key: 'businessStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={BUSINESS_STATUS_MAP[status as keyof typeof BUSINESS_STATUS_MAP] === '正常' ? 'success' : 'warning'}>
          {BUSINESS_STATUS_MAP[status as keyof typeof BUSINESS_STATUS_MAP]}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
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
    }
    // 如果不是表单模式或无法找到取消按钮，直接关闭
    setDrawerVisible(false)
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
    }
    // 如果不是表单模式或无法找到取消按钮，直接关闭
    setModalVisible(false)
  }

  return (
    <div className="customer-management-container">
      <h1 className="text-2xl font-bold mb-6">客户管理</h1>

      {/* 搜索和操作工具栏 */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="flex flex-wrap gap-2 flex-1">
          <Input
            placeholder="企业名称"
            value={searchParams.keyword}
            onChange={e => setSearchParams({ ...searchParams, keyword: e.target.value })}
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
          />
          <Input
            placeholder="税号"
            value={searchParams.taxNumber}
            onChange={e => setSearchParams({ ...searchParams, taxNumber: e.target.value })}
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
          />
          <Input
            placeholder="企业类型"
            value={searchParams.enterpriseType}
            onChange={e => setSearchParams({ ...searchParams, enterpriseType: e.target.value })}
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
          />
          <Input
            placeholder="所属分局"
            value={searchParams.taxBureau}
            onChange={e => setSearchParams({ ...searchParams, taxBureau: e.target.value })}
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
          />
          <Select
            placeholder="企业状态"
            value={searchParams.enterpriseStatus || undefined}
            onChange={value => setSearchParams({ ...searchParams, enterpriseStatus: value })}
            allowClear
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
            options={[
              { value: 'active', label: '正常经营' },
              { value: 'inactive', label: '停业' },
              { value: 'closed', label: '注销' },
            ]}
          />
          <Select
            placeholder="业务状态"
            value={searchParams.businessStatus || undefined}
            onChange={value => setSearchParams({ ...searchParams, businessStatus: value })}
            allowClear
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
            options={[
              { value: 'normal', label: '正常' },
              { value: 'pending', label: '待处理' },
              { value: 'suspended', label: '暂停' },
            ]}
          />
          <DatePicker
            placeholder="开始日期"
            value={searchParams.startDate ? dayjs.utc(searchParams.startDate) : null}
            onChange={date =>
              setSearchParams({ ...searchParams, startDate: date ? date.format('YYYY-MM-DD') : '' })
            }
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
          />
          <DatePicker
            placeholder="结束日期"
            value={searchParams.endDate ? dayjs.utc(searchParams.endDate) : null}
            onChange={date =>
              setSearchParams({ ...searchParams, endDate: date ? date.format('YYYY-MM-DD') : '' })
            }
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
          />

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            className="w-full sm:w-auto"
          >
            搜索
          </Button>
          <Button onClick={resetSearch} className="w-full sm:w-auto">
            重置
          </Button>
          <Button icon={<ReloadOutlined />} onClick={refreshCustomers} className="w-full sm:w-auto">
            刷新
          </Button>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="w-full sm:w-auto mt-2 sm:mt-0"
        >
          添加客户
        </Button>
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
        bodyStyle={{ padding: '16px' }}
      >
        {detailType === 'view' ? (
          customerDetail ? (
            <CustomerDetail customer={customerDetail} onClose={() => setDrawerVisible(false)} />
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
        width={1000}
        destroyOnClose
      >
        {detailType === 'view' ? (
          customerDetail ? (
            <CustomerDetail customer={customerDetail} onClose={() => setModalVisible(false)} />
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

  // 使用 useSWR 获取客户详情数据
  const { data: customerDetail, isLoading } = useSWR(
    customer.id ? `/api/customers/${customer.id}` : null,
    () => getCustomerDetail(customer.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 0,
      revalidateIfStale: true,
      shouldRetryOnError: true,
      refreshInterval: 0,
    }
  )

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

  const formatDate = (dateString: string | null, includeTime = true) => {
    if (!dateString) return '-'
    try {
      if (includeTime) {
        return dayjs.utc(dateString).format('YYYY/MM/DD HH:mm')
      }
      return dayjs.utc(dateString).format('YYYY/MM/DD')
    } catch (e) {
      return dateString || '-'
    }
  }

  // 渲染图片预览
  const renderImage = (url: string | undefined, label: string) => {
    if (!url)
      return (
        <div className="no-image-placeholder border border-dashed border-gray-300 rounded-md h-24 flex items-center justify-center text-gray-400">
          暂无图片
        </div>
      )

    const handlePreviewClick = (e: React.MouseEvent) => {
      // 如果点击的是已经加载失败的图片（有opacity-60类），不执行预览
      const targetElement = e.target as HTMLElement
      const imgElement =
        targetElement.tagName === 'IMG' ? targetElement : targetElement.querySelector('img')
      if (imgElement && imgElement.classList.contains('opacity-60')) {
        return
      }
      setImagePreview({ visible: true, url })
    }

    return (
      <div className="customer-image-preview cursor-pointer" onClick={handlePreviewClick}>
        <img
          src={url}
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
  }

  // 渲染图片集合
  const renderImages = (images: Record<string, any> | undefined) => {
    if (!images || Object.keys(images).length === 0) {
      return <div className="no-image-placeholder">暂无图片</div>
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Object.entries(images).map(([key, imageData]) => {
          // 处理不同的数据结构，保证能正确获取URL
          const url = typeof imageData === 'string' ? imageData : imageData?.url

          if (!url) return null

          const handlePreviewClick = (e: React.MouseEvent) => {
            // 如果点击的是已经加载失败的图片（有opacity-60类），不执行预览
            const targetElement = e.target as HTMLElement
            const imgElement =
              targetElement.tagName === 'IMG' ? targetElement : targetElement.querySelector('img')
            if (imgElement && imgElement.classList.contains('opacity-60')) {
              return
            }
            setImagePreview({ visible: true, url })
          }

          return (
            <div
              key={key}
              className="customer-image-preview cursor-pointer"
              onClick={handlePreviewClick}
            >
              <img
                src={url}
                alt={key}
                className="w-full h-24 object-cover rounded-md"
                onError={e => {
                  ;(e.target as HTMLImageElement).onerror = null
                  ;(e.target as HTMLImageElement).src = '/images/image-placeholder.svg'
                  ;(e.target as HTMLImageElement).className =
                    'w-full h-24 object-contain rounded-md opacity-60'
                  ;(e.target as HTMLImageElement).style.cursor = 'not-allowed'
                }}
              />
              <div className="customer-image-tag">{key}</div>
            </div>
          )
        })}
      </div>
    )
  }

  // 格式化状态显示
  const formatStatus = (status: string | null, type: 'business' | 'enterprise') => {
    if (!status) return <Tag color="default">未设置</Tag>

    if (type === 'business') {
      switch (status) {
        case 'normal':
          return <Tag color="success">{BUSINESS_STATUS_MAP.normal}</Tag>
        case 'terminated':
          return <Tag color="error">{BUSINESS_STATUS_MAP.terminated}</Tag>
        case 'suspended':
          return <Tag color="warning">{BUSINESS_STATUS_MAP.suspended}</Tag>
        default:
          return <Tag color="default">{status}</Tag>
      }
    } else {
      switch (status) {
        case 'active':
          return <Tag color="success">正常经营</Tag>
        case 'inactive':
          return <Tag color="warning">停业</Tag>
        case 'closed':
          return <Tag color="error">注销</Tag>
        default:
          return <Tag color="default">{status}</Tag>
      }
    }
  }

  const tabs: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
          <Descriptions.Item label="企业名称" span={3}>
            {customer.companyName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="税号">
            {customer.taxNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="企业类型">
            {customer.enterpriseType || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="所属分局">
            {customer.taxBureau || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="实际负责人">
            {customer.actualResponsibleName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {customer.actualResponsiblePhone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="企业状态">
            {formatStatus(customer.enterpriseStatus, 'enterprise')}
          </Descriptions.Item>
          <Descriptions.Item label="沟通注意事项" span={3}>
            {customer.communicationNotes || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="提交人">{customer.submitter || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDate(customer.createTime)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDate(customer.updateTime)}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: '2',
      label: '业务详情',
      children: (
        <Descriptions
          bordered
          column={1}
          size={isMobile ? 'small' : 'default'}
          className="break-all"
        >
          <Descriptions.Item label="主营业务">{customer.mainBusiness || '-'}</Descriptions.Item>
          <Descriptions.Item label="经营范围">{customer.businessScope || '-'}</Descriptions.Item>
          <Descriptions.Item label="经营地址">{customer.businessAddress || '-'}</Descriptions.Item>
          <Descriptions.Item label="老板简介">{customer.bossProfile || '-'}</Descriptions.Item>
          <Descriptions.Item label="沟通注意事项">
            {customer.communicationNotes || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="关联企业">
            {customer.affiliatedEnterprises || '-'}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: '3',
      label: '银行账户',
      children: (
        <Descriptions
          bordered
          column={isMobile ? 1 : 2}
          size={isMobile ? 'small' : 'default'}
          className="break-all"
        >
          <Descriptions.Item label="基本户银行">{customer.basicBank || '-'}</Descriptions.Item>
          <Descriptions.Item label="基本户账号">
            {customer.basicBankAccount || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="基本户行号">
            {customer.basicBankNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="一般户银行">{customer.generalBank || '-'}</Descriptions.Item>
          <Descriptions.Item label="一般户账号">
            {customer.generalBankAccount || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="一般户行号">
            {customer.generalBankNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="是否有网银">
            {customer.hasOnlineBanking || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="网银是否托管">
            {customer.isOnlineBankingCustodian || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="三方协议账户">
            {customer.tripartiteAgreementAccount || '-'}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: '4',
      label: '税务信息',
      children: (
        <>
          <Descriptions
            bordered
            column={isMobile ? 1 : 2}
            size={isMobile ? 'small' : 'default'}
            className="break-all"
          >
            <Descriptions.Item label="税种">{customer.taxCategories || '-'}</Descriptions.Item>
            <Descriptions.Item label="个税申报密码">
              {customer.personalIncomeTaxPassword || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="个税申报人员" span={2}>
              {customer.personalIncomeTaxStaff || '-'}
            </Descriptions.Item>
          </Descriptions>

          <h3 className="mt-4 mb-2 font-medium">法定代表人</h3>
          <Descriptions
            bordered
            column={isMobile ? 1 : 2}
            size={isMobile ? 'small' : 'default'}
            className="break-all"
          >
            <Descriptions.Item label="姓名">
              {customer.legalRepresentativeName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {customer.legalRepresentativePhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              {customer.legalRepresentativeId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="电子税务局密码">
              {customer.legalRepresentativeTaxPassword || '-'}
            </Descriptions.Item>
          </Descriptions>

          <h3 className="mt-4 mb-2 font-medium">财务负责人</h3>
          <Descriptions
            bordered
            column={isMobile ? 1 : 2}
            size={isMobile ? 'small' : 'default'}
            className="break-all"
          >
            <Descriptions.Item label="姓名">
              {customer.financialContactName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {customer.financialContactPhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              {customer.financialContactId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="电子税务局密码">
              {customer.financialContactTaxPassword || '-'}
            </Descriptions.Item>
          </Descriptions>

          <h3 className="mt-4 mb-2 font-medium">办税员</h3>
          <Descriptions
            bordered
            column={isMobile ? 1 : 2}
            size={isMobile ? 'small' : 'default'}
            className="break-all"
          >
            <Descriptions.Item label="姓名">{customer.taxOfficerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {customer.taxOfficerPhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">{customer.taxOfficerId || '-'}</Descriptions.Item>
            <Descriptions.Item label="电子税务局密码">
              {customer.taxOfficerTaxPassword || '-'}
            </Descriptions.Item>
          </Descriptions>
        </>
      ),
    },
    {
      key: '5',
      label: '证照信息',
      children: (
        <Descriptions
          bordered
          column={1}
          size={isMobile ? 'small' : 'default'}
          className="break-all"
        >
          <Descriptions.Item label="营业执照到期日期">
            {formatDate(customer.licenseExpiryDate, false)}
          </Descriptions.Item>
          <Descriptions.Item label="注册资本认缴截止日期">
            {formatDate(customer.capitalContributionDeadline, false)}
          </Descriptions.Item>
          <Descriptions.Item label="实缴资本">{customer.paidInCapital || '-'}</Descriptions.Item>
          <Descriptions.Item label="年检密码">
            {customer.annualInspectionPassword || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="股东信息">{customer.shareholders || '-'}</Descriptions.Item>
          <Descriptions.Item label="监事信息">{customer.supervisors || '-'}</Descriptions.Item>
          <Descriptions.Item label="行政许可">
            {customer.administrativeLicenses || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="资本实缴记录">
            {customer.capitalContributionRecords || '-'}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: '6',
      label: '图片资料',
      children: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">法人身份证照片</h3>
              <div className="mb-4">
                <div className="mb-1">身份证正面</div>
                {renderImage(customer.legalPersonIdImages?.front?.url, '身份证正面')}
              </div>
              <div>
                <div className="mb-1">身份证反面</div>
                {renderImage(customer.legalPersonIdImages?.back?.url, '身份证反面')}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">营业执照照片</h3>
              <div className="mb-1">营业执照</div>
              {renderImage(customer.businessLicenseImages?.main?.url, '营业执照')}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">开户许可证照片</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-1">基本户开户许可证</div>
                {renderImage(customer.bankAccountLicenseImages?.basic?.url, '基本户开户许可证')}
              </div>
              <div>
                <div className="mb-1">一般户开户许可证</div>
                {renderImage(customer.bankAccountLicenseImages?.general?.url, '一般户开户许可证')}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">其他人员身份证照片</h3>
            {renderImages(customer.otherIdImages)}
          </div>

          <div>
            <h3 className="font-medium mb-2">补充资料照片</h3>
            {renderImages(customer.supplementaryImages)}
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
