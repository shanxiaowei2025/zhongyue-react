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
  Popconfirm,
  Select,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  EditOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { usePageStates, PageStatesStore } from '../../store/pageStates'
import { useDebouncedValue } from '../../hooks/useDebounce'
import {
  useSubmittedInspections,
  useResponsibleInspections,
  useReviewedInspections,
  useFinancialSelfInspectionOperations,
} from '../../hooks/useFinancialSelfInspection'
import { FinancialSelfInspectionStatus } from '../../types/financialSelfInspection'
import type {
  FinancialSelfInspection,
  FinancialSelfInspectionQueryParams,
  RectificationCompletionDto,
  ApprovalDto,
  RejectDto,
  ReviewerApprovalDto,
  ReviewerRejectDto,
  CreateFinancialSelfInspectionDto,
  RectificationRecordItem,
  ApprovalRecordItem,
  RejectRecordItem,
  ReviewerApprovalRecordItem,
  ReviewerRejectRecordItem,
} from '../../types/financialSelfInspection'
import type { Enterprise } from '../../types/enterpriseService'
import CustomerAutoComplete from '../../components/CustomerAutoComplete'
import { useAuthStore } from '../../store/auth'

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
  const savedReviewedSearchParams = getState('financialInspectionReviewedSearchParams')
  const savedSubmittedPagination = getState('financialInspectionSubmittedPagination')
  const savedResponsiblePagination = getState('financialInspectionResponsiblePagination')
  const savedReviewedPagination = getState('financialInspectionReviewedPagination')

  // 状态管理
  const [activeTab, setActiveTab] = useState<string>(savedActiveTab)

  // 我提交的数据
  const [submittedCurrent, setSubmittedCurrent] = useState<number>(
    savedSubmittedPagination?.current || 1
  )
  const [submittedPageSize, setSubmittedPageSize] = useState<number>(
    savedSubmittedPagination?.pageSize || 10
  )
  const [submittedSearchParams, setSubmittedSearchParams] =
    useState<FinancialSelfInspectionQueryParams>({
      companyName: '',
      unifiedSocialCreditCode: '',
      bookkeepingAccountant: '',
      consultantAccountant: '',
      status: undefined,
      inspectionDateStart: undefined,
      inspectionDateEnd: undefined,
      ...(savedSubmittedSearchParams || {}),
    })

  // 我负责的数据
  const [responsibleCurrent, setResponsibleCurrent] = useState<number>(
    savedResponsiblePagination?.current || 1
  )
  const [responsiblePageSize, setResponsiblePageSize] = useState<number>(
    savedResponsiblePagination?.pageSize || 10
  )
  const [responsibleSearchParams, setResponsibleSearchParams] =
    useState<FinancialSelfInspectionQueryParams>({
      companyName: '',
      unifiedSocialCreditCode: '',
      inspector: '',
      bookkeepingAccountant: '',
      consultantAccountant: '',
      status: undefined,
      inspectionDateStart: undefined,
      inspectionDateEnd: undefined,
      ...(savedResponsibleSearchParams || {}),
    })

  // 我复查的数据
  const [reviewedCurrent, setReviewedCurrent] = useState<number>(
    savedReviewedPagination?.current || 1
  )
  const [reviewedPageSize, setReviewedPageSize] = useState<number>(
    savedReviewedPagination?.pageSize || 10
  )
  const [reviewedSearchParams, setReviewedSearchParams] =
    useState<FinancialSelfInspectionQueryParams>({
      companyName: '',
      unifiedSocialCreditCode: '',
      inspector: '',
      bookkeepingAccountant: '',
      consultantAccountant: '',
      status: undefined,
      inspectionDateStart: undefined,
      inspectionDateEnd: undefined,
      ...(savedReviewedSearchParams || {}),
    })

  // 防抖搜索参数
  const debouncedSubmittedSearchParams = useDebouncedValue(submittedSearchParams, 500)
  const debouncedResponsibleSearchParams = useDebouncedValue(responsibleSearchParams, 500)
  const debouncedReviewedSearchParams = useDebouncedValue(reviewedSearchParams, 500)

  // 使用hooks获取数据
  const {
    data: submittedData,
    total: submittedTotal,
    loading: submittedLoading,
    refreshSubmittedInspections,
  } = useSubmittedInspections({
    page: submittedCurrent,
    pageSize: submittedPageSize,
    ...debouncedSubmittedSearchParams,
  })

  const {
    data: responsibleData,
    total: responsibleTotal,
    loading: responsibleLoading,
    refreshResponsibleInspections,
  } = useResponsibleInspections({
    page: responsibleCurrent,
    pageSize: responsiblePageSize,
    ...debouncedResponsibleSearchParams,
  })

  const {
    data: reviewedData,
    total: reviewedTotal,
    loading: reviewedLoading,
    refreshReviewedInspections,
  } = useReviewedInspections({
    page: reviewedCurrent,
    pageSize: reviewedPageSize,
    ...debouncedReviewedSearchParams,
  })

  // 获取操作方法
  const {
    createInspection,
    updateRectification,
    approveInspection,
    rejectInspectionData,
    reviewerApproveInspection,
    reviewerRejectInspectionData,
    deleteInspection,
  } = useFinancialSelfInspectionOperations()

  // 统一loading状态
  const loading = submittedLoading || responsibleLoading || reviewedLoading

  // 表单实例
  const [submittedForm] = Form.useForm()
  const [responsibleForm] = Form.useForm()
  const [reviewedForm] = Form.useForm()
  const [rectificationForm] = Form.useForm()
  const [approvalForm] = Form.useForm()
  const [rejectForm] = Form.useForm()
  const [reviewerApprovalForm] = Form.useForm()
  const [reviewerRejectForm] = Form.useForm()
  const [createForm] = Form.useForm()

  // 弹窗状态
  const [rectificationModalVisible, setRectificationModalVisible] = useState<boolean>(false)
  const [approvalModalVisible, setApprovalModalVisible] = useState<boolean>(false)
  const [rejectModalVisible, setRejectModalVisible] = useState<boolean>(false)
  const [reviewerApprovalModalVisible, setReviewerApprovalModalVisible] = useState<boolean>(false)
  const [reviewerRejectModalVisible, setReviewerRejectModalVisible] = useState<boolean>(false)
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false)

  // 弹窗加载状态
  const [rectificationLoading, setRectificationLoading] = useState<boolean>(false)
  const [approvalLoading, setApprovalLoading] = useState<boolean>(false)
  const [rejectLoading, setRejectLoading] = useState<boolean>(false)
  const [reviewerApprovalLoading, setReviewerApprovalLoading] = useState<boolean>(false)
  const [reviewerRejectLoading, setReviewerRejectLoading] = useState<boolean>(false)
  const [createLoading, setCreateLoading] = useState<boolean>(false)

  // 当前操作的记录
  const [currentRecord, setCurrentRecord] = useState<FinancialSelfInspection | null>(null)

  // 权限检查函数
  const hasRectificationPermission = () => {
    if (!user?.roles || !Array.isArray(user.roles)) {
      return false
    }
    const allowedRoles = [
      '记账会计',
      'admin',
      'super_admin',
      '管理员',
      '超级管理员',
      'bookkeepingAccountant',
    ]
    return user.roles.some(role => allowedRoles.includes(role))
  }

  const hasReviewPermission = () => {
    if (!user?.roles || !Array.isArray(user.roles)) {
      return false
    }
    const allowedRoles = ['admin', 'super_admin', '管理员', '超级管理员']
    return user.roles.some(role => allowedRoles.includes(role))
  }

  // 渲染状态标签
  const renderStatusTag = (record: FinancialSelfInspection) => {
    switch (record.status) {
      case FinancialSelfInspectionStatus.SUBMITTED:
        return <Tag color="orange">待整改</Tag>
      case FinancialSelfInspectionStatus.RECTIFIED:
        return <Tag color="blue">已整改</Tag>
      case FinancialSelfInspectionStatus.INSPECTOR_APPROVED:
        return <Tag color="green">抽查人确认</Tag>
      case FinancialSelfInspectionStatus.INSPECTOR_REJECTED:
        return <Tag color="red">抽查人退回</Tag>
      case FinancialSelfInspectionStatus.REVIEWER_APPROVED:
        return <Tag color="cyan">复查人确认</Tag>
      case FinancialSelfInspectionStatus.REVIEWER_REJECTED:
        return <Tag color="magenta">复查人退回</Tag>
      default:
        return <Tag color="default">未知状态</Tag>
    }
  }

  // 状态保存副作用
  useEffect(() => {
    setState('financialInspectionSubmittedSearchParams', submittedSearchParams)
    setState('financialInspectionSubmittedPagination', {
      current: submittedCurrent,
      pageSize: submittedPageSize,
    })
  }, [submittedSearchParams, submittedCurrent, submittedPageSize, setState])

  useEffect(() => {
    setState('financialInspectionResponsibleSearchParams', responsibleSearchParams)
    setState('financialInspectionResponsiblePagination', {
      current: responsibleCurrent,
      pageSize: responsiblePageSize,
    })
  }, [responsibleSearchParams, responsibleCurrent, responsiblePageSize, setState])

  useEffect(() => {
    setState('financialInspectionReviewedSearchParams', reviewedSearchParams)
    setState('financialInspectionReviewedPagination', {
      current: reviewedCurrent,
      pageSize: reviewedPageSize,
    })
  }, [reviewedSearchParams, reviewedCurrent, reviewedPageSize, setState])

  // 标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setState('financialInspectionActiveTab', key)
  }

  // 搜索和重置处理函数
  const handleSubmittedSearch = () => setSubmittedCurrent(1)
  const handleSubmittedReset = () => {
    const resetParams = {
      companyName: '',
      unifiedSocialCreditCode: '',
      bookkeepingAccountant: '',
      consultantAccountant: '',
      status: undefined,
      inspectionDateStart: undefined,
      inspectionDateEnd: undefined,
    }
    setSubmittedSearchParams(resetParams)
    submittedForm.resetFields()
    setSubmittedCurrent(1)
  }

  const handleResponsibleSearch = () => setResponsibleCurrent(1)
  const handleResponsibleReset = () => {
    const resetParams = {
      companyName: '',
      unifiedSocialCreditCode: '',
      inspector: '',
      bookkeepingAccountant: '',
      consultantAccountant: '',
      status: undefined,
      inspectionDateStart: undefined,
      inspectionDateEnd: undefined,
    }
    setResponsibleSearchParams(resetParams)
    responsibleForm.resetFields()
    setResponsibleCurrent(1)
  }

  const handleReviewedSearch = () => setReviewedCurrent(1)
  const handleReviewedReset = () => {
    const resetParams = {
      companyName: '',
      unifiedSocialCreditCode: '',
      inspector: '',
      bookkeepingAccountant: '',
      consultantAccountant: '',
      status: undefined,
      inspectionDateStart: undefined,
      inspectionDateEnd: undefined,
    }
    setReviewedSearchParams(resetParams)
    reviewedForm.resetFields()
    setReviewedCurrent(1)
  }

  // 分页处理函数
  const handleSubmittedTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setSubmittedCurrent(pagination.current)
    if (pagination.pageSize) setSubmittedPageSize(pagination.pageSize)
  }

  const handleResponsibleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setResponsibleCurrent(pagination.current)
    if (pagination.pageSize) setResponsiblePageSize(pagination.pageSize)
  }

  const handleReviewedTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setReviewedCurrent(pagination.current)
    if (pagination.pageSize) setReviewedPageSize(pagination.pageSize)
  }

  // 查看详情
  const handleViewDetail = (record: FinancialSelfInspection) => {
    navigate(`/financial-self-inspection/detail/${record.id}`)
  }

  const handleViewResponsibleDetail = (record: FinancialSelfInspection) => {
    navigate(`/financial-self-inspection/responsible-detail/${record.id}`)
  }

  const handleViewReviewedDetail = (record: FinancialSelfInspection) => {
    navigate(`/financial-self-inspection/reviewed-detail/${record.id}`)
  }

  // 弹窗处理函数
  const openRectificationModal = (record: FinancialSelfInspection) => {
    setCurrentRecord(record)
    setRectificationModalVisible(true)
    rectificationForm.resetFields()
  }

  const openApprovalModal = (record: FinancialSelfInspection) => {
    setCurrentRecord(record)
    setApprovalModalVisible(true)
    approvalForm.resetFields()
  }

  const openRejectModal = (record: FinancialSelfInspection) => {
    setCurrentRecord(record)
    setRejectModalVisible(true)
    rejectForm.resetFields()
  }

  const openReviewerApprovalModal = (record: FinancialSelfInspection) => {
    setCurrentRecord(record)
    setReviewerApprovalModalVisible(true)
    reviewerApprovalForm.resetFields()
  }

  const openReviewerRejectModal = (record: FinancialSelfInspection) => {
    setCurrentRecord(record)
    setReviewerRejectModalVisible(true)
    reviewerRejectForm.resetFields()
  }

  const openCreateModal = () => {
    const inspectorValue = user?.username || ''
    createForm.resetFields()
    createForm.setFieldsValue({ inspector: inspectorValue })
    setCreateModalVisible(true)
  }

  // 提交处理函数
  const handleSubmitRectification = async () => {
    if (!currentRecord) return

    try {
      const values = await rectificationForm.validateFields()
      setRectificationLoading(true)

      const newRecord: RectificationRecordItem = {
        date: values.date.format('YYYY-MM-DD'),
        result: values.result,
      }

      const rectificationData: RectificationCompletionDto = {
        rectificationRecords: [newRecord],
      }

      await updateRectification(currentRecord.id, rectificationData)
      setRectificationModalVisible(false)
      refreshResponsibleInspections()
    } catch (error: any) {
      console.error('整改提交失败:', error)
    } finally {
      setRectificationLoading(false)
    }
  }

  const handleSubmitApproval = async () => {
    if (!currentRecord) return

    try {
      const values = await approvalForm.validateFields()
      setApprovalLoading(true)

      const newRecord: ApprovalRecordItem = {
        date: values.date.format('YYYY-MM-DD'),
        remark: values.remark,
      }

      const approvalData: ApprovalDto = {
        approvalRecords: [newRecord],
      }

      await approveInspection(currentRecord.id, approvalData)
      setApprovalModalVisible(false)
      refreshSubmittedInspections()
    } catch (error: any) {
      console.error('审核通过失败:', error)
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleSubmitReject = async () => {
    if (!currentRecord) return

    try {
      const values = await rejectForm.validateFields()
      setRejectLoading(true)

      const newRecord: RejectRecordItem = {
        date: values.date.format('YYYY-MM-DD'),
        reason: values.reason,
      }

      const rejectData: RejectDto = {
        rejectRecords: [newRecord],
      }

      await rejectInspectionData(currentRecord.id, rejectData)
      setRejectModalVisible(false)
      refreshSubmittedInspections()
    } catch (error: any) {
      console.error('审核退回失败:', error)
    } finally {
      setRejectLoading(false)
    }
  }

  const handleSubmitReviewerApproval = async () => {
    if (!currentRecord) return

    try {
      const values = await reviewerApprovalForm.validateFields()
      setReviewerApprovalLoading(true)

      const newRecord: ReviewerApprovalRecordItem = {
        date: values.date.format('YYYY-MM-DD'),
        remark: values.remark,
      }

      const reviewerApprovalData: ReviewerApprovalDto = {
        reviewerApprovalRecords: [newRecord],
      }

      await reviewerApproveInspection(currentRecord.id, reviewerApprovalData)
      setReviewerApprovalModalVisible(false)
      refreshReviewedInspections()
    } catch (error: any) {
      console.error('复查审核通过失败:', error)
    } finally {
      setReviewerApprovalLoading(false)
    }
  }

  const handleSubmitReviewerReject = async () => {
    if (!currentRecord) return

    try {
      const values = await reviewerRejectForm.validateFields()
      setReviewerRejectLoading(true)

      const newRecord: ReviewerRejectRecordItem = {
        date: values.date.format('YYYY-MM-DD'),
        reason: values.reason,
      }

      const reviewerRejectData: ReviewerRejectDto = {
        reviewerRejectRecords: [newRecord],
      }

      await reviewerRejectInspectionData(currentRecord.id, reviewerRejectData)
      setReviewerRejectModalVisible(false)
      refreshReviewedInspections()
    } catch (error: any) {
      console.error('复查审核退回失败:', error)
    } finally {
      setReviewerRejectLoading(false)
    }
  }

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

      await createInspection(createData)
      setCreateModalVisible(false)
      refreshSubmittedInspections()
    } catch (error: any) {
      console.error('自查记录创建失败:', error)
    } finally {
      setCreateLoading(false)
    }
  }

  // 删除处理函数
  const handleDelete = async (record: FinancialSelfInspection) => {
    try {
      const success = await deleteInspection(record.id)
      if (success) {
        refreshReviewedInspections()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 客户选择处理函数
  const handleCustomerSelect = (enterprise: Enterprise) => {
    createForm.setFieldsValue({
      companyName: enterprise.companyName,
      unifiedSocialCreditCode: enterprise.unifiedSocialCreditCode,
      bookkeepingAccountant: enterprise.bookkeepingAccountant || '',
      consultantAccountant: enterprise.consultantAccountant || '',
    })
    message.success('企业信息已自动填入')
  }

  // 我提交的表格列
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
      width: 120,
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
      width: 150,
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
          {record.status === FinancialSelfInspectionStatus.RECTIFIED && (
            <>
              <Tooltip title="审核通过">
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => openApprovalModal(record)}
                />
              </Tooltip>
              <Tooltip title="审核退回">
                <Button
                  type="link"
                  size="small"
                  icon={<CloseCircleOutlined />}
                  style={{ color: '#f5222d' }}
                  onClick={() => openRejectModal(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ]

  // 我负责的表格列
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
      width: 120,
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
          {(record.status === FinancialSelfInspectionStatus.SUBMITTED ||
            record.status === FinancialSelfInspectionStatus.INSPECTOR_REJECTED ||
            record.status === FinancialSelfInspectionStatus.REVIEWER_REJECTED) &&
            hasRectificationPermission() && (
              <Tooltip title="整改">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  style={{ color: '#faad14' }}
                  onClick={() => openRectificationModal(record)}
                />
              </Tooltip>
            )}
        </Space>
      ),
    },
  ]

  // 我复查的表格列
  const reviewedColumns: ColumnsType<FinancialSelfInspection> = [
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
      width: 120,
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewReviewedDetail(record)}
            />
          </Tooltip>
          {(record.status === FinancialSelfInspectionStatus.RECTIFIED ||
            record.status === FinancialSelfInspectionStatus.INSPECTOR_APPROVED) && (
            <>
              <Tooltip title="复查通过">
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => openReviewerApprovalModal(record)}
                />
              </Tooltip>
              <Tooltip title="复查退回">
                <Button
                  type="link"
                  size="small"
                  icon={<CloseCircleOutlined />}
                  style={{ color: '#f5222d' }}
                  onClick={() => openReviewerRejectModal(record)}
                />
              </Tooltip>
            </>
          )}
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                size="small"
                icon={<DeleteOutlined />}
                style={{ color: '#f5222d' }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 定义Tab项目
  const tabItems = [
    {
      key: 'submitted',
      label: '我提交的',
      children: (
        <>
          <Form
            form={submittedForm}
            layout="vertical"
            className="mb-4"
            initialValues={submittedSearchParams}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="企业名称" name="companyName">
                  <Input
                    placeholder="请输入企业名称"
                    value={submittedSearchParams.companyName}
                    onChange={e =>
                      setSubmittedSearchParams({
                        ...submittedSearchParams,
                        companyName: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="统一社会信用代码" name="unifiedSocialCreditCode">
                  <Input
                    placeholder="请输入统一社会信用代码"
                    value={submittedSearchParams.unifiedSocialCreditCode}
                    onChange={e =>
                      setSubmittedSearchParams({
                        ...submittedSearchParams,
                        unifiedSocialCreditCode: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="记账会计" name="bookkeepingAccountant">
                  <Input
                    placeholder="请输入记账会计"
                    value={submittedSearchParams.bookkeepingAccountant}
                    onChange={e =>
                      setSubmittedSearchParams({
                        ...submittedSearchParams,
                        bookkeepingAccountant: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="顾问会计" name="consultantAccountant">
                  <Input
                    placeholder="请输入顾问会计"
                    value={submittedSearchParams.consultantAccountant}
                    onChange={e =>
                      setSubmittedSearchParams({
                        ...submittedSearchParams,
                        consultantAccountant: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="状态" name="status">
                  <Select
                    placeholder="请选择状态"
                    allowClear
                    value={submittedSearchParams.status}
                    onChange={value =>
                      setSubmittedSearchParams({
                        ...submittedSearchParams,
                        status: value,
                      })
                    }
                  >
                    <Select.Option value={FinancialSelfInspectionStatus.SUBMITTED}>
                      待整改
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.RECTIFIED}>
                      已整改
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.INSPECTOR_APPROVED}>
                      抽查人确认
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.INSPECTOR_REJECTED}>
                      抽查人退回
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.REVIEWER_APPROVED}>
                      复查人确认
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.REVIEWER_REJECTED}>
                      复查人退回
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="抽查日期" name="inspectionDateRange">
                  <RangePicker
                    placeholder={['开始日期', '结束日期']}
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    value={
                      submittedSearchParams.inspectionDateStart &&
                      submittedSearchParams.inspectionDateEnd
                        ? [
                            dayjs(submittedSearchParams.inspectionDateStart),
                            dayjs(submittedSearchParams.inspectionDateEnd),
                          ]
                        : submittedSearchParams.inspectionDateStart
                          ? [dayjs(submittedSearchParams.inspectionDateStart), null]
                          : submittedSearchParams.inspectionDateEnd
                            ? [null, dayjs(submittedSearchParams.inspectionDateEnd)]
                            : null
                    }
                    onChange={dates =>
                      setSubmittedSearchParams({
                        ...submittedSearchParams,
                        inspectionDateStart: dates?.[0]?.format('YYYY-MM-DD'),
                        inspectionDateEnd: dates?.[1]?.format('YYYY-MM-DD'),
                      })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSubmittedSearch}>
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleSubmittedReset}>
                    重置
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    新建自查记录
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>

          <Table
            columns={submittedColumns}
            dataSource={submittedData}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={{
              current: submittedCurrent,
              pageSize: submittedPageSize,
              total: submittedTotal,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            onChange={handleSubmittedTableChange}
          />
        </>
      ),
    },
    {
      key: 'responsible',
      label: '我负责的',
      children: (
        <>
          <Form
            form={responsibleForm}
            layout="vertical"
            className="mb-4"
            initialValues={responsibleSearchParams}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="企业名称" name="companyName">
                  <Input
                    placeholder="请输入企业名称"
                    value={responsibleSearchParams.companyName}
                    onChange={e =>
                      setResponsibleSearchParams({
                        ...responsibleSearchParams,
                        companyName: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="统一社会信用代码" name="unifiedSocialCreditCode">
                  <Input
                    placeholder="请输入统一社会信用代码"
                    value={responsibleSearchParams.unifiedSocialCreditCode}
                    onChange={e =>
                      setResponsibleSearchParams({
                        ...responsibleSearchParams,
                        unifiedSocialCreditCode: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="抽查人" name="inspector">
                  <Input
                    placeholder="请输入抽查人"
                    value={responsibleSearchParams.inspector}
                    onChange={e =>
                      setResponsibleSearchParams({
                        ...responsibleSearchParams,
                        inspector: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="记账会计" name="bookkeepingAccountant">
                  <Input
                    placeholder="请输入记账会计"
                    value={responsibleSearchParams.bookkeepingAccountant}
                    onChange={e =>
                      setResponsibleSearchParams({
                        ...responsibleSearchParams,
                        bookkeepingAccountant: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="状态" name="status">
                  <Select
                    placeholder="请选择状态"
                    allowClear
                    value={responsibleSearchParams.status}
                    onChange={value =>
                      setResponsibleSearchParams({
                        ...responsibleSearchParams,
                        status: value,
                      })
                    }
                  >
                    <Select.Option value={FinancialSelfInspectionStatus.SUBMITTED}>
                      待整改
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.RECTIFIED}>
                      已整改
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.INSPECTOR_APPROVED}>
                      抽查人确认
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.INSPECTOR_REJECTED}>
                      抽查人退回
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.REVIEWER_APPROVED}>
                      复查人确认
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.REVIEWER_REJECTED}>
                      复查人退回
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="抽查日期" name="inspectionDateRange">
                  <RangePicker
                    placeholder={['开始日期', '结束日期']}
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    value={
                      responsibleSearchParams.inspectionDateStart &&
                      responsibleSearchParams.inspectionDateEnd
                        ? [
                            dayjs(responsibleSearchParams.inspectionDateStart),
                            dayjs(responsibleSearchParams.inspectionDateEnd),
                          ]
                        : responsibleSearchParams.inspectionDateStart
                          ? [dayjs(responsibleSearchParams.inspectionDateStart), null]
                          : responsibleSearchParams.inspectionDateEnd
                            ? [null, dayjs(responsibleSearchParams.inspectionDateEnd)]
                            : null
                    }
                    onChange={dates =>
                      setResponsibleSearchParams({
                        ...responsibleSearchParams,
                        inspectionDateStart: dates?.[0]?.format('YYYY-MM-DD'),
                        inspectionDateEnd: dates?.[1]?.format('YYYY-MM-DD'),
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
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            onChange={handleResponsibleTableChange}
          />
        </>
      ),
    },
  ]

  // 如果有复查权限，添加我复查的标签页
  if (hasReviewPermission()) {
    tabItems.push({
      key: 'reviewed',
      label: '我复查的',
      children: (
        <>
          <Form
            form={reviewedForm}
            layout="vertical"
            className="mb-4"
            initialValues={reviewedSearchParams}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="企业名称" name="companyName">
                  <Input
                    placeholder="请输入企业名称"
                    value={reviewedSearchParams.companyName}
                    onChange={e =>
                      setReviewedSearchParams({
                        ...reviewedSearchParams,
                        companyName: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="统一社会信用代码" name="unifiedSocialCreditCode">
                  <Input
                    placeholder="请输入统一社会信用代码"
                    value={reviewedSearchParams.unifiedSocialCreditCode}
                    onChange={e =>
                      setReviewedSearchParams({
                        ...reviewedSearchParams,
                        unifiedSocialCreditCode: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="抽查人" name="inspector">
                  <Input
                    placeholder="请输入抽查人"
                    value={reviewedSearchParams.inspector}
                    onChange={e =>
                      setReviewedSearchParams({
                        ...reviewedSearchParams,
                        inspector: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="记账会计" name="bookkeepingAccountant">
                  <Input
                    placeholder="请输入记账会计"
                    value={reviewedSearchParams.bookkeepingAccountant}
                    onChange={e =>
                      setReviewedSearchParams({
                        ...reviewedSearchParams,
                        bookkeepingAccountant: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="状态" name="status">
                  <Select
                    placeholder="请选择状态"
                    allowClear
                    value={reviewedSearchParams.status}
                    onChange={value =>
                      setReviewedSearchParams({
                        ...reviewedSearchParams,
                        status: value,
                      })
                    }
                  >
                    <Select.Option value={FinancialSelfInspectionStatus.SUBMITTED}>
                      待整改
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.RECTIFIED}>
                      已整改
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.INSPECTOR_APPROVED}>
                      抽查人确认
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.INSPECTOR_REJECTED}>
                      抽查人退回
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.REVIEWER_APPROVED}>
                      复查人确认
                    </Select.Option>
                    <Select.Option value={FinancialSelfInspectionStatus.REVIEWER_REJECTED}>
                      复查人退回
                    </Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="抽查日期" name="inspectionDateRange">
                  <RangePicker
                    placeholder={['开始日期', '结束日期']}
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    value={
                      reviewedSearchParams.inspectionDateStart &&
                      reviewedSearchParams.inspectionDateEnd
                        ? [
                            dayjs(reviewedSearchParams.inspectionDateStart),
                            dayjs(reviewedSearchParams.inspectionDateEnd),
                          ]
                        : reviewedSearchParams.inspectionDateStart
                          ? [dayjs(reviewedSearchParams.inspectionDateStart), null]
                          : reviewedSearchParams.inspectionDateEnd
                            ? [null, dayjs(reviewedSearchParams.inspectionDateEnd)]
                            : null
                    }
                    onChange={dates =>
                      setReviewedSearchParams({
                        ...reviewedSearchParams,
                        inspectionDateStart: dates?.[0]?.format('YYYY-MM-DD'),
                        inspectionDateEnd: dates?.[1]?.format('YYYY-MM-DD'),
                      })
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleReviewedSearch}>
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReviewedReset}>
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>

          <Table
            columns={reviewedColumns}
            dataSource={reviewedData}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1450 }}
            pagination={{
              current: reviewedCurrent,
              pageSize: reviewedPageSize,
              total: reviewedTotal,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            onChange={handleReviewedTableChange}
          />
        </>
      ),
    })
  }

  return (
    <div className="financial-self-inspection-page">
      <Card>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
      </Card>

      {/* 整改弹窗 */}
      <Modal
        title="整改完成"
        open={rectificationModalVisible}
        onOk={handleSubmitRectification}
        onCancel={() => setRectificationModalVisible(false)}
        confirmLoading={rectificationLoading}
        width={600}
        destroyOnClose
      >
        <Form form={rectificationForm} layout="vertical" preserve={false}>
          <Form.Item
            label="整改完成日期"
            name="date"
            rules={[{ required: true, message: '请选择整改完成日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择整改完成日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item
            label="整改结果"
            name="result"
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

      {/* 审核通过弹窗 */}
      <Modal
        title="审核通过"
        open={approvalModalVisible}
        onOk={handleSubmitApproval}
        onCancel={() => setApprovalModalVisible(false)}
        confirmLoading={approvalLoading}
        width={600}
        destroyOnClose
      >
        <Form form={approvalForm} layout="vertical" preserve={false}>
          <Form.Item
            label="确认日期"
            name="date"
            rules={[{ required: true, message: '请选择确认日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择确认日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item
            label="备注"
            name="remark"
            rules={[
              { required: true, message: '请输入备注信息' },
              { max: 500, message: '备注不能超过500个字符' },
            ]}
          >
            <Input.TextArea rows={4} placeholder="请输入备注信息..." showCount maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 审核退回弹窗 */}
      <Modal
        title="审核退回"
        open={rejectModalVisible}
        onOk={handleSubmitReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={rejectLoading}
        width={600}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical" preserve={false}>
          <Form.Item
            label="退回日期"
            name="date"
            rules={[{ required: true, message: '请选择退回日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择退回日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item
            label="退回原因"
            name="reason"
            rules={[
              { required: true, message: '请输入退回原因' },
              { max: 500, message: '退回原因不能超过500个字符' },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请详细说明退回原因..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 复查审核通过弹窗 */}
      <Modal
        title="复查审核通过"
        open={reviewerApprovalModalVisible}
        onOk={handleSubmitReviewerApproval}
        onCancel={() => setReviewerApprovalModalVisible(false)}
        confirmLoading={reviewerApprovalLoading}
        width={600}
        destroyOnClose
      >
        <Form form={reviewerApprovalForm} layout="vertical" preserve={false}>
          <Form.Item
            label="确认日期"
            name="date"
            rules={[{ required: true, message: '请选择确认日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择确认日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item
            label="备注"
            name="remark"
            rules={[
              { required: true, message: '请输入备注信息' },
              { max: 500, message: '备注不能超过500个字符' },
            ]}
          >
            <Input.TextArea rows={4} placeholder="请输入备注信息..." showCount maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 复查审核退回弹窗 */}
      <Modal
        title="复查审核退回"
        open={reviewerRejectModalVisible}
        onOk={handleSubmitReviewerReject}
        onCancel={() => setReviewerRejectModalVisible(false)}
        confirmLoading={reviewerRejectLoading}
        width={600}
        destroyOnClose
      >
        <Form form={reviewerRejectForm} layout="vertical" preserve={false}>
          <Form.Item
            label="退回日期"
            name="date"
            rules={[{ required: true, message: '请选择退回日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择退回日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item
            label="退回原因"
            name="reason"
            rules={[
              { required: true, message: '请输入退回原因' },
              { max: 500, message: '退回原因不能超过500个字符' },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请详细说明退回原因..."
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
        onCancel={() => setCreateModalVisible(false)}
        confirmLoading={createLoading}
        width={800}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          preserve={false}
          initialValues={{
            inspector: user?.username || '',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="抽查日期"
                name="inspectionDate"
                rules={[{ required: true, message: '请选择抽查日期' }]}
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
                extra="输入企业名称进行搜索，选择后将自动填入相关信息"
              >
                <CustomerAutoComplete
                  placeholder="请输入企业名称进行搜索"
                  searchType="companyName"
                  onSelect={handleCustomerSelect}
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
                  onSelect={handleCustomerSelect}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="记账会计"
                name="bookkeepingAccountant"
                extra="此字段将根据企业信息自动填入，无法编辑（可选）"
              >
                <Input
                  placeholder="记账会计将自动填入"
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                />
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
                <Input
                  placeholder="顾问会计将自动填入"
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="抽查人"
                name="inspector"
                rules={[{ required: true, message: '抽查人不能为空' }]}
                extra="此字段自动填入当前登录用户，无法编辑"
              >
                <Input
                  placeholder="抽查人自动填入"
                  readOnly
                  style={{ backgroundColor: '#f5f5f5' }}
                />
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
