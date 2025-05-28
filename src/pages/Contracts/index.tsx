import React, { useState, useEffect } from 'react'
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
import type { Contract, ContractQueryParams, ContractStatus } from '../../types/contract'

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

const Contracts: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()

  // 发起合同模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createStep, setCreateStep] = useState(0)
  const [selectedSignatory, setSelectedSignatory] = useState<string>('')
  const [selectedContractType, setSelectedContractType] = useState<string>('')

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
  } = useContractList(queryParams)

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
    Modal.confirm({
      title: '签署合同',
      content: (
        <div>
          <p>
            确认签署合同 <strong>{record.contractNumber}</strong> 吗？
          </p>
          <p>签署后合同状态将变为"已签署"。</p>
        </div>
      ),
      okText: '确认签署',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 使用简单的签名内容，实际应用中可能需要更复杂的签名逻辑
          const signature = `${new Date().toISOString()}_${record.id}`
          await doSignContract(record.id, { signature })
        } catch (error) {
          console.error('签署失败:', error)
        }
      },
    })
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
      width: 140,
      fixed: 'left',
      render: text => text || '-',
    },
    {
      title: '签署方',
      dataIndex: 'signatory',
      key: 'signatory',
      width: 120,
      render: text => text || '-',
    },
    {
      title: '甲方公司',
      dataIndex: 'partyACompany',
      key: 'partyACompany',
      width: 160,
      render: text => text || '-',
    },
    {
      title: '甲方信用代码',
      dataIndex: 'partyACreditCode',
      key: 'partyACreditCode',
      width: 160,
      render: text => text || '-',
    },
    {
      title: '合同类型',
      dataIndex: 'contractType',
      key: 'contractType',
      width: 120,
      render: text => text || '-',
    },
    {
      title: '甲方签订日期',
      dataIndex: 'partyASignDate',
      key: 'partyASignDate',
      width: 120,
      render: formatDate,
    },
    {
      title: '委托期限',
      key: 'entrustmentPeriod',
      width: 180,
      render: (_, record) => {
        const start = record.entrustmentStartDate
        const end = record.entrustmentEndDate
        if (start && end) {
          return `${formatDate(start)} 至 ${formatDate(end)}`
        } else if (start) {
          return `自 ${formatDate(start)}`
        } else if (end) {
          return `至 ${formatDate(end)}`
        }
        return '-'
      },
    },
    {
      title: '费用总计',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 100,
      align: 'right',
      render: value => (value ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '合同状态',
      dataIndex: 'contractStatus',
      key: 'contractStatus',
      width: 100,
      align: 'center',
      render: getStatusTag,
    },
    {
      title: '提交人',
      dataIndex: 'submitter',
      key: 'submitter',
      width: 100,
      render: text => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 140,
      render: formatDateTime,
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
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="action-btn edit-btn"
            />
          </Tooltip>
          {record.contractStatus === '0' && (
            <Tooltip title="签署合同">
              <Button
                type="text"
                size="small"
                icon={<FileTextOutlined />}
                onClick={() => handleSign(record)}
                className="action-btn"
                style={{ color: '#1890ff' }}
              />
            </Tooltip>
          )}
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
        </Space>
      ),
    },
  ]

  return (
    <div className="p-4">
      {/* 搜索区域 */}
      <div className="mb-4">
        <Form form={form} layout="inline" className="contract-search-form">
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2">
              <Form.Item label="合同编号" name="contractNumber" className="mb-2">
                <Input placeholder="请输入合同编号" className="w-40" />
              </Form.Item>
              <Form.Item label="甲方公司" name="partyACompany" className="mb-2">
                <Input placeholder="请输入甲方公司名称" className="w-40" />
              </Form.Item>
              <Form.Item label="甲方信用代码" name="partyACreditCode" className="mb-2">
                <Input placeholder="请输入统一社会信用代码" className="w-40" />
              </Form.Item>
              <Form.Item label="签署方" name="signatory" className="mb-2">
                <Input placeholder="请输入签署方" className="w-40" />
              </Form.Item>
              <Form.Item label="合同类型" name="contractType" className="mb-2">
                <Input placeholder="请输入合同类型" className="w-40" />
              </Form.Item>
              <Form.Item label="合同状态" name="contractStatus" className="mb-2">
                <Select placeholder="请选择合同状态" className="w-40">
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
                <RangePicker showTime className="w-full" />
              </Form.Item>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
                <Button icon={<SearchOutlined />} type="primary" onClick={handleSearch}>
                  搜索
                </Button>
              </Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                发起合同
              </Button>
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
                  onChange={(e) => setSelectedSignatory(e.target.value)}
                  className="w-full"
                >
                  <div className="space-y-2">
                    {SIGNATORY_OPTIONS.map((signatory) => (
                      <Radio key={signatory} value={signatory} className="w-full block">
                        <span className="ml-2">{signatory}</span>
                      </Radio>
                    ))}
                  </div>
                </Radio.Group>
              </div>

              <div className="flex justify-end space-x-2">
                <Button onClick={handleCreateModalCancel}>取消</Button>
                <Button 
                  type="primary" 
                  onClick={handleNextStep}
                  disabled={!selectedSignatory}
                >
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
                  onChange={(e) => setSelectedContractType(e.target.value)}
                  className="w-full"
                >
                  <div className="space-y-2">
                    {currentContractTypeOptions.map((contractType) => (
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
 