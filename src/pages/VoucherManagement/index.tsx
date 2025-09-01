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
} from 'antd'
import { ExportOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useVoucherRecordList, useVoucherRecordActions } from '../../hooks/useVoucherRecord'
import { useVoucherPermission } from '../../hooks/useVoucherPermission'
import {
  convertToTableRow,
  getStatusDisplay,
  getMonthName,
  generateExportFileName,
} from '../../utils/voucherRecord'
import type {
  VoucherRecordTableRow,
  QueryVoucherRecordDto,
  ExportVoucherRecordDto,
} from '../../types/voucherRecord'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input
const { RangePicker } = DatePicker

const VoucherManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useState<QueryVoucherRecordDto>({
    page: 1,
    limit: 20,
    year: new Date().getFullYear(),
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const { data, isLoading, mutate } = useVoucherRecordList(searchParams)
  const { exportToExcel, loading: exportLoading } = useVoucherRecordActions()
  const { canView, canExport } = useVoucherPermission()

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
      width: 200,
      fixed: 'left',
      ellipsis: true,
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
      width: 60,
      align: 'center' as const,
      render: (_: any, record: VoucherRecordTableRow) => {
        const status = record.months[month]
        const statusDisplay = getStatusDisplay(status)
        return (
          <Tooltip title={statusDisplay.label}>
            <div
              className="w-4 h-4 rounded-full mx-auto"
              style={{ backgroundColor: statusDisplay.color }}
            />
          </Tooltip>
        )
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
      width: 120,
      ellipsis: true,
      render: text => text || '-',
    },
    {
      title: '经手人',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
      render: text => text || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleEditRecord(record)}>
          编辑
        </Button>
      ),
    },
  ]

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({
      ...prev,
      page: 1,
      // 这里可以根据需要搜索客户名称或其他字段
    }))
  }

  // 处理年份筛选
  const handleYearChange = (year: number) => {
    setSearchParams(prev => ({
      ...prev,
      page: 1,
      year,
    }))
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

  // 处理编辑记录
  const handleEditRecord = (record: VoucherRecordTableRow) => {
    // TODO: 打开编辑模态框或跳转到编辑页面
    console.log('编辑记录:', record)
  }

  // 生成年份选项
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(year => ({
    label: `${year}年`,
    value: year,
  }))

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">凭证进度管理</h1>
        <p className="text-gray-600">管理所有客户的凭证整理进度</p>
      </div>

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
        <div className="flex justify-between items-center mb-4">
          <Space>
            <Select
              value={searchParams.year}
              onChange={handleYearChange}
              options={yearOptions}
              style={{ width: 120 }}
            />
            <Search
              placeholder="搜索客户名称"
              allowClear
              style={{ width: 200 }}
              onSearch={handleSearch}
            />
          </Space>

          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isLoading}>
              刷新
            </Button>
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
        </div>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="customerId"
          loading={isLoading}
          scroll={{ x: 1400 }}
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
            }),
          }}
        />
      </Card>
    </div>
  )
}

export default VoucherManagement
