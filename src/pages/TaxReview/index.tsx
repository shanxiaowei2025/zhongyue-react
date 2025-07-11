import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Form,
  Row,
  Col,
  DatePicker,
  Typography,
  Tooltip,
  Modal,
  message,
  Tag,
  AutoComplete,
  Spin,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  DownloadOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { usePageStates, PageStatesStore } from '../../store/pageStates'
import { useDebouncedValue } from '../../hooks/useDebounce'
import { getTaxVerificationList, createTaxVerification } from '../../api/taxVerification'
import { uploadFile } from '../../api/upload'
import type {
  TaxVerification,
  TaxVerificationQueryParams,
  CreateTaxVerificationDto,
  TaxVerificationAttachment,
} from '../../types/taxVerification'
import type { Enterprise } from '../../types/enterpriseService'
import CustomerAutoComplete from '../../components/CustomerAutoComplete'
import type { ImageType } from '../../types'
import MultiFileUpload from '../../components/MultiFileUpload'

const { Title } = Typography
const { RangePicker } = DatePicker

// 智能文本渲染组件
const EllipsisText: React.FC<{
  text: string | null
  maxWidth?: number
}> = ({ text, maxWidth }) => {
  if (!text) return <span>-</span>

  const content = (
    <span
      style={{
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

  return (
    <Tooltip title={text} placement="topLeft" mouseEnterDelay={0.3}>
      {content}
    </Tooltip>
  )
}

const TaxReview: React.FC = () => {
  const navigate = useNavigate()

  // 使用 pageStates 存储来保持状态
  const getState = usePageStates((state: PageStatesStore) => state.getState)
  const setState = usePageStates((state: PageStatesStore) => state.setState)

  // 从 pageStates 恢复搜索参数和分页信息
  const savedSearchParams = getState('taxVerificationSearchParams')
  const savedPagination = getState('taxVerificationPagination')

  // 状态管理
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<TaxVerification[]>([])
  const [total, setTotal] = useState<number>(0)
  const [current, setCurrent] = useState<number>(savedPagination?.current || 1)
  const [pageSize, setPageSize] = useState<number>(savedPagination?.pageSize || 10)
  const [searchParams, setSearchParams] = useState<TaxVerificationQueryParams>({
    companyName: '',
    unifiedSocialCreditCode: '',
    taxBureau: '',
    responsibleAccountant: '',
    ...(savedSearchParams || {}),
  })

  // 防抖搜索参数
  const debouncedSearchParams = useDebouncedValue(searchParams, 500)

  // 表单实例
  const [searchForm] = Form.useForm()
  const [createForm] = Form.useForm()

  // 弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false)
  const [createLoading, setCreateLoading] = useState<boolean>(false)

  // 文件上传状态 - 使用MultiFileUpload的FileItem类型
  const [attachmentFiles, setAttachmentFiles] = useState<Array<{ fileName: string; url: string }>>(
    []
  )

  // 将数组格式转换为对象格式
  const arrayToObjectFormat = (
    files: Array<{ fileName: string; url: string }>
  ): Record<string, ImageType> => {
    const result: Record<string, ImageType> = {}
    files.forEach((file, index) => {
      result[index.toString()] = {
        fileName: file.fileName,
        url: file.url,
      }
    })
    return result
  }

  // 将对象格式转换为数组格式
  const objectToArrayFormat = (
    value: Record<string, ImageType>
  ): Array<{ fileName: string; url: string }> => {
    return Object.values(value).map(item => ({
      fileName: item.fileName || '',
      url: item.url || '',
    }))
  }

  // 企业名称搜索相关状态
  const [customerSearchLoading, setCustomerSearchLoading] = useState<boolean>(false)
  const [customerOptions, setCustomerOptions] = useState<CustomerSearchOption[]>([])
  const [customerSearchValue, setCustomerSearchValue] = useState<string>('')
  const [customerPage, setCustomerPage] = useState<number>(1)
  const [customerTotal, setCustomerTotal] = useState<number>(0)
  const [hasMoreCustomers, setHasMoreCustomers] = useState<boolean>(false)

  // 统一社会信用代码搜索相关状态
  const [codeSearchLoading, setCodeSearchLoading] = useState<boolean>(false)
  const [codeOptions, setCodeOptions] = useState<CustomerSearchOption[]>([])
  const [codeSearchValue, setCodeSearchValue] = useState<string>('')
  const [codePage, setCodePage] = useState<number>(1)
  const [codeTotal, setCodeTotal] = useState<number>(0)
  const [hasMoreCodes, setHasMoreCodes] = useState<boolean>(false)

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true)
      const params: TaxVerificationQueryParams = {
        page: current,
        pageSize: pageSize,
        ...debouncedSearchParams,
      }

      // 保存状态
      setState('taxVerificationSearchParams', searchParams)
      setState('taxVerificationPagination', { current, pageSize })

      const response = await getTaxVerificationList(params)

      if (response.code === 0 && response.data) {
        setData(response.data.list)
        setTotal(response.data.total)
      }
    } catch (error) {
      console.error('加载税务核查记录失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 当搜索参数或分页变化时，重新加载数据
  useEffect(() => {
    loadData()
  }, [current, pageSize, debouncedSearchParams])

  // 处理搜索
  const handleSearch = () => {
    setCurrent(1)
  }

  // 重置搜索
  const handleReset = () => {
    const resetParams = {
      companyName: '',
      unifiedSocialCreditCode: '',
      taxBureau: '',
      responsibleAccountant: '',
    }
    setSearchParams(resetParams)
    searchForm.resetFields()
    setCurrent(1)
  }

  // 处理表格变化
  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setCurrent(pagination.current)
    if (pagination.pageSize) setPageSize(pagination.pageSize)
  }

  // 搜索企业名称（模糊搜索）
  const handleCustomerSearch = async (searchValue: string, resetPage: boolean = false) => {
    if (!searchValue || !searchValue.trim()) {
      setCustomerOptions([])
      setCustomerTotal(0)
      setHasMoreCustomers(false)
      return
    }

    try {
      setCustomerSearchLoading(true)

      const currentPage = resetPage ? 1 : customerPage

      const params: CustomerQueryParams = {
        page: currentPage,
        pageSize: 20, // 每次加载20条数据
        companyName: searchValue.trim(),
      }

      const response = await searchCustomers(params)

      if (response.code === 0 && response.data) {
        const { data: enterprises, total } = response.data

        // 转换为选项格式
        const newOptions: CustomerSearchOption[] = enterprises.map(enterprise => ({
          value: enterprise.companyName,
          label: (
            <div style={{ padding: '4px 0' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                {enterprise.companyName}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {enterprise.unifiedSocialCreditCode}
              </div>
              {enterprise.taxBureau && (
                <div style={{ fontSize: '12px', color: '#999' }}>
                  所属分局: {enterprise.taxBureau}
                </div>
              )}
            </div>
          ),
          enterprise,
        }))

        if (resetPage) {
          setCustomerOptions(newOptions)
          setCustomerPage(1)
        } else {
          setCustomerOptions(prev => [...prev, ...newOptions])
        }

        setCustomerTotal(total)
        setHasMoreCustomers(currentPage * 20 < total)

        if (resetPage) {
          setCustomerPage(2) // 下次请求第二页
        } else {
          setCustomerPage(currentPage + 1)
        }
      } else {
        if (resetPage) {
          setCustomerOptions([])
          setCustomerTotal(0)
          setHasMoreCustomers(false)
        }
      }
    } catch (error) {
      console.error('搜索企业信息失败:', error)
      if (resetPage) {
        setCustomerOptions([])
        setCustomerTotal(0)
        setHasMoreCustomers(false)
      }
    } finally {
      setCustomerSearchLoading(false)
    }
  }

  // 加载更多企业数据
  const handleLoadMoreCustomers = () => {
    if (!customerSearchLoading && hasMoreCustomers && customerSearchValue) {
      handleCustomerSearch(customerSearchValue, false)
    }
  }

  // 选择企业时自动填入信息
  const handleCustomerSelect = (value: string, option: any) => {
    const enterprise = option.enterprise
    if (enterprise) {
      createForm.setFieldsValue({
        companyName: enterprise.companyName,
        unifiedSocialCreditCode: enterprise.unifiedSocialCreditCode,
        taxBureau: enterprise.taxBureau || '',
      })
      message.success('企业信息已自动填入')
    }
  }

  // 重置企业搜索状态
  const resetCustomerSearch = () => {
    setCustomerOptions([])
    setCustomerSearchValue('')
    setCustomerPage(1)
    setCustomerTotal(0)
    setHasMoreCustomers(false)
  }

  // 搜索统一社会信用代码（模糊搜索）
  const handleCodeSearch = async (searchValue: string, resetPage: boolean = false) => {
    if (!searchValue || !searchValue.trim()) {
      setCodeOptions([])
      setCodeTotal(0)
      setHasMoreCodes(false)
      return
    }

    try {
      setCodeSearchLoading(true)

      const currentPage = resetPage ? 1 : codePage

      const params: CustomerQueryParams = {
        page: currentPage,
        pageSize: 20, // 每次加载20条数据
        unifiedSocialCreditCode: searchValue.trim(),
      }

      const response = await searchCustomers(params)

      if (response.code === 0 && response.data) {
        const { data: enterprises, total } = response.data

        // 转换为选项格式
        const newOptions: CustomerSearchOption[] = enterprises.map(enterprise => ({
          value: enterprise.unifiedSocialCreditCode,
          label: (
            <div style={{ padding: '4px 0' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                {enterprise.unifiedSocialCreditCode}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>{enterprise.companyName}</div>
              {enterprise.taxBureau && (
                <div style={{ fontSize: '12px', color: '#999' }}>
                  所属分局: {enterprise.taxBureau}
                </div>
              )}
            </div>
          ),
          enterprise,
        }))

        if (resetPage) {
          setCodeOptions(newOptions)
          setCodePage(1)
        } else {
          setCodeOptions(prev => [...prev, ...newOptions])
        }

        setCodeTotal(total)
        setHasMoreCodes(currentPage * 20 < total)

        if (resetPage) {
          setCodePage(2) // 下次请求第二页
        } else {
          setCodePage(currentPage + 1)
        }
      } else {
        if (resetPage) {
          setCodeOptions([])
          setCodeTotal(0)
          setHasMoreCodes(false)
        }
      }
    } catch (error) {
      console.error('搜索统一社会信用代码失败:', error)
      if (resetPage) {
        setCodeOptions([])
        setCodeTotal(0)
        setHasMoreCodes(false)
      }
    } finally {
      setCodeSearchLoading(false)
    }
  }

  // 加载更多统一社会信用代码数据
  const handleLoadMoreCodes = () => {
    if (!codeSearchLoading && hasMoreCodes && codeSearchValue) {
      handleCodeSearch(codeSearchValue, false)
    }
  }

  // 选择统一社会信用代码时自动填入信息
  const handleCodeSelect = (value: string, option: any) => {
    const enterprise = option.enterprise
    if (enterprise) {
      createForm.setFieldsValue({
        companyName: enterprise.companyName,
        unifiedSocialCreditCode: enterprise.unifiedSocialCreditCode,
        taxBureau: enterprise.taxBureau || '',
      })
      message.success('企业信息已自动填入')
    }
  }

  // 重置统一社会信用代码搜索状态
  const resetCodeSearch = () => {
    setCodeOptions([])
    setCodeSearchValue('')
    setCodePage(1)
    setCodeTotal(0)
    setHasMoreCodes(false)
  }

  // 打开新建弹窗
  const handleOpenCreateModal = () => {
    setCreateModalVisible(true)
    createForm.resetFields()
    setAttachmentFiles([])
  }

  // 关闭新建弹窗
  const handleCloseCreateModal = () => {
    setCreateModalVisible(false)
    createForm.resetFields()
    setAttachmentFiles([])
    resetCustomerSearch() // 重置企业搜索状态
    resetCodeSearch() // 重置统一社会信用代码搜索状态
  }

  // 提交新建
  const handleSubmitCreate = async () => {
    try {
      const values = await createForm.validateFields()
      setCreateLoading(true)

      // 处理附件
      const attachments: TaxVerificationAttachment[] = attachmentFiles.map(file => ({
        name: file.fileName,
        url: file.url,
      }))

      const createData: CreateTaxVerificationDto = {
        companyName: values.companyName,
        unifiedSocialCreditCode: values.unifiedSocialCreditCode,
        taxBureau: values.taxBureau,
        riskIssuedDate: values.riskIssuedDate?.format('YYYY-MM-DD'),
        riskReason: values.riskReason,
        riskOccurredDate: values.riskOccurredDate?.format('YYYY-MM-DD'),
        responsibleAccountant: values.responsibleAccountant,
        solution: values.solution,
        attachments,
      }

      const response = await createTaxVerification(createData)

      if (response.code === 0) {
        message.success('税务核查记录创建成功')
        handleCloseCreateModal()
        loadData()
      } else {
        message.error(response.message || '创建失败')
      }
    } catch (error: any) {
      console.error('创建失败:', error)
      message.error('创建失败，请重试')
    } finally {
      setCreateLoading(false)
    }
  }

  // 查看详情
  const handleViewDetail = (record: TaxVerification) => {
    navigate(`/tax-review/${record.id}`)
  }

  // 下载附件
  const handleDownload = (attachment: TaxVerificationAttachment) => {
    if (attachment.url) {
      window.open(attachment.url, '_blank')
    } else {
      message.warning('文件链接不存在')
    }
  }

  // 定义表格列
  const columns: ColumnsType<TaxVerification> = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      render: (text: string) => <EllipsisText text={text} maxWidth={180} />,
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'unifiedSocialCreditCode',
      key: 'unifiedSocialCreditCode',
      width: 180,
      render: (text: string) => <EllipsisText text={text} maxWidth={160} />,
    },
    {
      title: '所属分局',
      dataIndex: 'taxBureau',
      key: 'taxBureau',
      width: 120,
      render: (text: string) => <EllipsisText text={text} maxWidth={100} />,
    },
    {
      title: '风险下发日期',
      dataIndex: 'riskIssuedDate',
      key: 'riskIssuedDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '风险原因',
      dataIndex: 'riskReason',
      key: 'riskReason',
      width: 150,
      render: (text: string) => <EllipsisText text={text} maxWidth={130} />,
    },
    {
      title: '风险期责任会计',
      dataIndex: 'responsibleAccountant',
      key: 'responsibleAccountant',
      width: 120,
      render: (text: string) => <EllipsisText text={text} maxWidth={100} />,
    },
    {
      title: '附件',
      dataIndex: 'attachments',
      key: 'attachments',
      width: 100,
      render: (attachments: TaxVerificationAttachment[]) => (
        <Space direction="vertical" size="small">
          {attachments.map((attachment, index) => (
            <Button
              key={index}
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(attachment)}
              style={{ padding: 0, height: 'auto' }}
            >
              {attachment.name}
            </Button>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className="tax-review-page">
      <Card>
        {/* 搜索表单 */}
        <Form form={searchForm} layout="vertical" className="mb-4" initialValues={searchParams}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="企业名称" name="companyName">
                <Input
                  placeholder="请输入企业名称"
                  value={searchParams.companyName}
                  onChange={e =>
                    setSearchParams({
                      ...searchParams,
                      companyName: e.target.value,
                    })
                  }
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="统一社会信用代码" name="unifiedSocialCreditCode">
                <Input
                  placeholder="请输入统一社会信用代码"
                  value={searchParams.unifiedSocialCreditCode}
                  onChange={e =>
                    setSearchParams({
                      ...searchParams,
                      unifiedSocialCreditCode: e.target.value,
                    })
                  }
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="所属分局" name="taxBureau">
                <Input
                  placeholder="请输入所属分局"
                  value={searchParams.taxBureau}
                  onChange={e =>
                    setSearchParams({
                      ...searchParams,
                      taxBureau: e.target.value,
                    })
                  }
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="风险期责任会计" name="responsibleAccountant">
                <Input
                  placeholder="请输入风险期责任会计"
                  value={searchParams.responsibleAccountant}
                  onChange={e =>
                    setSearchParams({
                      ...searchParams,
                      responsibleAccountant: e.target.value,
                    })
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
                  新建核查记录
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: current,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 新建弹窗 */}
      <Modal
        title="新建税务核查记录"
        open={createModalVisible}
        onOk={handleSubmitCreate}
        onCancel={handleCloseCreateModal}
        confirmLoading={createLoading}
        width={800}
      >
        <Form form={createForm} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="企业名称"
                name="companyName"
                rules={[
                  { required: true, message: '请输入企业名称' },
                  { max: 100, message: '企业名称不能超过100个字符' },
                ]}
                extra="输入企业名称进行搜索，选择后将自动填入相关信息"
              >
                <CustomerAutoComplete
                  placeholder="请输入企业名称进行搜索"
                  searchType="companyName"
                  onSelect={(enterprise: Enterprise) => {
                    createForm.setFieldsValue({
                      companyName: enterprise.companyName,
                      unifiedSocialCreditCode: enterprise.unifiedSocialCreditCode,
                      taxBureau: enterprise.taxBureau || '',
                    })
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="统一社会信用代码"
                name="unifiedSocialCreditCode"
                rules={[
                  { len: 18, message: '统一社会信用代码必须为18位' },
                  {
                    pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
                    message: '请输入正确的统一社会信用代码格式',
                  },
                ]}
                extra="输入统一社会信用代码进行搜索，选择后将自动填入相关信息（可选）"
              >
                <CustomerAutoComplete
                  placeholder="请输入统一社会信用代码进行搜索"
                  searchType="unifiedSocialCreditCode"
                  onSelect={(enterprise: Enterprise) => {
                    createForm.setFieldsValue({
                      companyName: enterprise.companyName,
                      unifiedSocialCreditCode: enterprise.unifiedSocialCreditCode,
                      taxBureau: enterprise.taxBureau || '',
                    })
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="所属分局"
                name="taxBureau"
                extra="此字段将根据企业信息自动填入，无法编辑（可选）"
              >
                <Input
                  placeholder="所属分局将自动填入"
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="风险期责任会计"
                name="responsibleAccountant"
                rules={[
                  { required: true, message: '请输入风险期责任会计' },
                  { max: 50, message: '风险期责任会计不能超过50个字符' },
                ]}
              >
                <Input placeholder="请输入风险期责任会计" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="风险下发日期"
                name="riskIssuedDate"
                rules={[{ required: true, message: '请选择风险下发日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择风险下发日期"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="风险发生日期"
                name="riskOccurredDate"
                rules={[{ required: true, message: '请选择风险发生日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择风险发生日期"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="风险原因"
            name="riskReason"
            rules={[
              { required: true, message: '请输入风险原因' },
              { max: 500, message: '风险原因不能超过500个字符' },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请详细描述风险原因..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="解决方案"
            name="solution"
            rules={[
              { required: true, message: '请输入解决方案' },
              { max: 500, message: '解决方案不能超过500个字符' },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请详细描述解决方案..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item label="附件">
            <MultiFileUpload
              label="附件"
              value={arrayToObjectFormat(attachmentFiles)}
              onChange={value => setAttachmentFiles(objectToArrayFormat(value))}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.csv"
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              支持上传 PDF、Word、Excel、图片、CSV 文件
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TaxReview
