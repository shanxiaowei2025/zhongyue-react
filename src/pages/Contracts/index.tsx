import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Form,
  DatePicker,
  Tag,
  Modal,
  message,
  Tooltip,
  Row,
  Col,
  Steps,
  Radio,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { usePageStates } from '../../hooks/usePageStates'
import { useContractList } from '../../hooks/useContract'
import { usePermission } from '../../hooks/usePermission'
import PermissionGuard from '../../components/PermissionGuard'
import type { Contract, ContractQueryParams, ContractStatus } from '../../types/contract'
import {
  getContractList,
  getContractById,
  createContract as createContractApi,
  updateContract as updateContractApi,
  deleteContract as deleteContractApi,
  signContract as signContractApi,
  generateContractToken,
} from '../../api/contract'
import SignatureCanvas from '../../components/contracts/SignatureCanvas'
import { useDebouncedValue } from '../../hooks/useDebounce'

// 添加样式来隔离签署模态框
const modalStyle = `
  .contract-signature-modal .contract-signature-modal-content {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
  }
  
  .contract-signature-modal .signature-modal-content-container {
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    border-radius: 0 !important;
  }
  
  .contract-signature-modal .signature-canvas-wrapper {
    border: 1px solid #d1d5db !important;
    border-radius: 6px !important;
    background: white !important;
    margin-bottom: 16px !important;
  }
  
  .contract-signature-modal .signature-modal-canvas {
    display: block !important;
    width: 100% !important;
    background: white !important;
  }
  
  .contract-signature-modal .signature-modal-actions {
    display: flex !important;
    gap: 12px !important;
    justify-content: center !important;
    margin-top: 16px !important;
  }
  
  .contract-signature-modal .ant-typography {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    color: #374151 !important;
  }

  /* 合同表格tooltip样式 */
  .contract-table-tooltip {
    max-width: 300px;
    word-wrap: break-word;
    z-index: 1060;
  }

  /* 确保表格单元格相对定位 */
  .contract-table .ant-table-tbody > tr > td {
    position: relative;
  }
`

const { RangePicker } = DatePicker
const { Option } = Select
const { Step } = Steps

// 签署方选项
const SIGNATORY_OPTIONS = [
  '定兴县中岳会计服务有限公司',
  '定兴县中岳会计服务有限公司河北雄安分公司',
  '定兴县中岳会计服务有限公司高碑店分公司',
  '保定脉信会计服务有限公司',
  '定兴县金盾企业管理咨询有限公司',
  '保定如你心意企业管理咨询有限公司',
]

// 合同类型选项映射
const CONTRACT_TYPE_OPTIONS = {
  // 前4个签署方的合同类型
  group1: ['产品服务协议', '代理记账合同'],
  // 后2个签署方的合同类型
  group2: ['单项服务合同'],
}

// 获取签署方对应的合同类型选项
const getContractTypeOptions = (signatory: string) => {
  const group1Signatories = [
    '定兴县中岳会计服务有限公司',
    '定兴县中岳会计服务有限公司河北雄安分公司',
    '定兴县中岳会计服务有限公司高碑店分公司',
    '保定脉信会计服务有限公司',
  ]

  return group1Signatories.includes(signatory)
    ? CONTRACT_TYPE_OPTIONS.group1
    : CONTRACT_TYPE_OPTIONS.group2
}

// 获取所有可能的合同类型选项（用于搜索）
const getAllContractTypeOptions = () => {
  return [...CONTRACT_TYPE_OPTIONS.group1, ...CONTRACT_TYPE_OPTIONS.group2]
}

// 合同状态选项
const CONTRACT_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '未签署', value: '0' },
  { label: '已签署', value: '1' },
  { label: '已终止', value: '2' },
]

// 合同状态标签映射
const getStatusTag = (status?: ContractStatus) => {
  switch (status) {
    case '0':
      return <Tag color="default">未签署</Tag>
    case '1':
      return <Tag color="success">已签署</Tag>
    case '2':
      return <Tag color="error">已终止</Tag>
    default:
      return <Tag color="default">未知</Tag>
  }
}

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
        overlayClassName="contract-table-tooltip"
        mouseEnterDelay={0.3}
      >
        {content}
      </Tooltip>
    )
  }

  return content
}

const Contracts: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  // 获取权限控制
  const { contractPermissions } = usePermission()

  // 发起合同模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createStep, setCreateStep] = useState(0)
  const [selectedSignatory, setSelectedSignatory] = useState<string>('')
  const [selectedContractType, setSelectedContractType] = useState<string>('')

  // 添加样式隔离
  useEffect(() => {
    const styleElement = document.getElementById('contract-signature-modal-styles')
    if (!styleElement) {
      const style = document.createElement('style')
      style.id = 'contract-signature-modal-styles'
      style.textContent = modalStyle
      document.head.appendChild(style)
    }

    // 清理函数，组件卸载时移除样式
    return () => {
      const element = document.getElementById('contract-signature-modal-styles')
      if (element) {
        element.remove()
      }
    }
  }, [])

  // 页面状态持久化
  const [searchParams, setSearchParams] = usePageStates<
    Omit<ContractQueryParams, 'page' | 'pageSize'>
  >('contract-list-search', {
    contractNumber: '',
    partyACompany: '',
    partyACreditCode: '',
    contractType: '',
    signatory: '',
    contractStatus: undefined,
    partyASignDateStart: '',
    partyASignDateEnd: '',
    createTimeStart: '',
    createTimeEnd: '',
  })

  const [pagination, setPagination] = usePageStates('contract-list-pagination', {
    page: 1,
    pageSize: 10,
  })

  // 构建查询参数
  const queryParams: ContractQueryParams = {
    ...searchParams,
    ...pagination,
  }

  // 添加防抖搜索参数
  const debouncedSearchParams = useDebouncedValue(searchParams, 500)

  // 构建查询参数
  const debouncedQueryParams: ContractQueryParams = {
    ...debouncedSearchParams,
    ...pagination,
  }

  // 获取合同数据
  const {
    data: contracts,
    total,
    currentPage,
    pageSize,
    isLoading,
    refreshContractList,
    removeContract,
    doSignContract,
  } = useContractList(debouncedQueryParams)

  // 设置表单初始值
  useEffect(() => {
    form.setFieldsValue({
      ...searchParams,
      partyASignDateRange:
        searchParams.partyASignDateStart && searchParams.partyASignDateEnd
          ? [dayjs(searchParams.partyASignDateStart), dayjs(searchParams.partyASignDateEnd)]
          : undefined,
      createTimeRange:
        searchParams.createTimeStart && searchParams.createTimeEnd
          ? [dayjs(searchParams.createTimeStart), dayjs(searchParams.createTimeEnd)]
          : undefined,
    })
  }, [form, searchParams])

  // 搜索处理
  const handleSearch = () => {
    const values = form.getFieldsValue()

    // 处理日期范围
    const newSearchParams = {
      contractNumber: values.contractNumber || '',
      partyACompany: values.partyACompany || '',
      partyACreditCode: values.partyACreditCode || '',
      contractType: values.contractType || '',
      signatory: values.signatory || '',
      contractStatus: values.contractStatus || undefined,
      partyASignDateStart: values.partyASignDateRange?.[0]?.format('YYYY-MM-DD') || '',
      partyASignDateEnd: values.partyASignDateRange?.[1]?.format('YYYY-MM-DD') || '',
      createTimeStart: values.createTimeRange?.[0]?.format('YYYY-MM-DD') || '',
      createTimeEnd: values.createTimeRange?.[1]?.format('YYYY-MM-DD') || '',
    }

    setSearchParams(newSearchParams)
    setPagination({ page: 1, pageSize: pagination.pageSize })
  }

  // 重置搜索
  const handleReset = () => {
    const resetParams = {
      contractNumber: '',
      partyACompany: '',
      partyACreditCode: '',
      contractType: '',
      signatory: '',
      contractStatus: undefined as ContractStatus | undefined,
      partyASignDateStart: '',
      partyASignDateEnd: '',
      createTimeStart: '',
      createTimeEnd: '',
    }

    setSearchParams(resetParams)
    setPagination({ page: 1, pageSize: pagination.pageSize })
    form.resetFields()
  }

  // 分页改变处理
  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      page: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    })
  }

  // 新增合同 - 打开模态框
  const handleAdd = () => {
    setCreateModalVisible(true)
    setCreateStep(0)
    setSelectedSignatory('')
    setSelectedContractType('')
  }

  // 关闭发起合同模态框
  const handleCreateModalCancel = () => {
    setCreateModalVisible(false)
    setCreateStep(0)
    setSelectedSignatory('')
    setSelectedContractType('')
  }

  // 下一步
  const handleNextStep = () => {
    if (createStep === 0 && selectedSignatory) {
      setCreateStep(1)
      setSelectedContractType('') // 重置合同类型选择
    }
  }

  // 上一步
  const handlePrevStep = () => {
    if (createStep === 1) {
      setCreateStep(0)
    }
  }

  // 确认创建合同
  const handleConfirmCreate = () => {
    if (selectedSignatory && selectedContractType) {
      // 跳转到合同创建页面，传递选择的参数
      navigate('/contracts/create', {
        state: {
          signatory: selectedSignatory,
          contractType: selectedContractType,
        },
      })

      // 关闭模态框
      handleCreateModalCancel()
    }
  }

  // 查看合同详情
  const handleView = (record: Contract) => {
    // TODO: 跳转到合同详情页面
    navigate(`/contracts/detail/${record.id}`)
  }

  // 编辑合同
  const handleEdit = (record: Contract) => {
    // TODO: 跳转到合同编辑页面
    navigate(`/contracts/edit/${record.id}`)
  }

  // 删除合同
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这个合同吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        await removeContract(id)
      },
    })
  }

  // 签署合同
  const handleSign = (record: Contract) => {
    let signatureImageUrl = ''

    Modal.confirm({
      title: '签署合同',
      icon: null,
      width: 700,
      className: 'contract-signature-modal',
      wrapClassName: 'contract-signature-modal-wrap',
      mask: true,
      maskClosable: true,
      content: (
        <div className="contract-signature-modal-content bg-white p-4 rounded">
          <div className="mb-6 text-center">
            <p className="text-base text-gray-700">
              您正在签署合同{' '}
              <span className="font-semibold text-blue-600">
                {record.contractNumber || `#${record.id}`}
              </span>
            </p>
          </div>

          {/* 使用直接导入的SignatureCanvas组件 */}
          <div className="contract-signature-area bg-gray-50 p-4 rounded-lg">
            <SignatureCanvas
              onSave={(url: string) => {
                signatureImageUrl = url
                // 自动点击确认按钮
                document
                  .querySelector('.contract-signature-modal .ant-btn-primary')
                  ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
              }}
            />
          </div>
        </div>
      ),
      okText: '确认签署',
      cancelText: '取消',
      onOk: async () => {
        if (!signatureImageUrl) {
          message.error('请先完成签名')
          return Promise.reject('未完成签名')
        }

        try {
          // 准备更新数据：签章图片 + 自动设置签名日期（如果为空）
          const currentDate = dayjs().format('YYYY-MM-DD')
          const updateData: any = {
            partyAStampImage: signatureImageUrl,
          }

          // 如果甲方签订日期为空，自动设置为当前日期
          if (!record.partyASignDate) {
            updateData.partyASignDate = currentDate
          }

          // 如果乙方签订日期为空，自动设置为当前日期
          if (!record.partyBSignDate) {
            updateData.partyBSignDate = currentDate
          }

          // 1. 更新合同的签章图片和日期
          await updateContractApi(record.id, updateData)

          // 2. 签署合同
          const signature = `${new Date().toISOString()}_${record.id}`
          await doSignContract(record.id, { signature })

          message.success('合同签署成功')
          return Promise.resolve()
        } catch (error) {
          console.error('签署失败:', error)
          message.error('签署失败，请重试')
          return Promise.reject(error)
        }
      },
    })
  }

  // 生成签署链接
  const handleGenerateSignLink = async (record: Contract) => {
    // 不再打开模态框，直接跳转到合同详情页面
    navigate(`/contracts/detail/${record.id}?generateLink=true`)
  }

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return dayjs(dateString).format('YYYY-MM-DD')
  }

  // 格式化日期时间
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
    return dayjs(dateString).format('YYYY-MM-DD HH:mm')
  }

  // 获取当前步骤的合同类型选项
  const currentContractTypeOptions = selectedSignatory
    ? getContractTypeOptions(selectedSignatory)
    : []

  // 表格列定义
  const columns: ColumnsType<Contract> = [
    {
      title: '合同编号',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      width: 170,
      fixed: 'left',
      render: text => <EllipsisText text={text || '-'} maxWidth={150} />,
    },
    {
      title: '签署方',
      dataIndex: 'signatory',
      key: 'signatory',
      width: 150,
      render: text => <EllipsisText text={text || '-'} maxWidth={130} />,
    },
    {
      title: '甲方公司',
      dataIndex: 'partyACompany',
      key: 'partyACompany',
      width: 190,
      render: text => <EllipsisText text={text || '-'} maxWidth={170} />,
    },
    {
      title: '甲方信用代码',
      dataIndex: 'partyACreditCode',
      key: 'partyACreditCode',
      width: 160,
      render: text => <EllipsisText text={text || '-'} maxWidth={140} />,
    },
    {
      title: '合同类型',
      dataIndex: 'contractType',
      key: 'contractType',
      width: 120,
      render: text => <EllipsisText text={text || '-'} maxWidth={100} />,
    },
    {
      title: '甲方签订日期',
      dataIndex: 'partyASignDate',
      key: 'partyASignDate',
      width: 120,
      render: text => {
        const formattedDate = formatDate(text)
        return <EllipsisText text={formattedDate} maxWidth={100} />
      },
    },
    {
      title: '委托期限',
      key: 'entrustmentPeriod',
      width: 180,
      render: (_, record) => {
        const start = record.entrustmentStartDate
        const end = record.entrustmentEndDate
        let content = '-'
        if (start && end) {
          content = `${formatDate(start)} 至 ${formatDate(end)}`
        } else if (start) {
          content = `自 ${formatDate(start)}`
        } else if (end) {
          content = `至 ${formatDate(end)}`
        }
        return <EllipsisText text={content} maxWidth={160} />
      },
    },
    {
      title: '费用总计',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 100,
      align: 'right',
      render: value => {
        const content = value ? `¥${value.toLocaleString()}` : '-'
        return <EllipsisText text={content} maxWidth={80} />
      },
    },
    {
      title: '合同状态',
      dataIndex: 'contractStatus',
      key: 'contractStatus',
      width: 100,
      align: 'center',
      render: status => {
        const statusTag = getStatusTag(status)
        const statusText =
          status === '0' ? '未签署' : status === '1' ? '已签署' : status === '2' ? '已终止' : '未知'
        return (
          <Tooltip
            title={statusText}
            placement="topLeft"
            overlayClassName="contract-table-tooltip"
            mouseEnterDelay={0.3}
          >
            <span style={{ cursor: 'pointer' }}>{statusTag}</span>
          </Tooltip>
        )
      },
    },
    {
      title: '提交人',
      dataIndex: 'submitter',
      key: 'submitter',
      width: 100,
      render: text => <EllipsisText text={text || '-'} maxWidth={80} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 140,
      render: text => {
        const formattedDateTime = formatDateTime(text)
        return <EllipsisText text={formattedDateTime} maxWidth={120} />
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" className="action-buttons">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              className="action-btn view-btn"
            />
          </Tooltip>
          {/* 使用权限控制编辑按钮 */}
          {record.contractStatus === '0' && contractPermissions.canEdit && (
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                className="action-btn edit-btn"
              />
            </Tooltip>
          )}
          {record.contractStatus === '0' && (
            <Tooltip title="生成签署链接">
              <Button
                type="text"
                size="small"
                icon={<FileTextOutlined />}
                onClick={() => handleGenerateSignLink(record)}
                className="action-btn"
                style={{ color: '#1890ff' }}
              />
            </Tooltip>
          )}
          {/* 使用权限控制删除按钮 */}
          {contractPermissions.canDelete && (
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                className="action-btn delete-btn"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 搜索区域 */}
      <div className="mb-4">
        <Form
          form={form}
          layout="inline"
          className="contract-search-form"
          onValuesChange={() => {
            // 当表单值变化时自动搜索（通过防抖处理）
            const values = form.getFieldsValue()
            const newSearchParams = {
              contractNumber: values.contractNumber || '',
              partyACompany: values.partyACompany || '',
              partyACreditCode: values.partyACreditCode || '',
              contractType: values.contractType || '',
              signatory: values.signatory || '',
              contractStatus: values.contractStatus || undefined,
              partyASignDateStart: values.partyASignDateRange?.[0]?.format('YYYY-MM-DD') || '',
              partyASignDateEnd: values.partyASignDateRange?.[1]?.format('YYYY-MM-DD') || '',
              createTimeStart: values.createTimeRange?.[0]?.format('YYYY-MM-DD') || '',
              createTimeEnd: values.createTimeRange?.[1]?.format('YYYY-MM-DD') || '',
            }
            setSearchParams(newSearchParams)
            setPagination({ page: 1, pageSize: pagination.pageSize })
          }}
        >
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2">
              <Form.Item label="合同编号" name="contractNumber" className="mb-2">
                <Input placeholder="请输入合同编号" className="w-40" allowClear />
              </Form.Item>
              <Form.Item label="甲方公司" name="partyACompany" className="mb-2">
                <Input placeholder="请输入甲方公司名称" className="w-40" allowClear />
              </Form.Item>
              <Form.Item label="甲方信用代码" name="partyACreditCode" className="mb-2">
                <Input placeholder="请输入统一社会信用代码" className="w-40" allowClear />
              </Form.Item>
              <Form.Item label="签署方" name="signatory" className="mb-2">
                <Select placeholder="请选择签署方" className="w-40" allowClear>
                  {SIGNATORY_OPTIONS.map(signatory => (
                    <Option key={signatory} value={signatory}>
                      {signatory}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="合同类型" name="contractType" className="mb-2">
                <Select placeholder="请选择合同类型" className="w-40" allowClear>
                  {getAllContractTypeOptions().map(contractType => (
                    <Option key={contractType} value={contractType}>
                      {contractType}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="合同状态" name="contractStatus" className="mb-2">
                <Select placeholder="请选择合同状态" className="w-40" allowClear>
                  {CONTRACT_STATUS_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="甲方签订日期"
                name="partyASignDateRange"
                className="mb-2 col-span-1 lg:col-span-2"
              >
                <RangePicker className="w-full" />
              </Form.Item>
              <Form.Item
                label="创建时间"
                name="createTimeRange"
                className="mb-2 col-span-1 lg:col-span-2"
              >
                <RangePicker className="w-full" />
              </Form.Item>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
              {/* 使用权限控制"发起合同"按钮 */}
              {contractPermissions.canCreate && (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  发起合同
                </Button>
              )}
            </div>
          </div>
        </Form>
      </div>

      {/* 表格区域 */}
      <div>
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1400 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          className="contract-table"
        />
      </div>

      {/* 发起合同模态框 */}
      <Modal
        title="发起合同"
        open={createModalVisible}
        onCancel={handleCreateModalCancel}
        footer={null}
        width={600}
        destroyOnClose
        className="contract-create-modal"
      >
        <div className="py-4">
          {/* 步骤指示器 */}
          <Steps current={createStep} className="mb-6">
            <Step title="选择签署方" />
            <Step title="选择合同类型" />
          </Steps>

          {/* 第一步：选择签署方 */}
          {createStep === 0 && (
            <div>
              <div className="mb-4">
                <h4 className="text-base font-medium mb-3">请选择签署方：</h4>
                <Radio.Group
                  value={selectedSignatory}
                  onChange={e => setSelectedSignatory(e.target.value)}
                  className="w-full"
                >
                  <div className="space-y-2">
                    {SIGNATORY_OPTIONS.map(signatory => (
                      <Radio key={signatory} value={signatory} className="w-full block">
                        <span className="ml-2">{signatory}</span>
                      </Radio>
                    ))}
                  </div>
                </Radio.Group>
              </div>

              <div className="flex justify-end space-x-2">
                <Button onClick={handleCreateModalCancel}>取消</Button>
                <Button type="primary" onClick={handleNextStep} disabled={!selectedSignatory}>
                  下一步
                </Button>
              </div>
            </div>
          )}

          {/* 第二步：选择合同类型 */}
          {createStep === 1 && (
            <div>
              <div className="mb-4">
                <div className="mb-3">
                  <span className="text-gray-600">已选择签署方：</span>
                  <span className="font-medium text-blue-600">{selectedSignatory}</span>
                </div>
                <h4 className="text-base font-medium mb-3">请选择合同类型：</h4>
                <Radio.Group
                  value={selectedContractType}
                  onChange={e => setSelectedContractType(e.target.value)}
                  className="w-full"
                >
                  <div className="space-y-2">
                    {currentContractTypeOptions.map(contractType => (
                      <Radio key={contractType} value={contractType} className="w-full block">
                        <span className="ml-2">{contractType}</span>
                      </Radio>
                    ))}
                  </div>
                </Radio.Group>
              </div>

              <div className="flex justify-end space-x-2">
                <Button onClick={handlePrevStep}>上一步</Button>
                <Button onClick={handleCreateModalCancel}>取消</Button>
                <Button
                  type="primary"
                  onClick={handleConfirmCreate}
                  disabled={!selectedContractType}
                >
                  开始填写合同
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Contracts
