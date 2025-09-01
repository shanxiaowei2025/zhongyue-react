import React, { useMemo, useEffect } from 'react'
import { Card, Button, Space, Typography, Row, Col, Statistic, DatePicker } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getNewCustomerStats } from '../../api/reports'
import ServerTable from '../../components/ServerTable'
import type { NewCustomerItem } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

const NewCustomerDetail: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // 从URL参数解析筛选条件
  const filterParams = useMemo(() => {
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const selectedMonth = searchParams.get('selectedMonth')

    const dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null =
      startDate && endDate ? [dayjs(startDate), dayjs(endDate)] : null

    // 如果没有任何筛选条件，默认使用当前年月
    const defaultSelectedMonth = selectedMonth
      ? dayjs(selectedMonth)
      : !startDate && !endDate
        ? dayjs()
        : null

    return {
      dateRange,
      selectedMonth: defaultSelectedMonth,
    }
  }, [searchParams])

  // 页面初始化时设置默认年月
  useEffect(() => {
    const hasAnyParams =
      searchParams.has('startDate') ||
      searchParams.has('endDate') ||
      searchParams.has('selectedMonth')

    // 如果没有任何时间相关参数，设置默认的当前年月
    if (!hasAnyParams) {
      const currentMonth = dayjs().format('YYYY-MM')
      const newParams = new URLSearchParams(searchParams)
      newParams.set('selectedMonth', currentMonth)
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams]) // 添加必要的依赖

  // 筛选条件更新函数
  const updateFilter = (updates: {
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null
    selectedMonth?: dayjs.Dayjs | null
  }) => {
    const newParams = new URLSearchParams(searchParams)

    // 清空所有日期相关参数
    newParams.delete('startDate')
    newParams.delete('endDate')
    newParams.delete('selectedMonth')

    // 设置新的参数
    if (updates.dateRange) {
      newParams.set('startDate', updates.dateRange[0].format('YYYY-MM-DD'))
      newParams.set('endDate', updates.dateRange[1].format('YYYY-MM-DD'))
    }

    if (updates.selectedMonth) {
      newParams.set('selectedMonth', updates.selectedMonth.format('YYYY-MM'))
    }

    // 重置分页到第一页
    newParams.set('page', '1')

    setSearchParams(newParams, { replace: true })
  }

  // 表格列定义
  const columns: ColumnsType<NewCustomerItem> = [
    {
      title: '客户ID',
      dataIndex: 'customerId',
      key: 'customerId',
      width: 100,
      render: (id: number) => <div style={{ fontWeight: 500, color: '#1890ff' }}>{id}</div>,
      sorter: true,
    },
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      fixed: 'left',
      render: (text: string) => <div style={{ fontWeight: 500, color: '#262626' }}>{text}</div>,
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'unifiedSocialCreditCode',
      key: 'unifiedSocialCreditCode',
      width: 180,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
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
    },
    {
      title: '贡献金额',
      dataIndex: 'contributionAmount',
      key: 'contributionAmount',
      width: 120,
      render: (amount: number | null) => (amount ? `¥${amount.toLocaleString()}` : '¥0'),
    },
    {
      title: '顾问会计',
      dataIndex: 'consultantAccountant',
      key: 'consultantAccountant',
      width: 120,
      render: (text: string | null) => text || '未分配',
    },
    {
      title: '记账会计',
      dataIndex: 'bookkeepingAccountant',
      key: 'bookkeepingAccountant',
      width: 120,
      render: (text: string | null) => text || '未分配',
    },
  ]

  // 概览信息渲染（包含筛选条件）
  const renderSummary = (data: {
    summary?: {
      totalNewCustomers?: number
      averageMonthlyGrowth?: number
      currentMonthCount?: number
      previousMonthCount?: number
    }
    list: NewCustomerItem[]
    totalPages: number
  }) => (
    <>
      {/* 统计概览 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(82, 196, 26, 0.15)' }}>
            <Statistic
              title="新增客户总数"
              value={data.summary?.totalNewCustomers || 0}
              suffix="个"
              valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(82, 196, 26, 0.15)' }}>
            <Statistic
              title="月均新增"
              value={data.summary?.averageMonthlyGrowth || 0}
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
              value={data.list?.length || 0}
              suffix="条"
              valueStyle={{ color: '#fa8c16', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(82, 196, 26, 0.15)' }}>
            <Statistic
              title="总页数"
              value={data.totalPages || 0}
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
              value={filterParams.dateRange}
              onChange={dates => {
                updateFilter({
                  dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null,
                  selectedMonth: null,
                })
              }}
              format="YYYY-MM-DD"
              allowClear={true}
            />
          </div>
          <div>
            <span style={{ marginRight: 8 }}>年月筛选：</span>
            <DatePicker
              value={filterParams.selectedMonth}
              onChange={date => {
                updateFilter({
                  selectedMonth: date,
                  dateRange: null,
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
    </>
  )

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

      {/* 服务端驱动的表格 */}
      <ServerTable<NewCustomerItem>
        endpoint="/reports/new-customer-stats"
        columns={columns}
        rowKey="customerId"
        defaultParams={{
          page: 1,
          pageSize: 10,
          sortField: 'customerId',
          sortOrder: 'DESC',
        }}
        renderSummary={renderSummary}
        apiFunction={params => {
          // 处理selectedMonth到year/month的转换
          const processedParams = { ...params }

          if (processedParams.selectedMonth) {
            const monthValue = dayjs(processedParams.selectedMonth)
            processedParams.year = monthValue.year()
            processedParams.month = monthValue.month() + 1
            delete processedParams.selectedMonth
          }

          return getNewCustomerStats(processedParams)
        }}
      />
    </div>
  )
}

export default NewCustomerDetail
