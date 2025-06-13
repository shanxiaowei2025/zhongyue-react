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
  Upload,
  Tag,

} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { UploadFile, UploadProps } from 'antd/es/upload'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { usePageStates, PageStatesStore } from '../../store/pageStates'
import { useDebouncedValue } from '../../hooks/useDebounce'
import {
  getTaxVerificationList,
  createTaxVerification,
} from '../../api/taxVerification'
import { uploadFile } from '../../api/upload'
import type {
  TaxVerification,
  TaxVerificationQueryParams,
  CreateTaxVerificationDto,
  TaxVerificationAttachment,
} from '../../types/taxVerification'

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

  // 文件上传状态
  const [createFileList, setCreateFileList] = useState<UploadFile[]>([])
  const [uploadLoading, setUploadLoading] = useState<boolean>(false)

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

  // 文件上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploadLoading(true)
        
        const response = await uploadFile(file as File)
        
        if (response.code === 0) {
          onSuccess?.(response.data)
          message.success(`${(file as File).name} 上传成功`)
        } else {
          onError?.(new Error(response.message))
          message.error(`${(file as File).name} 上传失败`)
        }
      } catch (error) {
        onError?.(error as Error)
        message.error(`${(file as File).name} 上传失败`)
      } finally {
        setUploadLoading(false)
      }
    },
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.csv',
    beforeUpload: (file) => {
      const isValidType = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'text/csv',
      ].includes(file.type)
      
      if (!isValidType) {
        message.error('只支持上传 PDF、Word、Excel、图片、CSV 文件')
        return false
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB')
        return false
      }
      
      return true
    },
  }

  // 打开新建弹窗
  const handleOpenCreateModal = () => {
    setCreateModalVisible(true)
    createForm.resetFields()
    setCreateFileList([])
  }

  // 关闭新建弹窗
  const handleCloseCreateModal = () => {
    setCreateModalVisible(false)
    createForm.resetFields()
    setCreateFileList([])
  }

  // 提交新建
  const handleSubmitCreate = async () => {
    try {
      const values = await createForm.validateFields()
      setCreateLoading(true)

      // 处理附件
      const attachments: TaxVerificationAttachment[] = createFileList.map(file => ({
        name: file.name,
        url: file.response?.url || '',
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
      <div className="mb-6">
        <Title level={2} className="!mb-0">
          税务核查
        </Title>
      </div>

      <Card>
        {/* 搜索表单 */}
        <Form
          form={searchForm}
          layout="vertical"
          className="mb-4"
          initialValues={searchParams}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="企业名称" name="companyName">
                <Input
                  placeholder="请输入企业名称"
                  value={searchParams.companyName}
                  onChange={(e) =>
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
                  onChange={(e) =>
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
                  onChange={(e) =>
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
                  onChange={(e) =>
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
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleOpenCreateModal}
                >
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
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
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
        <Form
          form={createForm}
          layout="vertical"
          preserve={false}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="企业名称"
                name="companyName"
                rules={[
                  { required: true, message: '请输入企业名称' },
                  { max: 100, message: '企业名称不能超过100个字符' },
                ]}
              >
                <Input placeholder="请输入企业名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="统一社会信用代码"
                name="unifiedSocialCreditCode"
                rules={[
                  { required: true, message: '请输入统一社会信用代码' },
                  { len: 18, message: '统一社会信用代码必须为18位' },
                ]}
              >
                <Input placeholder="请输入统一社会信用代码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="所属分局"
                name="taxBureau"
                rules={[
                  { required: true, message: '请输入所属分局' },
                  { max: 50, message: '所属分局不能超过50个字符' },
                ]}
              >
                <Input placeholder="请输入所属分局" />
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
                rules={[
                  { required: true, message: '请选择风险下发日期' },
                ]}
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
                rules={[
                  { required: true, message: '请选择风险发生日期' },
                ]}
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
            <Upload
              {...uploadProps}
              fileList={createFileList}
              onChange={({ fileList }) => setCreateFileList(fileList)}
            >
              <Button icon={<UploadOutlined />} loading={uploadLoading}>
                上传附件
              </Button>
            </Upload>
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              支持上传 PDF、Word、Excel、图片、CSV 文件，单个文件不超过 10MB
            </div>
          </Form.Item>
        </Form>
      </Modal>


    </div>
  )
}

export default TaxReview 