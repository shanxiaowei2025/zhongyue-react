import React, { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Input,
  DatePicker,
  Select,
} from 'antd'
import { ArrowLeftOutlined, SearchOutlined, UserDeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCustomerChurnStats } from './hooks/useCustomerChurnStats'
import type { ChurnedCustomerItem } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

const CustomerChurnDetail: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [selectedYear, setSelectedYear] = useState(dayjs().year())
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC' | undefined>()

  const { data, isLoading } = useCustomerChurnStats({
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

  const getChurnReasonColor = (reason: string) => {
    if (reason.includes('注销')) return 'red'
    if (reason.includes('流失')) return 'orange'
    if (reason.includes('暂停')) return 'blue'
    return 'default'
  }

  const getStatusColor = (status: string) => {
    if (status.includes('注销')) return 'red'
    if (status.includes('正常')) return 'green'
    if (status.includes('吊销')) return 'orange'
    return 'default'
  }

  const columns: ColumnsType<ChurnedCustomerItem> = [
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
      title: '流失日期',
      dataIndex: 'churnDate',
      key: 'churnDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: true,
    },
    {
      title: '流失原因',
      dataIndex: 'churnReason',
      key: 'churnReason',
      width: 120,
      render: (reason: string) => <Tag color={getChurnReasonColor(reason)}>{reason}</Tag>,
    },
    {
      title: '最后服务日期',
      dataIndex: 'lastServiceDate',
      key: 'lastServiceDate',
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '无记录'),
    },
    {
      title: '工商状态',
      dataIndex: 'currentEnterpriseStatus',
      key: 'currentEnterpriseStatus',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: '税务状态',
      dataIndex: 'currentBusinessStatus',
      key: 'currentBusinessStatus',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
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
          background: 'linear-gradient(135deg, #ab47bc 0%, #9c27b0 100%)',
          padding: '20px 24px',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(156, 39, 176, 0.25)',
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
          👋 客户流失统计详情
        </Title>
      </div>

      {/* 统计概览 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(156, 39, 176, 0.15)' }}>
            <Statistic
              title="总流失客户"
              value={data?.summary?.totalChurned || 0}
              suffix="个"
              valueStyle={{ color: '#9c27b0', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(156, 39, 176, 0.15)' }}>
            <Statistic
              title="企业注销"
              value={data?.summary?.cancelledEnterpriseCount || 0}
              suffix="个"
              valueStyle={{ color: '#ff4d4f', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(156, 39, 176, 0.15)' }}>
            <Statistic
              title="税务流失"
              value={data?.summary?.lostBusinessCount || 0}
              suffix="个"
              valueStyle={{ color: '#fa8c16', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(156, 39, 176, 0.15)' }}>
            <Statistic
              title="流失率"
              value={data?.summary?.churnRate || 0}
              suffix="%"
              precision={2}
              valueStyle={{ color: '#722ed1', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Space size="large" wrap>
          <div>
            <span style={{ marginRight: 8 }}>年份：</span>
            <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 100 }}>
              {Array.from({ length: 5 }, (_, i) => {
                const year = dayjs().year() - i
                return (
                  <Option key={year} value={year}>
                    {year}年
                  </Option>
                )
              })}
            </Select>
          </div>
          <div>
            <span style={{ marginRight: 8 }}>月份：</span>
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              style={{ width: 100 }}
              allowClear
              placeholder="全年"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <Option key={i + 1} value={i + 1}>
                  {i + 1}月
                </Option>
              ))}
            </Select>
          </div>
          <Search
            placeholder="搜索企业名称、信用代码、流失原因"
            allowClear
            style={{ width: 300 }}
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
          dataSource={data?.list || []}
          rowKey="customerId"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.summary?.totalChurned || 0,
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

export default CustomerChurnDetail
