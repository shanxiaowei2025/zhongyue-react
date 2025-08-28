import React, { useState } from 'react'
import { Card, Table, Button, Space, Typography, Row, Col, Statistic, DatePicker } from 'antd'
import { ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNewCustomerStats } from './hooks/useNewCustomerStats'
import type { NewCustomerItem } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

const NewCustomerDetail: React.FC = () => {
  const navigate = useNavigate()
  // 互斥筛选：默认使用时间范围筛选，年月筛选为空
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().subtract(6, 'month').startOf('month'),
    dayjs().endOf('month'),
  ])
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<string | undefined>('customerId')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC' | undefined>('DESC')

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
      console.log('Table change:', { pagination, sorter, currentPage, pageSize }) // 调试日志
    }

    let shouldUpdatePage = false

    // 处理排序变化
    if (sorter && sorter.field) {
      // 有排序字段
      setSortField(sorter.field)
      setSortOrder(sorter.order === 'ascend' ? 'ASC' : 'DESC')
      if (pagination.current !== currentPage) {
        // 排序的同时也可能有分页变化
        setCurrentPage(pagination.current || 1)
        shouldUpdatePage = true
      } else {
        // 只是排序变化，重置到第一页
        setCurrentPage(1)
        shouldUpdatePage = true
      }
    } else if (sorter && sorter.order === undefined) {
      // 取消排序，恢复默认排序
      setSortField('customerId')
      setSortOrder('DESC')
      setCurrentPage(1)
      shouldUpdatePage = true
    }

    // 处理页面大小变化
    if (pagination.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize)
      setCurrentPage(1) // 页面大小变化时重置到第一页
      shouldUpdatePage = true
    }

    // 处理纯分页变化（没有排序和页面大小变化）
    if (!shouldUpdatePage && pagination.current && pagination.current !== currentPage) {
      setCurrentPage(pagination.current)
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
      defaultSortOrder: 'descend' as const, // 默认按客户ID降序排序
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
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
                // 互斥逻辑：选择日期范围时清空年月筛选
                if (dates) {
                  setSelectedMonth(null)
                }
                setCurrentPage(1)
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
                setSelectedMonth(date)
                // 互斥逻辑：选择年月筛选时清空日期范围
                if (date) {
                  setDateRange(null)
                }
                setCurrentPage(1)
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
