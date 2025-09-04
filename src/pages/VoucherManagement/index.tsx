import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  Input,
  DatePicker,
  Statistic,
  Row,
  Col,
  message,
  Tooltip,
  Form,
  Modal,
} from 'antd'
import { ExportOutlined, ReloadOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import { useVoucherRecordList, useVoucherRecordActions } from '../../hooks/useVoucherRecord'
import { useVoucherPermission } from '../../hooks/useVoucherPermission'
import { voucherRecordBatchApi } from '../../api/voucherRecord'
import MonthEditPopover from '../../components/VoucherManagement/MonthEditPopover'
import {
  convertToTableRow,
  getStatusDisplay,
  getMonthName,
  generateExportFileName,
  mapBackendStatusToFrontend,
} from '../../utils/voucherRecord'
import type {
  VoucherRecordTableRow,
  QueryVoucherRecordDto,
  ExportVoucherRecordDto,
} from '../../types/voucherRecord'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Search } = Input
const { RangePicker } = DatePicker

const VoucherManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useState<QueryVoucherRecordDto>({
    page: 1,
    limit: 20,
    year: new Date().getFullYear(),
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 搜索表单状态
  const [searchForm] = Form.useForm()

  // 行内编辑状态管理
  const [editingRowKeys, setEditingRowKeys] = useState<React.Key[]>([])
  const [editingData, setEditingData] = useState<Record<string, Partial<VoucherRecordTableRow>>>({})
  const [savingRows, setSavingRows] = useState<React.Key[]>([])

  const { data, isLoading, mutate } = useVoucherRecordList(searchParams)
  const {
    exportToExcel,
    updateYear,
    deleteYear,
    loading: exportLoading,
  } = useVoucherRecordActions()
  const { canView, canEdit, canExport, canDelete } = useVoucherPermission()

  // 权限检查
  if (!canView) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">您没有查看凭证记录的权限</div>
            <div className="text-sm text-gray-400">请联系管理员获取相应权限</div>
          </div>
        </Card>
      </div>
    )
  }

  // 转换数据为表格行格式
  const tableData: VoucherRecordTableRow[] = data.records.map(convertToTableRow)

  // 计算统计数据
  const statistics = {
    totalCustomers: data.total,
    completed: tableData.filter(row => row.completionRate === 100).length,
    inProgress: tableData.filter(row => row.completionRate > 0 && row.completionRate < 100).length,
    notStarted: tableData.filter(row => row.completionRate === 0).length,
  }

  // 表格列定义
  const columns: ColumnsType<VoucherRecordTableRow> = [
    {
      title: '客户名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 350,
      fixed: 'left',
      ellipsis: true,
    },
    {
      title: '顾问会计',
      dataIndex: 'consultantAccountant',
      key: 'consultantAccountant',
      width: 100,
      render: text => text || '-',
    },
    {
      title: '记账会计',
      dataIndex: 'bookkeepingAccountant',
      key: 'bookkeepingAccountant',
      width: 100,
      render: text => text || '-',
    },
    {
      title: '年度',
      dataIndex: 'year',
      key: 'year',
      width: 80,
      align: 'center',
    },
    ...Array.from({ length: 12 }, (_, i) => i + 1).map(month => ({
      title: getMonthName(month),
      key: `month_${month}`,
      width: 80,
      align: 'center' as const,
      render: (_: any, record: VoucherRecordTableRow) => {
        const monthData = record.months[month]
        const statusDisplay = getStatusDisplay(monthData.status)
        const description = monthData.description
        const isEditing = editingRowKeys.includes(record.customerId)
        const isRealData = monthData.isRealData !== false // 默认为true，只有明确标记为false才是筛选隐藏
        const isFiltered = !isRealData && searchParams.status // 有状态筛选且不是真实数据

        const monthContent = (
          <div className="flex flex-col items-center py-1">
            <div
              className={`w-4 h-4 rounded-full mb-1 transition-all duration-200 ${
                isEditing && isRealData ? 'cursor-pointer hover:scale-110 hover:shadow-md' : ''
              } ${isFiltered ? 'opacity-30' : ''}`}
              style={{
                backgroundColor: statusDisplay.color,
                ...(isFiltered && {
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)',
                  border: '1px dashed #ccc',
                }),
              }}
            />
            {description && isRealData && (
              <div className="text-xs text-gray-600 text-center leading-tight max-w-full">
                {description.length > 10 ? `${description.slice(0, 10)}...` : description}
              </div>
            )}
            {isFiltered && <div className="text-xs text-gray-400 text-center">已筛选</div>}
          </div>
        )

        if (isEditing && canEdit && isRealData) {
          return (
            <MonthEditPopover
              month={month}
              year={record.year}
              yearRecordId={record.yearRecordId!}
              monthData={monthData}
              onUpdate={updateData => handleMonthUpdate(record, month, updateData)}
            >
              {monthContent}
            </MonthEditPopover>
          )
        }

        const tooltipTitle = isFiltered
          ? `此月份不符合当前筛选条件（${searchParams.status}），实际状态可能不同`
          : description
            ? `${statusDisplay.label}\n说明：${description}`
            : statusDisplay.label

        return <Tooltip title={tooltipTitle}>{monthContent}</Tooltip>
      },
    })),
    {
      title: '完成率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      width: 100,
      align: 'center',
      render: (rate: number) => (
        <div className="flex items-center justify-center">
          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${rate}%` }}
            />
          </div>
          <span className="text-xs">{rate}%</span>
        </div>
      ),
      sorter: (a, b) => a.completionRate - b.completionRate,
    },
    {
      title: '存放位置',
      dataIndex: 'storageLocation',
      key: 'storageLocation',
      width: 150,
      ellipsis: true,
      render: (text, record) => {
        const isEditing = editingRowKeys.includes(record.customerId)
        if (isEditing) {
          const editData = editingData[String(record.customerId)]
          return (
            <Input
              value={editData?.storageLocation || ''}
              onChange={e =>
                handleFieldChange(record.customerId, 'storageLocation', e.target.value)
              }
              placeholder="请输入存放位置"
              size="small"
            />
          )
        }
        return text || '-'
      },
    },
    {
      title: '经手人',
      dataIndex: 'handler',
      key: 'handler',
      width: 120,
      render: (text, record) => {
        const isEditing = editingRowKeys.includes(record.customerId)
        if (isEditing) {
          const editData = editingData[String(record.customerId)]
          return (
            <Input
              value={editData?.handler || ''}
              onChange={e => handleFieldChange(record.customerId, 'handler', e.target.value)}
              placeholder="请输入经手人"
              size="small"
            />
          )
        }
        return text || '-'
      },
    },
    {
      title: '取走记录',
      dataIndex: 'withdrawalRecord',
      key: 'withdrawalRecord',
      width: 150,
      ellipsis: true,
      render: (text, record) => {
        const isEditing = editingRowKeys.includes(record.customerId)
        if (isEditing) {
          const editData = editingData[String(record.customerId)]
          return (
            <Input
              value={editData?.withdrawalRecord || ''}
              onChange={e =>
                handleFieldChange(record.customerId, 'withdrawalRecord', e.target.value)
              }
              placeholder="请输入取走记录"
              size="small"
            />
          )
        }
        return text || '-'
      },
    },
    {
      title: '通用备注',
      dataIndex: 'generalRemarks',
      key: 'generalRemarks',
      width: 200,
      ellipsis: true,
      render: (text, record) => {
        const isEditing = editingRowKeys.includes(record.customerId)
        if (isEditing) {
          const editData = editingData[String(record.customerId)]
          return (
            <Input.TextArea
              value={editData?.generalRemarks || ''}
              onChange={e => handleFieldChange(record.customerId, 'generalRemarks', e.target.value)}
              placeholder="请输入通用备注"
              size="small"
              rows={2}
              style={{ resize: 'none' }}
            />
          )
        }
        return text || '-'
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const isEditing = editingRowKeys.includes(record.customerId)
        const isSaving = savingRows.includes(record.customerId)

        if (isEditing) {
          return (
            <Space>
              <Button
                type="link"
                size="small"
                loading={isSaving}
                onClick={() => handleSaveEdit(record)}
              >
                保存
              </Button>
              <Button
                type="link"
                size="small"
                disabled={isSaving}
                onClick={() => handleCancelEdit(record)}
              >
                取消
              </Button>
            </Space>
          )
        }

        if (canEdit) {
          return (
            <Button type="link" size="small" onClick={() => handleStartEdit(record)}>
              编辑
            </Button>
          )
        }

        return '-'
      },
    },
  ]

  // 处理搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setSearchParams(prev => ({
      ...prev,
      page: 1,
      storageLocation: values.storageLocation === '-' ? '' : (values.storageLocation || undefined),
      handler: values.handler === '-' ? '' : (values.handler || undefined),
      status: values.status === '-' ? '' : (values.status || undefined),
      consultantAccountant: values.consultantAccountant === '-' ? '' : (values.consultantAccountant || undefined),
      bookkeepingAccountant: values.bookkeepingAccountant === '-' ? '' : (values.bookkeepingAccountant || undefined),
    }))
  }

  // 重置搜索条件
  const handleResetSearch = () => {
    searchForm.resetFields()
    setSearchParams(prev => ({
      page: 1,
      limit: prev.limit,
      year: prev.year,
      consultantAccountant: undefined,
      bookkeepingAccountant: undefined,
      storageLocation: undefined,
      handler: undefined,
      status: undefined,
    }))
  }

  // 处理年份筛选
  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const year = date.year()
      setSearchParams(prev => ({
        ...prev,
        page: 1,
        year,
      }))
    }
  }

  // 处理分页
  const handleTableChange = (pagination: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
    }))
  }

  // 处理导出
  const handleExport = async () => {
    if (!canExport) {
      message.error('您没有导出权限')
      return
    }

    try {
      const exportData: ExportVoucherRecordDto = {
        year: searchParams.year,
        format: 'excel',
        includeMonthDetails: true,
        ...(selectedRowKeys.length > 0 && {
          customerIds: selectedRowKeys.map(key => Number(key)),
        }),
      }

      await exportToExcel(exportData)
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  // 处理刷新
  const handleRefresh = () => {
    mutate()
  }

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (!canDelete) {
      message.error('您没有删除权限')
      return
    }

    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的记录')
      return
    }

    // 获取选中记录的详细信息
    const selectedRecords = tableData.filter(record => selectedRowKeys.includes(record.customerId))

    Modal.confirm({
      title: '确认删除',
      content: (
        <div>
          <p>您确定要删除以下 {selectedRecords.length} 条年度凭证记录吗？</p>
          <div className="mt-2 max-h-32 overflow-y-auto">
            {selectedRecords.map(record => (
              <div key={record.customerId} className="text-sm text-gray-600">
                • {record.companyName} - {record.year}年
              </div>
            ))}
          </div>
          <p className="mt-2 text-red-500 text-sm">
            <strong>注意：此操作将同时删除年度记录及其所有月度记录，且不可恢复！</strong>
          </p>
        </div>
      ),
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          // 批量删除年度记录
          for (const record of selectedRecords) {
            if (record.yearRecordId) {
              await deleteYear(record.yearRecordId)
            }
          }

          // 清空选中状态
          setSelectedRowKeys([])

          // 刷新数据
          await mutate()

          message.success(`成功删除 ${selectedRecords.length} 条记录`)
        } catch (error) {
          console.error('批量删除失败:', error)
          message.error('删除失败，请重试')
        }
      },
    })
  }

  // 开始编辑行
  const handleStartEdit = (record: VoucherRecordTableRow) => {
    if (!canEdit) {
      message.error('您没有编辑权限')
      return
    }

    const rowKey = record.customerId
    const key = String(rowKey)
    setEditingRowKeys(prev => [...prev, rowKey])
    setEditingData(prev => ({
      ...prev,
      [key]: {
        storageLocation: record.storageLocation || '',
        handler: record.handler || '',
        withdrawalRecord: record.withdrawalRecord || '',
        generalRemarks: record.generalRemarks || '',
      },
    }))
  }

  // 取消编辑
  const handleCancelEdit = (record: VoucherRecordTableRow) => {
    const rowKey = record.customerId
    const key = String(rowKey)
    setEditingRowKeys(prev => prev.filter(k => k !== rowKey))
    setEditingData(prev => {
      const { [key]: _, ...rest } = prev
      return rest
    })
  }

  // 验证编辑数据
  const validateEditData = (editData: Partial<VoucherRecordTableRow>): string | null => {
    // 基本验证：字段长度限制
    if (editData.storageLocation && editData.storageLocation.length > 100) {
      return '存放位置不能超过100个字符'
    }
    if (editData.handler && editData.handler.length > 50) {
      return '经手人不能超过50个字符'
    }
    if (editData.withdrawalRecord && editData.withdrawalRecord.length > 200) {
      return '取走记录不能超过200个字符'
    }
    if (editData.generalRemarks && editData.generalRemarks.length > 500) {
      return '通用备注不能超过500个字符'
    }
    return null
  }

  // 保存编辑
  const handleSaveEdit = async (record: VoucherRecordTableRow) => {
    const rowKey = record.customerId
    const key = String(rowKey)
    const editData = editingData[key]

    if (!editData || !record.yearRecordId) {
      message.error('编辑数据异常，请重试')
      return
    }

    // 验证输入数据
    const validationError = validateEditData(editData)
    if (validationError) {
      message.error(validationError)
      return
    }

    try {
      setSavingRows(prev => [...prev, rowKey])

      await updateYear(record.yearRecordId, {
        storageLocation: editData.storageLocation?.trim(),
        handler: editData.handler?.trim(),
        withdrawalRecord: editData.withdrawalRecord?.trim(),
        generalRemarks: editData.generalRemarks?.trim(),
      })

      // 更新成功后退出编辑状态
      setEditingRowKeys(prev => prev.filter(k => k !== rowKey))
      setEditingData(prev => {
        const { [key]: _, ...rest } = prev
        return rest
      })

      // 刷新数据
      await mutate()
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setSavingRows(prev => prev.filter(key => key !== rowKey))
    }
  }

  // 处理字段值变化
  const handleFieldChange = (rowKey: React.Key, field: string, value: string) => {
    const key = String(rowKey)
    setEditingData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }))
  }

  // 处理月份状态更新
  const handleMonthUpdate = async (
    record: VoucherRecordTableRow,
    month: number,
    updateData: { status: string; description?: string }
  ) => {
    const monthData = record.months[month]

    if (monthData && monthData.status !== 'not_set') {
      // 如果月份记录已存在且有ID，则更新
      // 注意：这里需要从后端获取月份记录的实际ID
      // 目前的数据结构中没有monthId，需要通过API获取或重构数据结构
      try {
        // 使用批量更新API
        await voucherRecordBatchApi.batchUpdateMonthStatus(record.yearRecordId!, [
          {
            month,
            status: updateData.status,
            description: updateData.description,
          },
        ])

        // 刷新数据
        await mutate()
      } catch (error) {
        console.error('更新月份状态失败:', error)
        throw error
      }
    } else {
      // 如果月份记录不存在，使用批量更新API创建
      try {
        await voucherRecordBatchApi.batchUpdateMonthStatus(record.yearRecordId!, [
          {
            month,
            status: updateData.status,
            description: updateData.description,
          },
        ])

        // 刷新数据
        await mutate()
      } catch (error) {
        console.error('创建月份记录失败:', error)
        throw error
      }
    }
  }

  // 处理编辑记录（保留原有逻辑作为备用）
  const handleEditRecord = (record: VoucherRecordTableRow) => {
    // 跳转到客户编辑页面的档案存放信息标签页
    window.location.href = `/customers/edit/${record.customerId}?tab=archiveStorage`
  }

  return (
    <div className="p-6 space-y-6">
      {/* 统计概览 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总客户数"
              value={statistics.totalCustomers}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={statistics.completed}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={statistics.inProgress}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未开始"
              value={statistics.notStarted}
              valueStyle={{ color: '#d9d9d9' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card>
        <Form form={searchForm} layout="inline" className="mb-4">
          <Row gutter={[16, 16]} className="w-full">
            <Col>
              <Form.Item label="年份">
                <DatePicker
                  picker="year"
                  value={dayjs(`${searchParams.year}-01-01`)}
                  onChange={handleYearChange}
                  style={{ width: 120 }}
                  placeholder="选择年份"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="storageLocation" label="存放位置">
                <Input 
                  placeholder="请输入存放位置" 
                  allowClear 
                  style={{ width: 160 }} 
                  onChange={(e) => {
                    setTimeout(() => handleSearch(), 300);
                  }}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="handler" label="经手人">
                <Input 
                  placeholder="请输入经手人" 
                  allowClear 
                  style={{ width: 140 }} 
                  onChange={(e) => {
                    setTimeout(() => handleSearch(), 300);
                  }}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="consultantAccountant" label="顾问会计">
                <Input 
                  placeholder="请输入顾问会计" 
                  allowClear 
                  style={{ width: 140 }} 
                  onChange={(e) => {
                    setTimeout(() => handleSearch(), 300);
                  }}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="bookkeepingAccountant" label="记账会计">
                <Input 
                  placeholder="请输入记账会计" 
                  allowClear 
                  style={{ width: 140 }} 
                  onChange={(e) => {
                    setTimeout(() => handleSearch(), 300);
                  }}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="status" label="状态">
                <Select
                  placeholder="请选择状态"
                  allowClear
                  style={{ width: 140 }}
                  onChange={() => handleSearch()}
                  options={[
                    { label: '已完成', value: '已完成' },
                    { label: '未完成', value: '未完成' },
                    { label: '无需整理', value: '无需整理' },
                    { label: '未设置', value: '未设置' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col>
              <Space>
                <Button onClick={handleResetSearch}>重置</Button>
                <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isLoading}>
                  刷新
                </Button>
                {canDelete && selectedRowKeys.length > 0 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleBatchDelete}
                    loading={exportLoading}
                  >
                    删除选中 ({selectedRowKeys.length})
                  </Button>
                )}
                {canExport && (
                  <Button
                    type="primary"
                    icon={<ExportOutlined />}
                    onClick={handleExport}
                    loading={exportLoading}
                  >
                    导出进度表
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Form>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="customerId"
          loading={isLoading}
          scroll={{ x: 2020 }}
          size="small"
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.limit,
            total: data.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: record => ({
              name: record.companyName,
              disabled: editingRowKeys.includes(record.customerId), // 编辑时禁用选择
            }),
          }}
          rowClassName={record => {
            const isEditing = editingRowKeys.includes(record.customerId)
            return isEditing ? 'bg-blue-50 border-blue-200' : ''
          }}
          className="[&_.ant-table-tbody>tr>td]:align-top"
        />
      </Card>
    </div>
  )
}

export default VoucherManagement
