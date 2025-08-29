import React, { useMemo } from 'react'
import { Card, Table, Button, Space, Typography, Row, Col, Statistic, DatePicker } from 'antd'
import { ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNewCustomerStats } from './hooks/useNewCustomerStats'
import type { NewCustomerItem } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

const NewCustomerDetail: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // 从URL参数中解析状态
  const urlParams = useMemo(() => {
    const startDate =
      searchParams.get('startDate') ||
      dayjs().subtract(6, 'month').startOf('month').format('YYYY-MM-DD')
    const endDate = searchParams.get('endDate') || dayjs().endOf('month').format('YYYY-MM-DD')
    const selectedMonth = searchParams.get('selectedMonth') || ''
    const currentPage = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const sortField = searchParams.get('sortField') || 'customerId'
    const sortOrder = (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC'

    // 构建日期范围
    const dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null = selectedMonth
      ? null
      : [dayjs(startDate), dayjs(endDate)]

    return {
      dateRange,
      selectedMonth: selectedMonth ? dayjs(selectedMonth) : null,
      currentPage,
      pageSize,
      sortField,
      sortOrder,
      startDate,
      endDate,
    }
  }, [searchParams])

  const { dateRange, selectedMonth, currentPage, pageSize, sortField, sortOrder } = urlParams

  // 统一的URL参数更新函数
  const updateUrlParams = (
    updates: Partial<{
      dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null
      selectedMonth: dayjs.Dayjs | null
      currentPage: number
      pageSize: number
      sortField: string
      sortOrder: 'ASC' | 'DESC'
    }>
  ) => {
    const newParams = new URLSearchParams(searchParams)

    if (updates.dateRange !== undefined) {
      if (updates.dateRange) {
        newParams.set('startDate', updates.dateRange[0].format('YYYY-MM-DD'))
        newParams.set('endDate', updates.dateRange[1].format('YYYY-MM-DD'))
        newParams.delete('selectedMonth')
      } else {
        newParams.delete('startDate')
        newParams.delete('endDate')
      }
    }

    if (updates.selectedMonth !== undefined) {
      if (updates.selectedMonth) {
        newParams.set('selectedMonth', updates.selectedMonth.format('YYYY-MM'))
        newParams.delete('startDate')
        newParams.delete('endDate')
      } else {
        newParams.delete('selectedMonth')
      }
    }

    if (updates.currentPage !== undefined) {
      newParams.set('page', String(updates.currentPage))
    }

    if (updates.pageSize !== undefined) {
      newParams.set('pageSize', String(updates.pageSize))
    }

    if (updates.sortField !== undefined) {
      newParams.set('sortField', updates.sortField)
    }

    if (updates.sortOrder !== undefined) {
      newParams.set('sortOrder', updates.sortOrder)
    }

    setSearchParams(newParams, { replace: true })
  }

  const { data, isLoading } = useNewCustomerStats({
    // 互斥逻辑：优先使用年月筛选，如果没有则使用日期范围
    ...(selectedMonth
      ? {
          year: selectedMonth.year(),
          month: selectedMonth.month() + 1, // dayjs月份从0开始，需要+1
        }
      : {
          startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
          endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
        }),
    page: currentPage,
    pageSize,
    sortField,
    sortOrder,
  })

  // 获取所有新增客户的详细信息
  const allCustomers = data?.list || []

  // 处理表格变化（分页、排序）
  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Table change:', {
        pagination,
        sorter,
        'sorter.field': sorter?.field,
        'sorter.order': sorter?.order,
        'Object.keys(sorter)': Object.keys(sorter || {}),
        currentPage,
        pageSize,
        sortField,
        sortOrder,
      }) // 详细调试日志
    }

    // 检测是否是取消排序的情况
    const isCurrentlySorted = sortField && sortOrder
    const hasNewSorting = sorter && sorter.field && sorter.order
    const isCancelingSorting = isCurrentlySorted && !hasNewSorting

    if (process.env.NODE_ENV === 'development') {
      console.log('排序状态分析:', {
        isCurrentlySorted,
        hasNewSorting,
        isCancelingSorting,
        sorter详情: sorter,
      })
    }

    // 处理排序变化
    if (hasNewSorting) {
      // 有明确的排序字段和排序方向
      updateUrlParams({
        sortField: sorter.field,
        sortOrder: sorter.order === 'ascend' ? 'ASC' : 'DESC',
        currentPage: pagination.current || 1, // 排序时使用当前页或重置到第一页
      })
    } else if (isCancelingSorting) {
      // 取消排序：当前有排序但新的sorter没有有效排序
      if (process.env.NODE_ENV === 'development') {
        console.log('取消排序:', { sortField, sortOrder })
      }
      // 恢复默认排序
      updateUrlParams({
        sortField: 'customerId',
        sortOrder: 'DESC',
        currentPage: 1,
      })
    } else if (pagination.pageSize && pagination.pageSize !== pageSize) {
      // 处理页面大小变化
      updateUrlParams({
        pageSize: pagination.pageSize,
        currentPage: 1, // 页面大小变化时重置到第一页
      })
    } else if (pagination.current && pagination.current !== currentPage) {
      // 处理纯分页变化
      updateUrlParams({
        currentPage: pagination.current,
      })
    }
  }

  const columns: ColumnsType<NewCustomerItem> = [
    {
      title: '客户ID',
      dataIndex: 'customerId',
      key: 'customerId',
      width: 100,
      render: (id: number) => <div style={{ fontWeight: 500, color: '#1890ff' }}>{id}</div>,
      sorter: true,
      // 动态设置排序状态
      sortOrder:
        sortField === 'customerId' && sortOrder
          ? sortOrder === 'DESC'
            ? 'descend'
            : 'ascend'
          : null,
    },
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      fixed: 'left',
      render: (text: string) => <div style={{ fontWeight: 500, color: '#262626' }}>{text}</div>,
      // 移除排序，API不支持此字段排序
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'unifiedSocialCreditCode',
      key: 'unifiedSocialCreditCode',
      width: 180,
      // 移除排序，API不支持此字段排序
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      // 移除排序，API不支持此字段排序
    },
    {
      title: '客户等级',
      dataIndex: 'customerLevel',
      key: 'customerLevel',
      width: 100,
      render: (level: string | null) => {
        const displayLevel = level || '未分级'
        const colors = {
          A级: '#ff4d4f',
          B级: '#fa8c16',
          C级: '#faad14',
          D级: '#52c41a',
          E级: '#1890ff',
          未分级: '#d9d9d9',
        }
        return (
          <span
            style={{
              color: colors[displayLevel as keyof typeof colors] || '#722ed1',
              fontWeight: 600,
            }}
          >
            {displayLevel}
          </span>
        )
      },
      // 移除排序，API不支持此字段排序
    },
    {
      title: '贡献金额',
      dataIndex: 'contributionAmount',
      key: 'contributionAmount',
      width: 120,
      render: (amount: number | null) => (amount ? `¥${amount.toLocaleString()}` : '¥0'),
      // 移除排序，API不支持此字段排序
    },
    {
      title: '顾问会计',
      dataIndex: 'consultantAccountant',
      key: 'consultantAccountant',
      width: 120,
      render: (text: string | null) => text || '未分配',
      // 移除排序，API不支持此字段排序
    },
    {
      title: '记账会计',
      dataIndex: 'bookkeepingAccountant',
      key: 'bookkeepingAccountant',
      width: 120,
      render: (text: string | null) => text || '未分配',
      // 移除排序，API不支持此字段排序
    },
  ]

  return (
    <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24,
          background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
          padding: '20px 24px',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(82, 196, 26, 0.25)',
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/reports')}
          style={{ color: '#ffffff', marginRight: 16 }}
        >
          返回
        </Button>
        <Title level={2} style={{ margin: 0, color: '#ffffff', fontWeight: 600 }}>
          📈 新增客户统计详情
        </Title>
      </div>

      {/* 统计概览 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(82, 196, 26, 0.15)' }}>
            <Statistic
              title="新增客户总数"
              value={data?.summary?.totalNewCustomers || 0}
              suffix="个"
              valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(82, 196, 26, 0.15)' }}>
            <Statistic
              title="月均新增"
              value={data?.summary?.averagePerMonth || 0}
              suffix="个"
              precision={1}
              valueStyle={{ color: '#1890ff', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(82, 196, 26, 0.15)' }}>
            <Statistic
              title="当前页数据"
              value={data?.list?.length || 0}
              suffix="条"
              valueStyle={{ color: '#fa8c16', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(82, 196, 26, 0.15)' }}>
            <Statistic
              title="总页数"
              value={data?.totalPages || 0}
              suffix="页"
              valueStyle={{ color: '#722ed1', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选条件 */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Space size="large" wrap>
          <div>
            <span style={{ marginRight: 8 }}>时间范围：</span>
            <RangePicker
              value={dateRange}
              onChange={dates => {
                // 互斥逻辑：选择日期范围时清空年月筛选
                updateUrlParams({
                  dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null,
                  selectedMonth: dates ? null : undefined,
                  currentPage: 1,
                })
              }}
              format="YYYY-MM-DD"
              allowClear={true}
            />
          </div>
          <div>
            <span style={{ marginRight: 8 }}>年月筛选：</span>
            <DatePicker
              value={selectedMonth}
              onChange={date => {
                // 互斥逻辑：选择年月筛选时清空日期范围
                updateUrlParams({
                  selectedMonth: date,
                  dateRange: date ? null : undefined,
                  currentPage: 1,
                })
              }}
              picker="month"
              format="YYYY-MM"
              placeholder="选择年月"
              allowClear
            />
          </div>
        </Space>
      </Card>

      {/* 数据表格 */}
      <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
        <Table
          columns={columns}
          dataSource={allCustomers}
          rowKey="customerId"
          loading={isLoading}
          scroll={{ x: 1000 }}
          sortDirections={['descend', 'ascend']}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, _range) => {
              const startIndex = (currentPage - 1) * pageSize + 1
              const endIndex = Math.min(currentPage * pageSize, total)
              return `第 ${startIndex}-${endIndex} 条，共 ${total} 条`
            },
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          size="middle"
        />
      </Card>
    </div>
  )
}

export default NewCustomerDetail
