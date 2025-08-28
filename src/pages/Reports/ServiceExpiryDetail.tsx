import React, { useState } from 'react'
import { Card, Table, Tag, Button, Space, Typography, Row, Col, Statistic, Input } from 'antd'
import {
  ArrowLeftOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useServiceExpiryStats } from './hooks/useServiceExpiryStats'
import { useCustomerNames } from './hooks/useCustomerNames'
import type { ExpiringCustomerItem } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input

const ServiceExpiryDetail: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC' | undefined>()

  const { data, isLoading } = useServiceExpiryStats({
    page: currentPage,
    pageSize,
    sortField,
    sortOrder,
  })

  // 获取客户名称
  const customerIds = data?.list?.map(item => item.customerId) || []
  const { getCustomerName, isLoading: customerNamesLoading } = useCustomerNames(customerIds)

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

  // 计算到期天数
  const getDaysOverdue = (endDate: string) => {
    const today = dayjs()
    const expiry = dayjs(endDate)
    return today.diff(expiry, 'day')
  }

  // 获取到期状态标签
  const getExpiryTag = (endDate: string) => {
    const daysOverdue = getDaysOverdue(endDate)

    if (daysOverdue > 90) {
      return { color: 'red', text: `已到期${daysOverdue}天`, level: '严重超期' }
    } else if (daysOverdue > 30) {
      return { color: 'orange', text: `已到期${daysOverdue}天`, level: '超期' }
    } else if (daysOverdue > 0) {
      return { color: 'yellow', text: `已到期${daysOverdue}天`, level: '刚到期' }
    } else if (daysOverdue > -7) {
      return { color: 'blue', text: '即将到期', level: '即将到期' }
    } else {
      return { color: 'green', text: '正常', level: '正常' }
    }
  }

  // 统计不同状态的客户数量
  const statusStats = (data?.list || []).reduce(
    (acc, item) => {
      const daysOverdue = getDaysOverdue(item.agencyEndDate)
      if (daysOverdue > 90) acc.severe++
      else if (daysOverdue > 30) acc.overdue++
      else if (daysOverdue > 0) acc.justExpired++
      else if (daysOverdue > -7) acc.soonExpire++
      else acc.normal++
      return acc
    },
    { severe: 0, overdue: 0, justExpired: 0, soonExpire: 0, normal: 0 }
  )

  const columns: ColumnsType<ExpiringCustomerItem> = [
    {
      title: '客户名称',
      dataIndex: 'customerId',
      key: 'customerId',
      width: 200,
      fixed: 'left',
      render: (id: number) => (
        <div style={{ fontWeight: 500, color: '#262626' }}>{getCustomerName(id)}</div>
      ),
    },
    {
      title: '代理结束日期',
      dataIndex: 'agencyEndDate',
      key: 'agencyEndDate',
      width: 140,
      render: (date: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CalendarOutlined style={{ marginRight: 4, color: '#1890ff' }} />
          {dayjs(date).format('YYYY-MM-DD')}
        </div>
      ),
      sorter: true,
    },
    {
      title: '到期状态',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const status = getExpiryTag(record.agencyEndDate)
        return <Tag color={status.color}>{status.text}</Tag>
      },
      filters: [
        { text: '严重超期', value: 'severe' },
        { text: '超期', value: 'overdue' },
        { text: '刚到期', value: 'justExpired' },
        { text: '即将到期', value: 'soonExpire' },
        { text: '正常', value: 'normal' },
      ],
      onFilter: (value, record) => {
        const daysOverdue = getDaysOverdue(record.agencyEndDate)
        switch (value) {
          case 'severe':
            return daysOverdue > 90
          case 'overdue':
            return daysOverdue > 30 && daysOverdue <= 90
          case 'justExpired':
            return daysOverdue > 0 && daysOverdue <= 30
          case 'soonExpire':
            return daysOverdue > -7 && daysOverdue <= 0
          case 'normal':
            return daysOverdue <= -7
          default:
            return true
        }
      },
    },
    {
      title: '超期天数',
      key: 'daysOverdue',
      width: 100,
      render: (_, record) => {
        const days = getDaysOverdue(record.agencyEndDate)
        const color =
          days > 90 ? '#ff4d4f' : days > 30 ? '#fa8c16' : days > 0 ? '#faad14' : '#52c41a'
        return <span style={{ color, fontWeight: 500 }}>{days > 0 ? `+${days}` : days}天</span>
      },
      sorter: true,
    },
    {
      title: '紧急程度',
      key: 'urgency',
      width: 100,
      render: (_, record) => {
        const status = getExpiryTag(record.agencyEndDate)
        const colors = {
          严重超期: '#ff4d4f',
          超期: '#fa8c16',
          刚到期: '#faad14',
          即将到期: '#1890ff',
          正常: '#52c41a',
        }
        return (
          <span style={{ color: colors[status.level as keyof typeof colors], fontWeight: 500 }}>
            {status.level}
          </span>
        )
      },
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
          background: 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)',
          padding: '20px 24px',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(255, 152, 0, 0.25)',
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
          ⏰ 代理服务到期客户详情
        </Title>
      </div>

      {/* 统计概览 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8} md={4}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(255, 77, 79, 0.15)' }}>
            <Statistic
              title="严重超期"
              value={statusStats.severe}
              suffix="个"
              valueStyle={{ color: '#ff4d4f', fontSize: 20, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(250, 140, 22, 0.15)' }}>
            <Statistic
              title="超期"
              value={statusStats.overdue}
              suffix="个"
              valueStyle={{ color: '#fa8c16', fontSize: 20, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(250, 173, 20, 0.15)' }}>
            <Statistic
              title="刚到期"
              value={statusStats.justExpired}
              suffix="个"
              valueStyle={{ color: '#faad14', fontSize: 20, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(24, 144, 255, 0.15)' }}>
            <Statistic
              title="即将到期"
              value={statusStats.soonExpire}
              suffix="个"
              valueStyle={{ color: '#1890ff', fontSize: 20, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(82, 196, 26, 0.15)' }}>
            <Statistic
              title="正常"
              value={statusStats.normal}
              suffix="个"
              valueStyle={{ color: '#52c41a', fontSize: 20, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(255, 152, 0, 0.15)' }}>
            <Statistic
              title="总计"
              value={data?.totalExpiredCustomers || 0}
              suffix="个"
              valueStyle={{ color: '#ff9800', fontSize: 20, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索 */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Search
          placeholder="搜索客户名称或ID"
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
      </Card>

      {/* 数据表格 */}
      <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
        <Table
          columns={columns}
          dataSource={data?.list || []}
          rowKey="customerId"
          loading={isLoading || customerNamesLoading}
          scroll={{ x: 800 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.totalExpiredCustomers || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          size="middle"
          rowClassName={record => {
            const daysOverdue = getDaysOverdue(record.agencyEndDate)
            if (daysOverdue > 90) return 'row-severe'
            if (daysOverdue > 30) return 'row-overdue'
            if (daysOverdue > 0) return 'row-expired'
            return ''
          }}
        />
      </Card>

      <style>{`
        .row-severe { background-color: #fff2f0; }
        .row-overdue { background-color: #fff7e6; }
        .row-expired { background-color: #fffbe6; }
      `}</style>
    </div>
  )
}

export default ServiceExpiryDetail
