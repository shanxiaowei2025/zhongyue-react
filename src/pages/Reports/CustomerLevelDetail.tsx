import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  DatePicker,
  Input,
} from 'antd'
import { ArrowLeftOutlined, SearchOutlined, TrophyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCustomerLevelDistribution } from './hooks/useCustomerLevelDistribution'
import type { CustomerLevelDistributionItem } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input

const CustomerLevelDetail: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC' | undefined>()

  const { data, isLoading } = useCustomerLevelDistribution({
    year: selectedYear,
    month: selectedMonth,
    page: currentPage,
    pageSize,
    sortField,
    sortOrder,
  })

  // 搜索条件改变时重置到第一页
  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrentPage(1)
  }

  // 处理表格变化（分页、排序）
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    // 优先处理排序
    if (sorter && sorter.field) {
      setSortField(sorter.field)
      setSortOrder(sorter.order === 'ascend' ? 'ASC' : 'DESC')
      setCurrentPage(1) // 排序时重置到第一页
      if (pagination.pageSize && pagination.pageSize !== pageSize) {
        setPageSize(pagination.pageSize)
      }
    } else if (sorter && sorter.order === undefined) {
      // 取消排序
      setSortField(undefined)
      setSortOrder(undefined)
      setCurrentPage(1) // 取消排序时也重置到第一页
    } else {
      // 纯分页操作
      if (pagination.pageSize && pagination.pageSize !== pageSize) {
        // 页面大小变化时重置到第一页
        setPageSize(pagination.pageSize)
        setCurrentPage(1)
      } else if (pagination.current) {
        // 只是页码变化时不重置
        setCurrentPage(pagination.current)
      }
    }
  }

  const getLevelColor = (level: string) => {
    const colors = {
      A级: '#ff4d4f',
      B级: '#fa8c16',
      C级: '#faad14',
      D级: '#52c41a',
      E级: '#1890ff',
      未分级: '#d9d9d9',
    }
    return colors[level as keyof typeof colors] || '#722ed1'
  }

  const columns: ColumnsType<CustomerLevelDistributionItem> = [
    {
      title: '客户等级',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      fixed: 'left',
      render: (level: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TrophyOutlined style={{ color: getLevelColor(level), marginRight: 8 }} />
          <span style={{ fontWeight: 600, color: getLevelColor(level), fontSize: 16 }}>
            {level}
          </span>
        </div>
      ),
    },
    {
      title: '客户数量',
      dataIndex: 'count',
      key: 'count',
      width: 120,
      render: (count: number, record) => (
        <span style={{ color: getLevelColor(record.level), fontWeight: 600, fontSize: 16 }}>
          {count}个
        </span>
      ),
      sorter: true,
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 100,
      render: (percentage: number, record) => (
        <span style={{ color: getLevelColor(record.level), fontWeight: 500 }}>
          {percentage.toFixed(1)}%
        </span>
      ),
      sorter: true,
    },
    {
      title: '总收入',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 140,
      render: (revenue: number) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>¥{revenue.toLocaleString()}</span>
      ),
      sorter: true,
    },
    {
      title: '平均收入',
      dataIndex: 'averageRevenue',
      key: 'averageRevenue',
      width: 140,
      render: (revenue: number) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>¥{revenue.toLocaleString()}</span>
      ),
      sorter: true,
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
          background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
          padding: '20px 24px',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(114, 46, 209, 0.25)',
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
          🎯 客户等级分布详情
        </Title>
      </div>

      {/* 统计概览 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(114, 46, 209, 0.15)' }}>
            <Statistic
              title="客户总数"
              value={data?.summary?.totalCustomers || 0}
              suffix="个"
              valueStyle={{ color: '#722ed1', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(114, 46, 209, 0.15)' }}>
            <Statistic
              title="总收入"
              value={data?.summary?.totalRevenue || 0}
              prefix="¥"
              valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(114, 46, 209, 0.15)' }}>
            <Statistic
              title="平均收入"
              value={data?.summary?.averageRevenue || 0}
              prefix="¥"
              precision={0}
              valueStyle={{ color: '#1890ff', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(114, 46, 209, 0.15)' }}>
            <Statistic
              title="A级客户占比"
              value={
                (data?.distribution || []).find(
                  (item: CustomerLevelDistributionItem) => item.level === 'A级'
                )?.percentage || 0
              }
              suffix="%"
              precision={1}
              valueStyle={{ color: '#ff4d4f', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Space size="large" wrap>
          <div>
            <span style={{ marginRight: 8 }}>年份：</span>
            <DatePicker
              picker="year"
              value={dayjs().year(selectedYear)}
              onChange={date => setSelectedYear(date?.year() || dayjs().year())}
              allowClear={false}
            />
          </div>
          <div>
            <span style={{ marginRight: 8 }}>月份：</span>
            <DatePicker
              picker="month"
              value={selectedMonth ? dayjs().month(selectedMonth - 1) : null}
              onChange={date => setSelectedMonth(date ? date.month() + 1 : undefined)}
              placeholder="全年"
              allowClear
            />
          </div>
          <Search
            placeholder="搜索客户等级"
            allowClear
            style={{ width: 200 }}
            onSearch={handleSearch}
            onChange={e => {
              if (!e.target.value) {
                handleSearch('')
              }
            }}
            prefix={<SearchOutlined />}
          />
        </Space>
      </Card>

      {/* 数据表格 */}
      <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
        <Table
          columns={columns}
          dataSource={data?.distribution || []}
          rowKey="level"
          loading={isLoading}
          scroll={{ x: 800 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.summary?.totalCustomers || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          size="middle"
        />
      </Card>
    </div>
  )
}

export default CustomerLevelDetail
