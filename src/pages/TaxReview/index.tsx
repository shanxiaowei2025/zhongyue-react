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
import {
  useTaxVerificationList,
  useTaxVerificationOperations,
} from '../../hooks/useTaxVerification'
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

  // 分页状态
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

  // 使用统一的hook获取数据
  const { data, pagination, loading, refreshTaxVerificationList } = useTaxVerificationList({
    ...debouncedSearchParams,
    page: current,
    pageSize: pageSize,
  })

  // 使用操作方法
  const { createRecord } = useTaxVerificationOperations()

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

  // 企业搜索使用 CustomerAutoComplete 组件

  // 保存状态到pageStates
  React.useEffect(() => {
    setState('taxVerificationSearchParams', searchParams)
    setState('taxVerificationPagination', { current, pageSize })
  }, [searchParams, current, pageSize])

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

  // 客户选择处理函数
  const handleCustomerSelect = (enterprise: Enterprise) => {
    createForm.setFieldsValue({
      companyName: enterprise.companyName,
      unifiedSocialCreditCode: enterprise.unifiedSocialCreditCode,
      taxBureau: enterprise.taxBureau || '',
    })
    message.success('企业信息已自动填入')
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

      await createRecord(createData)
      handleCloseCreateModal()
    } catch (error: any) {
      console.error('创建失败:', error)
      // 错误处理由拦截器统一处理
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
            ...pagination,
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
