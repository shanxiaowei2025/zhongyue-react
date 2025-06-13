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
  Modal,
  message,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { usePageStates, PageStatesStore } from '../../store/pageStates'
import { useDebouncedValue } from '../../hooks/useDebounce'
import {
  getMySubmittedInspections,
  getMyResponsibleInspections,
  updateRectificationCompletion,
  updateInspectorConfirmation,
  createFinancialSelfInspection,
} from '../../api/financialSelfInspection'
import type {
  FinancialSelfInspection,
  FinancialSelfInspectionQueryParams,
  RectificationCompletionDto,
  InspectorConfirmationDto,
  CreateFinancialSelfInspectionDto,
} from '../../types/financialSelfInspection'
import { getEnterpriseByNameOrCode } from '../../api/enterpriseService'
import type { Enterprise } from '../../types/enterpriseService'
import { useAuthStore } from '../../store/auth'

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
  
  // 获取当前用户信息
  const { user } = useAuthStore()

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
  const [rectificationForm] = Form.useForm()

  // 整改弹窗状态
  const [rectificationModalVisible, setRectificationModalVisible] = useState<boolean>(false)
  const [rectificationLoading, setRectificationLoading] = useState<boolean>(false)
  const [currentRectificationRecord, setCurrentRectificationRecord] = useState<FinancialSelfInspection | null>(null)

  // 抽查人确认弹窗状态
  const [confirmationModalVisible, setConfirmationModalVisible] = useState<boolean>(false)
  const [confirmationLoading, setConfirmationLoading] = useState<boolean>(false)
  const [currentConfirmationRecord, setCurrentConfirmationRecord] = useState<FinancialSelfInspection | null>(null)
  const [confirmationForm] = Form.useForm()

  // 新建自查记录弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false)
  const [createLoading, setCreateLoading] = useState<boolean>(false)
  const [createForm] = Form.useForm()
  
  // 企业信息查询状态
  const [enterpriseSearchLoading, setEnterpriseSearchLoading] = useState<boolean>(false)

  // 检查用户是否有整改权限（记账会计、管理员、超级管理员）
  const hasRectificationPermission = () => {
    if (!user?.roles || !Array.isArray(user.roles)) {
      console.log('用户角色信息不存在或格式错误:', user?.roles)
      return false
    }
    
    // 允许的角色：记账会计、管理员、超级管理员
    const allowedRoles = ['记账会计', 'admin', 'super_admin', '管理员', '超级管理员']
    
    const hasPermission = user.roles.some(role => allowedRoles.includes(role))
    console.log('用户角色:', user.roles, '是否有整改权限:', hasPermission)
    
    return hasPermission
  }

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

  // 打开整改弹窗
  const handleOpenRectificationModal = (record: FinancialSelfInspection) => {
    setCurrentRectificationRecord(record)
    setRectificationModalVisible(true)
    rectificationForm.resetFields()
  }

  // 关闭整改弹窗
  const handleCloseRectificationModal = () => {
    setRectificationModalVisible(false)
    setCurrentRectificationRecord(null)
    rectificationForm.resetFields()
  }

  // 提交整改
  const handleSubmitRectification = async () => {
    if (!currentRectificationRecord) return

    try {
      const values = await rectificationForm.validateFields()
      setRectificationLoading(true)

      const rectificationData: RectificationCompletionDto = {
        rectificationCompletionDate: values.rectificationCompletionDate.format('YYYY-MM-DD'),
        rectificationResult: values.rectificationResult,
      }

      const response = await updateRectificationCompletion(currentRectificationRecord.id, rectificationData)

      if (response.code === 0) {
        message.success('整改提交成功')
        handleCloseRectificationModal()
        // 重新加载数据
        loadResponsibleData()
      } else {
        message.error(response.message || '整改提交失败')
      }
    } catch (error: any) {
      console.error('整改提交失败:', error)
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          message.error(error.response.data.message.join(', '))
        } else {
          message.error(error.response.data.message)
        }
      } else {
        message.error('整改提交失败，请重试')
      }
    } finally {
      setRectificationLoading(false)
    }
  }

  // 打开抽查人确认弹窗
  const handleOpenConfirmationModal = (record: FinancialSelfInspection) => {
    setCurrentConfirmationRecord(record)
    setConfirmationModalVisible(true)
    confirmationForm.resetFields()
  }

  // 关闭抽查人确认弹窗
  const handleCloseConfirmationModal = () => {
    setConfirmationModalVisible(false)
    setCurrentConfirmationRecord(null)
    confirmationForm.resetFields()
  }

  // 提交抽查人确认
  const handleSubmitConfirmation = async () => {
    if (!currentConfirmationRecord) return

    try {
      const values = await confirmationForm.validateFields()
      setConfirmationLoading(true)

      const confirmationData: InspectorConfirmationDto = {
        inspectorConfirmation: values.inspectorConfirmation.format('YYYY-MM-DD'),
        remarks: values.remarks,
      }

      const response = await updateInspectorConfirmation(currentConfirmationRecord.id, confirmationData)

      if (response.code === 0) {
        message.success('抽查人确认提交成功')
        handleCloseConfirmationModal()
        // 重新加载数据
        loadSubmittedData()
      } else {
        message.error(response.message || '抽查人确认提交失败')
      }
    } catch (error: any) {
      console.error('抽查人确认提交失败:', error)
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          message.error(error.response.data.message.join(', '))
        } else {
          message.error(error.response.data.message)
        }
      } else {
        message.error('抽查人确认提交失败，请重试')
      }
    } finally {
      setConfirmationLoading(false)
    }
  }

  // 根据企业名称或统一社会信用代码查询企业信息
  const handleEnterpriseSearch = async (value: string, field: 'companyName' | 'unifiedSocialCreditCode') => {
    if (!value || value.trim() === '') {
      return
    }

    try {
      setEnterpriseSearchLoading(true)
      const params = field === 'companyName' 
        ? { companyName: value.trim() }
        : { unifiedSocialCreditCode: value.trim() }
      
      const response = await getEnterpriseByNameOrCode(params)
      
      if (response.code === 0 && response.data?.data && response.data.data.length > 0) {
        const enterprise = response.data.data[0] // 取第一个匹配的企业
        
        // 自动填入相关字段
        createForm.setFieldsValue({
          companyName: enterprise.companyName,
          unifiedSocialCreditCode: enterprise.unifiedSocialCreditCode,
          bookkeepingAccountant: enterprise.bookkeepingAccountant || '',
          consultantAccountant: enterprise.consultantAccountant || '',
        })
        
        message.success('企业信息已自动填入')
      } else {
        message.warning('未找到相关企业信息')
      }
    } catch (error) {
      console.error('查询企业信息失败:', error)
      message.error('查询企业信息失败')
    } finally {
      setEnterpriseSearchLoading(false)
    }
  }

  // 打开新建自查记录弹窗
  const handleOpenCreateModal = () => {
    // 先设置抽查人，再重置其他字段
    const inspectorValue = user?.username || ''
    console.log('当前用户信息:', user)
    console.log('设置抽查人为:', inspectorValue)
    
    // 重置表单并设置初始值
    createForm.resetFields()
    createForm.setFieldsValue({
      inspector: inspectorValue
    })
    
    // 打开弹窗
    setCreateModalVisible(true)
  }

  // 关闭新建自查记录弹窗
  const handleCloseCreateModal = () => {
    setCreateModalVisible(false)
    createForm.resetFields()
  }

  // 提交新建自查记录
  const handleSubmitCreate = async () => {
    try {
      const values = await createForm.validateFields()
      setCreateLoading(true)

      const createData: CreateFinancialSelfInspectionDto = {
        inspectionDate: values.inspectionDate?.format('YYYY-MM-DD'),
        companyName: values.companyName,
        unifiedSocialCreditCode: values.unifiedSocialCreditCode,
        bookkeepingAccountant: values.bookkeepingAccountant,
        consultantAccountant: values.consultantAccountant,
        inspector: values.inspector,
        problem: values.problem,
        solution: values.solution,
      }

      const response = await createFinancialSelfInspection(createData)

      if (response.code === 0) {
        message.success('自查记录创建成功')
        handleCloseCreateModal()
        // 重新加载数据
        loadSubmittedData()
      } else {
        message.error(response.message || '自查记录创建失败')
      }
    } catch (error: any) {
      console.error('自查记录创建失败:', error)
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          message.error(error.response.data.message.join(', '))
        } else {
          message.error(error.response.data.message)
        }
      } else {
        message.error('自查记录创建失败，请重试')
      }
    } finally {
      setCreateLoading(false)
    }
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
      width: 100,
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
          {record.rectificationCompletionDate && !record.inspectorConfirmation && (
            <Tooltip title="抽查人确认">
              <Button 
                type="link" 
                size="small"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleOpenConfirmationModal(record)}
              />
            </Tooltip>
          )}
        </Space>
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
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button 
              type="link" 
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewResponsibleDetail(record)}
            />
          </Tooltip>
          {!record.rectificationCompletionDate && hasRectificationPermission() && (
            <Tooltip title="整改">
              <Button 
                type="link" 
                size="small"
                icon={<EditOutlined />}
                style={{ color: '#faad14' }}
                onClick={() => handleOpenRectificationModal(record)}
              />
            </Tooltip>
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
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={handleOpenCreateModal}
                    >
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

      {/* 整改弹窗 */}
      <Modal
        title="整改完成"
        open={rectificationModalVisible}
        onOk={handleSubmitRectification}
        onCancel={handleCloseRectificationModal}
        confirmLoading={rectificationLoading}
        width={600}
        destroyOnClose
      >
        <Form
          form={rectificationForm}
          layout="vertical"
          preserve={false}
        >
          <Form.Item
            label="整改完成日期"
            name="rectificationCompletionDate"
            rules={[
              { required: true, message: '请选择整改完成日期' },
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择整改完成日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>
          
          <Form.Item
            label="整改结果"
            name="rectificationResult"
            rules={[
              { required: true, message: '请输入整改结果' },
              { max: 500, message: '整改结果不能超过500个字符' },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请详细描述整改结果..."
              showCount
              maxLength={500}
            />
          </Form.Item>
                  </Form>
        </Modal>

        {/* 抽查人确认弹窗 */}
        <Modal
          title="抽查人确认"
          open={confirmationModalVisible}
          onOk={handleSubmitConfirmation}
          onCancel={handleCloseConfirmationModal}
          confirmLoading={confirmationLoading}
          width={600}
          destroyOnClose
        >
          <Form
            form={confirmationForm}
            layout="vertical"
            preserve={false}
          >
            <Form.Item
              label="确认日期"
              name="inspectorConfirmation"
              rules={[
                { required: true, message: '请选择确认日期' },
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择确认日期"
                format="YYYY-MM-DD"
              />
            </Form.Item>
            
            <Form.Item
              label="备注"
              name="remarks"
              rules={[
                { max: 500, message: '备注不能超过500个字符' },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder="请输入备注信息（可选）..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 新建自查记录弹窗 */}
        <Modal
          title="新建自查记录"
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
            initialValues={{
              inspector: user?.username || ''
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="抽查日期"
                  name="inspectionDate"
                  rules={[
                    { required: true, message: '请选择抽查日期' },
                  ]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="请选择抽查日期"
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="企业名称"
                  name="companyName"
                  rules={[
                    { required: true, message: '请输入企业名称' },
                    { max: 100, message: '企业名称不能超过100个字符' },
                  ]}
                  extra="输入企业名称后，将自动填入相关信息"
                >
                  <Input 
                    placeholder="请输入企业名称，输入完成后点击其他区域自动查询" 
                    onBlur={(e) => handleEnterpriseSearch(e.target.value, 'companyName')}
                    disabled={enterpriseSearchLoading}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="统一社会信用代码"
                  name="unifiedSocialCreditCode"
                  rules={[
                    { len: 18, message: '统一社会信用代码必须为18位' },
                    { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: '请输入正确的统一社会信用代码格式' },
                  ]}
                  extra="输入统一社会信用代码后，将自动填入相关信息（可选）"
                >
                  <Input 
                    placeholder="请输入统一社会信用代码，输入完成后点击其他区域自动查询" 
                    onBlur={(e) => handleEnterpriseSearch(e.target.value, 'unifiedSocialCreditCode')}
                    disabled={enterpriseSearchLoading}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="记账会计"
                  name="bookkeepingAccountant"
                  extra="此字段将根据企业信息自动填入，无法编辑（可选）"
                >
                  <Input placeholder="记账会计将自动填入" readOnly style={{ backgroundColor: '#f5f5f5' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="顾问会计"
                  name="consultantAccountant"
                  extra="此字段将根据企业信息自动填入，无法编辑（可选）"
                >
                  <Input placeholder="顾问会计将自动填入" readOnly style={{ backgroundColor: '#f5f5f5' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="抽查人"
                  name="inspector"
                  rules={[
                    { required: true, message: '抽查人不能为空' },
                  ]}
                  extra="此字段自动填入当前登录用户，无法编辑"
                >
                  <Input placeholder="抽查人自动填入" readOnly style={{ backgroundColor: '#f5f5f5' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="问题"
              name="problem"
              rules={[
                { required: true, message: '请输入问题描述' },
                { max: 500, message: '问题描述不能超过500个字符' },
              ]}
            >
              <Input.TextArea
                rows={3}
                placeholder="请详细描述发现的问题..."
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
          </Form>
        </Modal>
      </div>
    )
  }

export default FinancialSelfInspection 