import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Select,
  Form,
  message,
  Popconfirm,
  DatePicker,
  Modal,
  Tag,
} from 'antd'
import type { ColumnType, ColumnGroupType } from 'antd/es/table'
import {
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  AuditOutlined,
  ExportOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { usePageStates } from '../../hooks/usePageStates'
import { useExpenseList } from '../../hooks/useExpense'
import { usePermission } from '../../hooks/usePermission'
import { Expense, ExpenseStatus } from '../../types/expense'
import ExpenseForm from './ExpenseForm'
import ExpenseReceipt from './ExpenseReceipt'
import AuditModal from './AuditModal'
import dayjs from 'dayjs'
import {
  getExpenseList,
  getExpenseById,
  deleteExpense as deleteExpenseApi,
  auditExpense as auditExpenseApi,
  cancelAuditExpense as cancelAuditExpenseApi,
} from '../../api/expense'

const { RangePicker } = DatePicker

// 状态映射为显示文本
const STATUS_LABELS = {
  [ExpenseStatus.Pending]: '未审核',
  [ExpenseStatus.Approved]: '已审核',
  [ExpenseStatus.Rejected]: '已退回',
}

// 状态映射为标签颜色
const STATUS_COLORS = {
  [ExpenseStatus.Pending]: 'orange',
  [ExpenseStatus.Approved]: 'green',
  [ExpenseStatus.Rejected]: 'red',
}

// 定义表格列
const columns: (ColumnType<Expense> | ColumnGroupType<Expense>)[] = [
  {
    title: '企业名称',
    dataIndex: 'companyName',
    key: 'companyName',
    width: 180,
    ellipsis: true,
  },
  {
    title: '总计费用',
    dataIndex: 'totalFee',
    key: 'totalFee',
    width: 100,
    render: (value: number) => `¥${value.toFixed(2)}`,
  },
  {
    title: '收费日期',
    dataIndex: 'chargeDate',
    key: 'chargeDate',
    width: 120,
  },
  {
    title: '收费方式',
    dataIndex: 'chargeMethod',
    key: 'chargeMethod',
    width: 100,
  },
  {
    title: '业务员',
    dataIndex: 'salesperson',
    key: 'salesperson',
    width: 100,
  },
  {
    title: '审核状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: ExpenseStatus) => (
      <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
    ),
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 150,
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 220,
  },
]

const Expenses: React.FC = () => {
  // 获取权限控制
  const { expensePermissions, loading: permissionsLoading, refreshPermissions } = usePermission()

  // 权限标志 - 如果权限加载中，默认允许所有操作，避免界面闪烁
  const canCreateExpense = permissionsLoading ? true : expensePermissions?.canCreate
  const canEditExpense = permissionsLoading ? true : expensePermissions?.canEdit
  const canDeleteExpense = permissionsLoading ? true : expensePermissions?.canDelete
  const canAuditExpense = permissionsLoading ? true : expensePermissions?.canAudit
  const canCancelAuditExpense = permissionsLoading ? true : expensePermissions?.canCancelAudit
  const canViewReceipt = permissionsLoading ? true : expensePermissions?.canViewReceipt

  // 刷新权限信息
  useEffect(() => {
    refreshPermissions()
  }, [refreshPermissions])

  // 页面状态
  const PAGE_STATE_KEY = 'expense_list_state'
  const [savedState, setSavedState] = usePageStates<{
    companyName: string
    unifiedSocialCreditCode: string
    status?: ExpenseStatus
    salesperson: string
    dateRange?: any // 使用any类型避免typescript错误
    page: number
    pageSize: number
  }>(PAGE_STATE_KEY, {
    companyName: '',
    unifiedSocialCreditCode: '',
    status: undefined,
    salesperson: '',
    dateRange: undefined,
    page: 1,
    pageSize: 10,
  })

  // 搜索参数状态
  const [form] = Form.useForm()

  // 正确处理savedState中的日期范围
  const initialDateRange = useMemo(() => {
    if (!savedState.dateRange) return undefined
    try {
      // 确保日期是有效的数组
      if (Array.isArray(savedState.dateRange) && savedState.dateRange.length === 2) {
        return [dayjs(savedState.dateRange[0]), dayjs(savedState.dateRange[1])]
      }
    } catch (error) {
      console.error('解析日期范围失败:', error)
    }
    return undefined
  }, [savedState.dateRange])

  const [searchParams, setSearchParams] = useState({
    companyName: savedState.companyName || '',
    unifiedSocialCreditCode: savedState.unifiedSocialCreditCode || '',
    status: savedState.status !== undefined ? savedState.status : undefined,
    salesperson: savedState.salesperson || '',
    dateRange: initialDateRange,
    page: Number(savedState.page) || 1,
    pageSize: Number(savedState.pageSize) || 10,
  })

  // 费用详情状态
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [receiptVisible, setReceiptVisible] = useState(false)
  const [receiptExpenseId, setReceiptExpenseId] = useState<number | null>(null)
  const [auditModalVisible, setAuditModalVisible] = useState(false)
  const [expenseToAudit, setExpenseToAudit] = useState<Expense | null>(null)

  // 使用数据获取钩子
  const {
    expenses,
    total,
    isLoading: loading,
    error,
    refreshExpenseList: fetchExpenses,
    removeExpense: deleteExpense,
    auditExpense,
    cancelAudit: cancelAuditExpense,
  } = useExpenseList(searchParams)

  // 导航
  const navigate = useNavigate()

  // 初始化表单
  useEffect(() => {
    form.setFieldsValue({
      companyName: searchParams.companyName,
      unifiedSocialCreditCode: searchParams.unifiedSocialCreditCode,
      status: searchParams.status,
      salesperson: searchParams.salesperson,
      dateRange: searchParams.dateRange,
    })
  }, [form, searchParams])

  // 保存页面状态 - 添加依赖项管理，避免无限循环
  useEffect(() => {
    // 记录上次状态变更时间，避免短时间内的多次保存
    const stateToSave = {
      companyName: searchParams.companyName,
      unifiedSocialCreditCode: searchParams.unifiedSocialCreditCode,
      status: searchParams.status,
      salesperson: searchParams.salesperson,
      page: searchParams.page,
      pageSize: searchParams.pageSize,
      dateRange: searchParams.dateRange
        ? [
            searchParams.dateRange[0].format('YYYY-MM-DD'),
            searchParams.dateRange[1].format('YYYY-MM-DD'),
          ]
        : undefined,
    }

    // 使用ref或变量来跟踪初始渲染
    const timeoutId = setTimeout(() => {
      setSavedState(stateToSave)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [
    searchParams.companyName,
    searchParams.unifiedSocialCreditCode,
    searchParams.status,
    searchParams.salesperson,
    searchParams.page,
    searchParams.pageSize,
    searchParams.dateRange,
    setSavedState,
  ])

  // 点击搜索
  const handleSearch = () => {
    const values = form.getFieldsValue()

    // 处理日期范围
    const params: any = {
      ...searchParams,
      companyName: values.companyName,
      unifiedSocialCreditCode: values.unifiedSocialCreditCode,
      status: values.status,
      salesperson: values.salesperson,
      page: 1,
    }

    // 如果有日期范围，格式化后加入查询参数
    if (values.dateRange && values.dateRange.length === 2) {
      params.dateRange = values.dateRange
    } else {
      params.dateRange = undefined
    }

    setSearchParams(params)
  }

  // 重置搜索条件
  const handleReset = () => {
    form.resetFields()
    // 重置所有查询参数
    setSearchParams({
      companyName: '',
      unifiedSocialCreditCode: '',
      status: undefined,
      salesperson: '',
      dateRange: undefined,
      page: 1,
      pageSize: 10,
    })
  }

  // 表格页码改变
  const handleTableChange = (pagination: any) => {
    setSearchParams({
      ...searchParams,
      page: pagination.current,
      pageSize: pagination.pageSize,
    })
  }

  // 处理新增费用
  const handleAdd = () => {
    // 检查创建权限
    if (!canCreateExpense) {
      message.error('您没有创建费用的权限')
      return
    }

    setSelectedExpense(null)
    setFormMode('add')
    setFormVisible(true)
  }

  // 处理编辑费用
  const handleEdit = (record: Expense) => {
    // 检查编辑权限
    if (!canEditExpense) {
      message.error('您没有编辑费用的权限')
      return
    }

    console.log('选中的费用记录:', record)

    // 从API重新获取最新数据
    const fetchExpenseDetail = async () => {
      try {
        const response = await getExpenseById(record.id)
        console.log('从API获取的费用详情:', response)
        // 确保使用API返回的最新数据更新state
        if (response && typeof response === 'object') {
          // 处理不同的响应结构
          const expenseData = 'data' in response ? response.data : response
          setSelectedExpense(expenseData as Expense)
          setFormMode('edit')
          setFormVisible(true)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error) {
        console.error('获取费用详情失败:', error)
        message.error('获取费用详情失败')
      }
    }

    fetchExpenseDetail()
  }

  // 处理删除费用
  const handleDelete = async (id: number) => {
    // 检查删除权限
    if (!canDeleteExpense) {
      message.error('您没有删除费用的权限')
      return
    }

    try {
      await deleteExpense(id)
      message.success('删除成功')
      fetchExpenses()
    } catch (error) {
      console.error('删除费用失败:', error)
      message.error('删除失败')
    }
  }

  // 处理查看收据
  const handleViewReceipt = (id: number) => {
    // 检查查看收据权限
    if (!canViewReceipt) {
      message.error('您没有查看收据的权限')
      return
    }

    setReceiptExpenseId(id)
    setReceiptVisible(true)
  }

  // 处理审核
  const handleAudit = (record: Expense) => {
    // 检查审核权限
    if (!canAuditExpense) {
      message.error('您没有审核费用的权限')
      return
    }

    setExpenseToAudit(record)
    setAuditModalVisible(true)
  }

  // 提交审核
  const handleAuditSubmit = async (values: { status: ExpenseStatus; reason?: string }) => {
    if (!expenseToAudit || !canAuditExpense) return

    try {
      await auditExpense(expenseToAudit.id, {
        status: values.status,
        reason: values.reason,
      })

      setAuditModalVisible(false)
      fetchExpenses()
    } catch (error) {
      console.error('审核失败:', error)
      message.error('审核操作失败')
    }
  }

  // 取消审核
  const handleCancelAudit = async (record: Expense) => {
    // 检查取消审核权限
    if (!canCancelAuditExpense) {
      message.error('您没有取消审核的权限')
      return
    }

    try {
      await cancelAuditExpense(record.id, { cancelReason: '取消审核' })
      message.success('已取消审核')
      fetchExpenses()
    } catch (error) {
      console.error('取消审核失败:', error)
      message.error('取消审核失败')
    }
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中')
  }

  // 操作列渲染函数
  const renderActions = (record: Expense) => {
    // 根据审核状态显示不同的操作按钮
    switch (record.status) {
      case ExpenseStatus.Pending: // 未审核
        return (
          <Space size="small" className="action-buttons">
            {canEditExpense && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                className="edit-btn"
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            )}
            {canAuditExpense && (
              <Button
                type="link"
                size="small"
                icon={<AuditOutlined />}
                onClick={() => handleAudit(record)}
              >
                审核
              </Button>
            )}
            {canDeleteExpense && (
              <Popconfirm
                title="确定要删除吗?"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  className="delete-btn"
                >
                  删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        )

      case ExpenseStatus.Approved: // 已审核通过
        return (
          <Space size="small" className="action-buttons">
            {canViewReceipt && (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                className="view-btn"
                onClick={() => handleViewReceipt(record.id)}
              >
                查看收据
              </Button>
            )}
            {canCancelAuditExpense && (
              <Button type="link" size="small" danger onClick={() => handleCancelAudit(record)}>
                取消审核
              </Button>
            )}
          </Space>
        )

      case ExpenseStatus.Rejected: // 已退回/拒绝
        return (
          <Space size="small" className="action-buttons">
            {canEditExpense && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                className="edit-btn"
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            )}
            <Popconfirm
              title={
                <div>
                  <p>退回原因:</p>
                  <p>{record.rejectReason || '无'}</p>
                </div>
              }
              icon={<InfoCircleOutlined style={{ color: '#FF4D4F' }} />}
              okText="关闭"
              cancelButtonProps={{ style: { display: 'none' } }}
            >
              <Button type="link" size="small" danger>
                退回原因
              </Button>
            </Popconfirm>
            {canDeleteExpense && (
              <Popconfirm
                title="确定要删除吗?"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  className="delete-btn"
                >
                  删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        )

      default:
        return null
    }
  }

  // 为columns添加操作列
  const tableColumns = [...columns]
  // 替换操作列
  if (tableColumns[tableColumns.length - 1].key === 'action') {
    tableColumns[tableColumns.length - 1] = {
      ...tableColumns[tableColumns.length - 1],
      render: (_: any, record: Expense) => renderActions(record),
    }
  }

  return (
    <div className="expenses-page">
      <Card className="search-card mb-4">
        <Form form={form} layout="inline" className="search-form" onFinish={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-4">
            <Form.Item name="companyName" label="企业名称" className="m-0 w-full">
              <Input placeholder="输入企业名称" allowClear />
            </Form.Item>

            <Form.Item
              name="unifiedSocialCreditCode"
              label="统一社会信用代码"
              className="m-0 w-full"
            >
              <Input placeholder="输入统一社会信用代码" allowClear />
            </Form.Item>

            <Form.Item name="status" label="状态" className="m-0 w-full">
              <Select placeholder="选择状态" allowClear>
                <Select.Option value={ExpenseStatus.Pending}>未审核</Select.Option>
                <Select.Option value={ExpenseStatus.Approved}>已审核</Select.Option>
                <Select.Option value={ExpenseStatus.Rejected}>已退回</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="salesperson" label="业务员" className="m-0 w-full">
              <Input placeholder="输入业务员" allowClear />
            </Form.Item>
          </div>

          <div className="flex flex-wrap items-end gap-4 w-full">
            <Form.Item name="dateRange" label="收费日期" className="m-0 flex-grow">
              <RangePicker allowClear style={{ width: '100%' }} />
            </Form.Item>

            <div className="flex gap-2">
              <Form.Item className="m-0">
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
              </Form.Item>

              <Form.Item className="m-0">
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Form.Item>
            </div>
          </div>
        </Form>
      </Card>

      <Card
        title="费用管理"
        extra={
          <Space>
            {canCreateExpense && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增费用
              </Button>
            )}
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        }
      >
        <Table
          columns={tableColumns}
          dataSource={expenses}
          rowKey="id"
          scroll={{ x: 1500 }}
          loading={loading}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条数据`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 费用表单弹窗 */}
      {formVisible && (
        <ExpenseForm
          visible={true}
          mode={formMode}
          expense={selectedExpense}
          onCancel={() => {
            setFormVisible(false)
            // 清空選中的費用記錄
            setTimeout(() => setSelectedExpense(null), 300)
            fetchExpenses()
          }}
        />
      )}

      {/* 收据查看弹窗 */}
      <ExpenseReceipt
        visible={receiptVisible}
        expenseId={receiptExpenseId!}
        onClose={() => setReceiptVisible(false)}
      />

      {/* 审核弹窗 */}
      <AuditModal
        visible={auditModalVisible}
        onClose={() => setAuditModalVisible(false)}
        onConfirm={handleAuditSubmit}
      />
    </div>
  )
}

export default Expenses
