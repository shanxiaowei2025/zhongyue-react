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
  Tabs,
  Tag,
  Typography,
  Tooltip,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { usePageStates, PageStatesStore } from '../../store/pageStates'
import { useDebouncedValue } from '../../hooks/useDebounce'
import {
  getMySubmittedInspections,
  getMyResponsibleInspections,
} from '../../api/financialSelfInspection'
import type {
  FinancialSelfInspection,
  FinancialSelfInspectionQueryParams,
} from '../../types/financialSelfInspection'

const { Title } = Typography
const { RangePicker } = DatePicker
const { TabPane } = Tabs

// 智能文本渲染组件 - 只在文本被截断时显示tooltip
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

const FinancialSelfInspection: React.FC = () => {
  const navigate = useNavigate()
  
  // 使用 pageStates 存储来保持状态
  const getState = usePageStates((state: PageStatesStore) => state.getState)
  const setState = usePageStates((state: PageStatesStore) => state.setState)

  // 从 pageStates 恢复搜索参数和分页信息
  const savedActiveTab = getState('financialInspectionActiveTab') || 'submitted'
  const savedSubmittedSearchParams = getState('financialInspectionSubmittedSearchParams')
  const savedResponsibleSearchParams = getState('financialInspectionResponsibleSearchParams')
  const savedSubmittedPagination = getState('financialInspectionSubmittedPagination')
  const savedResponsiblePagination = getState('financialInspectionResponsiblePagination')

  // 状态管理
  const [activeTab, setActiveTab] = useState<string>(savedActiveTab)
  const [loading, setLoading] = useState<boolean>(false)
  
  // 我提交的数据
  const [submittedData, setSubmittedData] = useState<FinancialSelfInspection[]>([])
  const [submittedTotal, setSubmittedTotal] = useState<number>(0)
  const [submittedCurrent, setSubmittedCurrent] = useState<number>(
    savedSubmittedPagination?.current || 1
  )
  const [submittedPageSize, setSubmittedPageSize] = useState<number>(
    savedSubmittedPagination?.pageSize || 10
  )
  const [submittedSearchParams, setSubmittedSearchParams] = useState<FinancialSelfInspectionQueryParams>({
    companyName: '',
    unifiedSocialCreditCode: '',
    bookkeepingAccountant: '',
    consultantAccountant: '',
    ...(savedSubmittedSearchParams || {}),
  })

  // 我负责的数据
  const [responsibleData, setResponsibleData] = useState<FinancialSelfInspection[]>([])
  const [responsibleTotal, setResponsibleTotal] = useState<number>(0)
  const [responsibleCurrent, setResponsibleCurrent] = useState<number>(
    savedResponsiblePagination?.current || 1
  )
  const [responsiblePageSize, setResponsiblePageSize] = useState<number>(
    savedResponsiblePagination?.pageSize || 10
  )
  const [responsibleSearchParams, setResponsibleSearchParams] = useState<FinancialSelfInspectionQueryParams>({
    companyName: '',
    unifiedSocialCreditCode: '',
    inspector: '',
    bookkeepingAccountant: '',
    consultantAccountant: '',
    ...(savedResponsibleSearchParams || {}),
  })

  // 防抖搜索参数
  const debouncedSubmittedSearchParams = useDebouncedValue(submittedSearchParams, 500)
  const debouncedResponsibleSearchParams = useDebouncedValue(responsibleSearchParams, 500)

  // 表单实例
  const [submittedForm] = Form.useForm()
  const [responsibleForm] = Form.useForm()

  // 加载我提交的数据
  const loadSubmittedData = async () => {
    try {
      setLoading(true)
      const params: FinancialSelfInspectionQueryParams = {
        page: submittedCurrent,
        pageSize: submittedPageSize,
        ...debouncedSubmittedSearchParams,
      }

      // 保存状态
      setState('financialInspectionSubmittedSearchParams', submittedSearchParams)
      setState('financialInspectionSubmittedPagination', { 
        current: submittedCurrent, 
        pageSize: submittedPageSize 
      })

      const response = await getMySubmittedInspections(params)
      
      if (response.code === 0 && response.data) {
        setSubmittedData(response.data.items)
        setSubmittedTotal(response.data.total)
      }
    } catch (error) {
      console.error('加载我提交的账务自查记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载我负责的数据
  const loadResponsibleData = async () => {
    try {
      setLoading(true)
      const params: FinancialSelfInspectionQueryParams = {
        page: responsibleCurrent,
        pageSize: responsiblePageSize,
        ...debouncedResponsibleSearchParams,
      }

      // 保存状态
      setState('financialInspectionResponsibleSearchParams', responsibleSearchParams)
      setState('financialInspectionResponsiblePagination', { 
        current: responsibleCurrent, 
        pageSize: responsiblePageSize 
      })

      const response = await getMyResponsibleInspections(params)
      
      if (response.code === 0 && response.data) {
        setResponsibleData(response.data.items)
        setResponsibleTotal(response.data.total)
      }
    } catch (error) {
      console.error('加载我负责的账务自查记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 当搜索参数或分页变化时，重新加载数据
  useEffect(() => {
    if (activeTab === 'submitted') {
      loadSubmittedData()
    }
  }, [submittedCurrent, submittedPageSize, debouncedSubmittedSearchParams])

  useEffect(() => {    
    if (activeTab === 'responsible') {
      loadResponsibleData()
    }
  }, [responsibleCurrent, responsiblePageSize, debouncedResponsibleSearchParams])

  // 标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setState('financialInspectionActiveTab', key)
    
    // 切换时加载对应数据
    if (key === 'submitted') {
      loadSubmittedData()
    } else if (key === 'responsible') {
      loadResponsibleData()
    }
  }

  // 处理我提交的搜索
  const handleSubmittedSearch = () => {
    setSubmittedCurrent(1)
  }

  // 重置我提交的搜索
  const handleSubmittedReset = () => {
    const resetParams = {
      companyName: '',
      unifiedSocialCreditCode: '',
      bookkeepingAccountant: '',
      consultantAccountant: '',
    }
    setSubmittedSearchParams(resetParams)
    submittedForm.resetFields()
    setSubmittedCurrent(1)
  }

  // 处理我负责的搜索
  const handleResponsibleSearch = () => {
    setResponsibleCurrent(1)
  }

  // 重置我负责的搜索
  const handleResponsibleReset = () => {
    const resetParams = {
      companyName: '',
      unifiedSocialCreditCode: '',
      inspector: '',
      bookkeepingAccountant: '',
      consultantAccountant: '',
    }
    setResponsibleSearchParams(resetParams)
    responsibleForm.resetFields()
    setResponsibleCurrent(1)
  }

  // 处理我提交的表格分页变化
  const handleSubmittedTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) {
      setSubmittedCurrent(pagination.current)
    }
    if (pagination.pageSize) {
      setSubmittedPageSize(pagination.pageSize)
    }
  }

  // 处理我负责的表格分页变化
  const handleResponsibleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) {
      setResponsibleCurrent(pagination.current)
    }
    if (pagination.pageSize) {
      setResponsiblePageSize(pagination.pageSize)
    }
  }

  // 查看详情
  const handleViewDetail = (record: FinancialSelfInspection) => {
    navigate(`/financial-self-inspection/detail/${record.id}`)
  }

  // 查看我负责的详情
  const handleViewResponsibleDetail = (record: FinancialSelfInspection) => {
    navigate(`/financial-self-inspection/responsible-detail/${record.id}`)
  }

  // 渲染状态标签
  const renderStatusTag = (record: FinancialSelfInspection) => {
    if (record.inspectorConfirmation) {
      return <Tag color="green">已确认</Tag>
    }
    if (record.rectificationCompletionDate) {
      return <Tag color="blue">整改完成</Tag>
    }
    if (record.problem) {
      return <Tag color="orange">待整改</Tag>
    }
    return <Tag color="default">已提交</Tag>
  }

  // 定义我提交的表格列
  const submittedColumns: ColumnsType<FinancialSelfInspection> = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      render: (text: string | null) => <EllipsisText text={text} maxWidth={180} />,
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'unifiedSocialCreditCode',
      key: 'unifiedSocialCreditCode',
      width: 180,
      render: (text: string | null) => <EllipsisText text={text} maxWidth={160} />,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => renderStatusTag(record),
    },
    {
      title: '记账会计',
      dataIndex: 'bookkeepingAccountant',
      key: 'bookkeepingAccountant',
      width: 120,
      render: (text: string | null) => <EllipsisText text={text} maxWidth={100} />,
    },
    {
      title: '顾问会计',
      dataIndex: 'consultantAccountant',
      key: 'consultantAccountant',
      width: 120,
      render: (text: string | null) => <EllipsisText text={text} maxWidth={100} />,
    },
    {
      title: '抽查日期',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      width: 120,
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '问题',
      dataIndex: 'problem',
      key: 'problem',
      width: 200,
      render: (text: string | null) => <EllipsisText text={text} maxWidth={180} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => handleViewDetail(record)}
        >
          查看
        </Button>
      ),
    },
  ]

  // 定义我负责的表格列
  const responsibleColumns: ColumnsType<FinancialSelfInspection> = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      render: (text: string | null) => <EllipsisText text={text} maxWidth={180} />,
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'unifiedSocialCreditCode',
      key: 'unifiedSocialCreditCode',
      width: 180,
      render: (text: string | null) => <EllipsisText text={text} maxWidth={160} />,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => renderStatusTag(record),
    },
    {
      title: '抽查人',
      dataIndex: 'inspector',
      key: 'inspector',
      width: 120,
      render: (text: string | null) => <EllipsisText text={text} maxWidth={100} />,
    },
    {
      title: '抽查日期',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      width: 120,
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '问题',
      dataIndex: 'problem',
      key: 'problem',
      width: 200,
      render: (text: string | null) => <EllipsisText text={text} maxWidth={180} />,
    },
    {
      title: '整改完成日期',
      dataIndex: 'rectificationCompletionDate',
      key: 'rectificationCompletionDate',
      width: 130,
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            onClick={() => handleViewResponsibleDetail(record)}
          >
            查看
          </Button>
          {!record.rectificationCompletionDate && (
            <Button type="link" size="small">
              整改完成
            </Button>
          )}
          {record.rectificationCompletionDate && !record.inspectorConfirmation && (
            <Button type="link" size="small">
              确认
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="financial-self-inspection-page">
      <div className="mb-6">
        <Title level={2} className="!mb-0">
          账务自查
        </Title>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="我提交的" key="submitted">
            {/* 搜索表单 */}
            <Form
              form={submittedForm}
              layout="vertical"
              className="mb-4"
              initialValues={submittedSearchParams}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="企业名称" name="companyName">
                    <Input
                      placeholder="请输入企业名称"
                      value={submittedSearchParams.companyName}
                      onChange={(e) =>
                        setSubmittedSearchParams({
                          ...submittedSearchParams,
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
                      value={submittedSearchParams.unifiedSocialCreditCode}
                      onChange={(e) =>
                        setSubmittedSearchParams({
                          ...submittedSearchParams,
                          unifiedSocialCreditCode: e.target.value,
                        })
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="记账会计" name="bookkeepingAccountant">
                    <Input
                      placeholder="请输入记账会计"
                      value={submittedSearchParams.bookkeepingAccountant}
                      onChange={(e) =>
                        setSubmittedSearchParams({
                          ...submittedSearchParams,
                          bookkeepingAccountant: e.target.value,
                        })
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="顾问会计" name="consultantAccountant">
                    <Input
                      placeholder="请输入顾问会计"
                      value={submittedSearchParams.consultantAccountant}
                      onChange={(e) =>
                        setSubmittedSearchParams({
                          ...submittedSearchParams,
                          consultantAccountant: e.target.value,
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
                      onClick={handleSubmittedSearch}
                    >
                      搜索
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleSubmittedReset}>
                      重置
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />}>
                      新建自查记录
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>

            {/* 数据表格 */}
            <Table
              columns={submittedColumns}
              dataSource={submittedData}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1300 }}
              pagination={{
                current: submittedCurrent,
                pageSize: submittedPageSize,
                total: submittedTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              }}
              onChange={handleSubmittedTableChange}
            />
          </TabPane>

          <TabPane tab="我负责的" key="responsible">
            {/* 搜索表单 */}
            <Form
              form={responsibleForm}
              layout="vertical"
              className="mb-4"
              initialValues={responsibleSearchParams}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="企业名称" name="companyName">
                    <Input
                      placeholder="请输入企业名称"
                      value={responsibleSearchParams.companyName}
                      onChange={(e) =>
                        setResponsibleSearchParams({
                          ...responsibleSearchParams,
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
                      value={responsibleSearchParams.unifiedSocialCreditCode}
                      onChange={(e) =>
                        setResponsibleSearchParams({
                          ...responsibleSearchParams,
                          unifiedSocialCreditCode: e.target.value,
                        })
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="抽查人" name="inspector">
                    <Input
                      placeholder="请输入抽查人"
                      value={responsibleSearchParams.inspector}
                      onChange={(e) =>
                        setResponsibleSearchParams({
                          ...responsibleSearchParams,
                          inspector: e.target.value,
                        })
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="记账会计" name="bookkeepingAccountant">
                    <Input
                      placeholder="请输入记账会计"
                      value={responsibleSearchParams.bookkeepingAccountant}
                      onChange={(e) =>
                        setResponsibleSearchParams({
                          ...responsibleSearchParams,
                          bookkeepingAccountant: e.target.value,
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
                      onClick={handleResponsibleSearch}
                    >
                      搜索
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleResponsibleReset}>
                      重置
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>

            {/* 数据表格 */}
            <Table
              columns={responsibleColumns}
              dataSource={responsibleData}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1350 }}
              pagination={{
                current: responsibleCurrent,
                pageSize: responsiblePageSize,
                total: responsibleTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              }}
              onChange={handleResponsibleTableChange}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default FinancialSelfInspection 