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
import CustomerForm, { BUSINESS_STATUS_MAP } from './CustomerForm'
import type { TabsProps } from 'antd'
import dayjs from 'dayjs'
import { usePageStates, PageStatesStore } from '../../store/pageStates'
import { useCustomerList, useCustomerDetail } from '../../hooks/useCustomer'

const { confirm } = Modal

const Customers = () => {
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
    socialCreditCode: '',
    salesRepresentative: '',
    taxBureau: '',
    taxRegistrationType: '',
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
  const [detailLoading, setDetailLoading] = useState(false)
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
    updateCustomer: updateCustomerDetail,
    createCustomer: createNewCustomer,
  } = useCustomerDetail(selectedCustomerId)

  // 当客户详情数据更新时，更新当前客户状态
  useEffect(() => {
    if (customerDetail && (detailType === 'view' || detailType === 'edit')) {
      setCurrentCustomer(customerDetail)
      setDetailLoading(false)
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
      socialCreditCode: '',
      salesRepresentative: '',
      taxBureau: '',
      taxRegistrationType: '',
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
    setDetailLoading(true)

    // 确保先设置选中的客户ID再打开对话框，避免重复触发请求
    setSelectedCustomerId(record.id)

    // 打开对话框
    setTimeout(() => {
      isMobile ? setDrawerVisible(true) : setModalVisible(true)
    }, 0)
  }

  const handleEdit = (record: Customer) => {
    // 先设置基本信息，保证界面快速响应
    setCurrentCustomer(record)
    setDetailType('edit')
    setDetailLoading(true)

    // 设置选中的客户ID，触发SWR请求完整数据
    setSelectedCustomerId(record.id)

    // 打开对话框（等数据加载完成后再显示）
    setTimeout(() => {
      isMobile ? setDrawerVisible(true) : setModalVisible(true)
    }, 0)
  }

  const handleDelete = (id: number) => {
    confirm({
      title: '确认删除',
      content: '确定要删除这个客户吗？此操作不可恢复。',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => removeCustomer(id),
    })
  }

  // 保存成功后的回调
  const handleSaveSuccess = async (id?: number) => {
    // 关闭抽屉和弹窗
    setDrawerVisible(false)
    setModalVisible(false)

    // 刷新列表数据
    refreshCustomers()

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
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text, record) => (
        <a
          onClick={() => handleView(record)}
          className="company-name-link"
          title={text || '未设置公司名称'}
        >
          {text || '未命名企业'}
        </a>
      ),
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'socialCreditCode',
      key: 'socialCreditCode',
      responsive: ['lg'],
    },
    {
      title: '联系人',
      dataIndex: 'dailyContact',
      key: 'dailyContact',
    },
    {
      title: '联系人电话',
      dataIndex: 'dailyContactPhone',
      key: 'dailyContactPhone',
      responsive: ['md'],
    },
    {
      title: '业务员',
      dataIndex: 'salesRepresentative',
      key: 'salesRepresentative',
      responsive: ['xl'],
    },
    {
      title: '业务来源',
      dataIndex: 'businessSource',
      key: 'businessSource',
      responsive: ['xl'],
    },
    {
      title: '纳税人类型',
      dataIndex: 'taxRegistrationType',
      key: 'taxRegistrationType',
      responsive: ['xxl'],
    },
    {
      title: '所属税局',
      dataIndex: 'taxBureau',
      key: 'taxBureau',
      responsive: ['lg'],
    },
    {
      title: '主管会计',
      dataIndex: 'chiefAccountant',
      key: 'chiefAccountant',
      responsive: ['xl'],
    },
    {
      title: '责任会计',
      dataIndex: 'responsibleAccountant',
      key: 'responsibleAccountant',
      responsive: ['xxl'],
    },
    {
      title: '业务状态',
      dataIndex: 'businessStatus',
      key: 'businessStatus',
      render: status => {
        let color = 'default'
        let text = status || '未设置'

        switch (status) {
          case 'normal':
            color = 'success'
            text = BUSINESS_STATUS_MAP.normal
            break
          case 'terminated':
            color = 'error'
            text = BUSINESS_STATUS_MAP.terminated
            break
          case 'suspended':
            color = 'warning'
            text = BUSINESS_STATUS_MAP.suspended
            break
          default:
            color = 'default'
        }

        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '企业类型',
      dataIndex: 'enterpriseType',
      key: 'enterpriseType',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      responsive: ['md'],
      render: text => {
        if (!text) return '-'
        return new Date(text)
          .toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          .replace(/\//g, '-')
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      responsive: ['lg'],
      width: 180,
      render: text => {
        if (!text) return '-'
        return new Date(text)
          .toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          .replace(/\//g, '-')
      },
    },
    {
      title: '操作',
      key: 'action',
      width: isMobile ? 100 : 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size={isMobile ? 2 : 4} className="action-buttons">
          <Button
            type="link"
            className="action-btn view-btn"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title="查看"
            size={isMobile ? 'small' : 'middle'}
          >
            {!isMobile && '查看'}
          </Button>
          <Button
            type="link"
            className="action-btn edit-btn"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="编辑"
            size={isMobile ? 'small' : 'middle'}
          >
            {!isMobile && '编辑'}
          </Button>
          <Button
            type="link"
            className="action-btn delete-btn"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            title="删除"
            size={isMobile ? 'small' : 'middle'}
          >
            {!isMobile && '删除'}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
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
            placeholder="统一社会信用代码"
            value={searchParams.socialCreditCode}
            onChange={e => setSearchParams({ ...searchParams, socialCreditCode: e.target.value })}
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
          />
          <Input
            placeholder="业务员"
            value={searchParams.salesRepresentative}
            onChange={e =>
              setSearchParams({ ...searchParams, salesRepresentative: e.target.value })
            }
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
          />
          <Input
            placeholder="所属税局"
            value={searchParams.taxBureau}
            onChange={e => setSearchParams({ ...searchParams, taxBureau: e.target.value })}
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
          />
          <Select
            placeholder="税务登记类型"
            value={searchParams.taxRegistrationType || undefined}
            onChange={value => setSearchParams({ ...searchParams, taxRegistrationType: value })}
            allowClear
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
            options={[
              { value: '一般纳税人', label: '一般纳税人' },
              { value: '小规模纳税人', label: '小规模纳税人' },
            ]}
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
            value={searchParams.startDate ? dayjs(searchParams.startDate) : null}
            onChange={date =>
              setSearchParams({ ...searchParams, startDate: date ? date.format('YYYY-MM-DD') : '' })
            }
            className="w-full sm:w-[calc(50%-0.25rem)] xl:w-[180px]"
          />
          <DatePicker
            placeholder="结束日期"
            value={searchParams.endDate ? dayjs(searchParams.endDate) : null}
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
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="min-w-max">
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
        title={detailType === 'view' ? '客户详情' : detailType === 'edit' ? '编辑客户' : '添加客户'}
        placement="right"
        width={isMobile ? '100%' : '80%'}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false)
          // 重置详情加载状态和选中的客户ID
          setDetailLoading(false)
          if (detailType === 'view') {
            setSelectedCustomerId(undefined)
          }
        }}
        closable={true}
        height="100vh"
        styles={{
          body: {
            paddingBottom: 0,
            padding: '16px 16px 0',
            overflow: 'hidden', // 使用容器自己的滚动
          },
        }}
        destroyOnClose={true}
        className="customer-drawer"
        maskClosable={false}
        footer={null}
      >
        {isDetailLoading || detailLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingOutlined style={{ fontSize: 48 }} />
            <span className="ml-3 text-lg">
              {detailType === 'view' ? '加载客户详情...' : '加载客户数据...'}
            </span>
          </div>
        ) : detailType === 'view' && currentCustomer ? (
          <CustomerDetail customer={currentCustomer} onClose={() => setDrawerVisible(false)} />
        ) : (
          <CustomerForm
            customer={currentCustomer}
            mode={detailType}
            onSuccess={() => handleSaveSuccess(currentCustomer?.id)}
            onCancel={() => setDrawerVisible(false)}
          />
        )}
      </Drawer>

      {/* 客户详情模态框（桌面端） */}
      <Modal
        title={detailType === 'view' ? '客户详情' : detailType === 'edit' ? '编辑客户' : '添加客户'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          // 重置详情加载状态和选中的客户ID
          setDetailLoading(false)
          if (detailType === 'view') {
            setSelectedCustomerId(undefined)
          }
        }}
        footer={null}
        width="80%"
        style={{ top: 20 }}
        styles={{
          body: {
            height: 'calc(100vh - 160px)',
            padding: '24px 24px 0',
            overflow: 'hidden', // 重要：让内部内容自己滚动
          },
        }}
        destroyOnClose={true}
        className={isMobile ? '' : 'full-height-modal'}
        maskClosable={false}
        getContainer={document.body}
      >
        {isDetailLoading || detailLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingOutlined style={{ fontSize: 48 }} />
            <span className="ml-3 text-lg">
              {detailType === 'view' ? '加载客户详情...' : '加载客户数据...'}
            </span>
          </div>
        ) : detailType === 'view' && currentCustomer ? (
          <CustomerDetail customer={currentCustomer} onClose={() => setModalVisible(false)} />
        ) : (
          <CustomerForm
            customer={currentCustomer}
            mode={detailType}
            onSuccess={() => handleSaveSuccess(currentCustomer?.id)}
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
      const date = new Date(dateString)
      if (includeTime) {
        return date.toLocaleString()
      }
      return date.toLocaleDateString()
    } catch (e) {
      return dateString || '-'
    }
  }

  // 渲染图片预览
  const renderImage = (url: string | undefined, label: string) => {
    if (!url) return <div className="no-image-placeholder">暂无图片</div>

    return (
      <div className="customer-image-preview">
        <img
          src={url}
          alt={label}
          className="w-24 h-24 object-cover rounded-md"
          onClick={e => {
            // 只有当图片加载成功时才启用预览
            if (!(e.target as HTMLImageElement).classList.contains('opacity-60')) {
              setImagePreview({ visible: true, url })
            }
          }}
          onError={e => {
            ;(e.target as HTMLImageElement).onerror = null
            ;(e.target as HTMLImageElement).src = '/images/image-placeholder.svg'
            ;(e.target as HTMLImageElement).className =
              'w-24 h-24 object-contain rounded-md opacity-60'
            ;(e.target as HTMLImageElement).style.cursor = 'not-allowed'
          }}
        />
        <div className="customer-image-tag">{label}</div>
      </div>
    )
  }

  // 渲染图片集合
  const renderImages = (images: Record<string, string> | undefined) => {
    if (!images || Object.keys(images).length === 0) {
      return <div className="no-image-placeholder">暂无图片</div>
    }

    return (
      <div className="flex flex-wrap gap-3">
        {Object.entries(images).map(([key, url]) => (
          <div key={key} className="customer-image-preview">
            <img
              src={url}
              alt={key}
              className="w-24 h-24 object-cover rounded-md"
              onClick={e => {
                // 只有当图片加载成功时才启用预览
                if (!(e.target as HTMLImageElement).classList.contains('opacity-60')) {
                  setImagePreview({ visible: true, url })
                }
              }}
              onError={e => {
                ;(e.target as HTMLImageElement).onerror = null
                ;(e.target as HTMLImageElement).src = '/images/image-placeholder.svg'
                ;(e.target as HTMLImageElement).className =
                  'w-24 h-24 object-contain rounded-md opacity-60'
                ;(e.target as HTMLImageElement).style.cursor = 'not-allowed'
              }}
            />
            <div className="customer-image-tag">{key}</div>
          </div>
        ))}
      </div>
    )
  }

  // 格式化状态显示
  const formatStatus = (status: string | null, type: 'business' | 'enterprise') => {
    if (!status) return <Tag color="default">未设置</Tag>

    if (type === 'business') {
      switch (status) {
        case 'normal':
          return <Tag color="success">正常</Tag>
        case 'pending':
          return <Tag color="warning">待处理</Tag>
        case 'suspended':
          return <Tag color="error">暂停</Tag>
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
          <Descriptions.Item label="统一社会信用代码">
            {customer.socialCreditCode || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="日常联系人">{customer.dailyContact || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {customer.dailyContactPhone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="业务员">
            {customer.salesRepresentative || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="业务来源">{customer.businessSource || '-'}</Descriptions.Item>
          <Descriptions.Item label="企业老板">{customer.bossName || '-'}</Descriptions.Item>
          <Descriptions.Item label="老板信息" span={3}>
            {customer.bossProfile || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="业务状态">
            {formatStatus(customer.businessStatus, 'business')}
          </Descriptions.Item>
          <Descriptions.Item label="企业状态">
            {formatStatus(customer.enterpriseStatus, 'enterprise')}
          </Descriptions.Item>
          <Descriptions.Item label="企业类型">{customer.enterpriseType || '-'}</Descriptions.Item>
          <Descriptions.Item label="沟通注意事项" span={3}>
            {customer.communicationNotes || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDate(customer.createTime)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDate(customer.updateTime)}</Descriptions.Item>
          <Descriptions.Item label="提交人">{customer.submitter || '-'}</Descriptions.Item>
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
        <div className="space-y-8">
          <div className="customer-images-section">
            <h3 className="text-lg font-medium">法定代表人身份证</h3>
            <div className="flex flex-wrap gap-4">
              {renderImage(customer.legalPersonIdImages?.front, '身份证正面')}
              {renderImage(customer.legalPersonIdImages?.back, '身份证反面')}
            </div>
          </div>

          <div className="customer-images-section">
            <h3 className="text-lg font-medium">其他身份证件</h3>
            {renderImages(customer.otherIdImages)}
          </div>

          <div className="customer-images-section">
            <h3 className="text-lg font-medium">营业执照</h3>
            {renderImage(customer.businessLicenseImages?.main, '营业执照')}
          </div>

          <div className="customer-images-section">
            <h3 className="text-lg font-medium">银行开户许可证</h3>
            <div className="flex flex-wrap gap-4">
              {renderImage(customer.bankAccountLicenseImages?.basic, '基本户开户许可证')}
              {renderImage(customer.bankAccountLicenseImages?.general, '一般户开户许可证')}
            </div>
          </div>

          <div className="customer-images-section">
            <h3 className="text-lg font-medium">补充资料</h3>
            {renderImages(customer.supplementaryImages)}
          </div>
        </div>
      ),
    },
  ]

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

export default Customers
