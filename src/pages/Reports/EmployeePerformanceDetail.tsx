import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Input,
  DatePicker,
} from 'antd'
import { ArrowLeftOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useEmployeePerformance } from './hooks/useEmployeePerformance'
import type { EmployeePerformanceItem } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input

const EmployeePerformanceDetail: React.FC = () => {
  const navigate = useNavigate()
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [departmentSearch, setDepartmentSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'))
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState<string | undefined>('totalRevenue')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC' | undefined>('DESC')

  const { data, isLoading } = useEmployeePerformance({
    month: selectedMonth,
    page: currentPage,
    pageSize,
    employeeName: employeeSearch || undefined,
    department: departmentSearch || undefined,
    sortField,
    sortOrder,
  })

  // 调试：监控关键状态变化（开发环境）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('State changed:', {
        currentPage,
        pageSize,
        employeeSearch,
        departmentSearch,
        selectedMonth,
      })
    }
  }, [currentPage, pageSize, employeeSearch, departmentSearch, selectedMonth])

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Data received:', {
        total: data?.total,
        listLength: data?.list?.length,
        page: data?.page,
        pageSize: data?.pageSize,
      })
    }
  }, [data])

  // 员工搜索条件改变时重置到第一页
  const handleEmployeeSearch = (value: string) => {
    setEmployeeSearch(value)
    setCurrentPage(1)
  }

  // 部门搜索条件改变时重置到第一页
  const handleDepartmentSearch = (value: string) => {
    setDepartmentSearch(value)
    setCurrentPage(1)
  }

  // 月份改变时重置到第一页
  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    setSelectedMonth(date?.format('YYYY-MM') || dayjs().format('YYYY-MM'))
    setCurrentPage(1)
  }

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
      setSortField('totalRevenue')
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

  const columns: ColumnsType<EmployeePerformanceItem> = [
    {
      title: '员工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 120,
      fixed: 'left',
      render: (text: string) => (
        <div style={{ fontWeight: 500, color: '#262626' }}>
          <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          {text}
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (text: string) => text || '未分配',
    },
    {
      title: '新增业务收入',
      dataIndex: 'newCustomerRevenue',
      key: 'newCustomerRevenue',
      width: 140,
      render: (value: number) => (
        <span style={{ color: '#667eea', fontWeight: 500 }}>¥{value.toLocaleString()}</span>
      ),
      sorter: true,
    },
    {
      title: '其他业务收入',
      dataIndex: 'otherRevenue',
      key: 'otherRevenue',
      width: 140,
      render: (value: number) => (
        <span style={{ color: '#ffa726', fontWeight: 500 }}>¥{value.toLocaleString()}</span>
      ),
      sorter: true,
    },
    {
      title: '续费业务收入',
      dataIndex: 'renewalRevenue',
      key: 'renewalRevenue',
      width: 140,
      render: (value: number) => (
        <span style={{ color: '#ff6b7a', fontWeight: 500 }}>¥{value.toLocaleString()}</span>
      ),
      sorter: true,
    },
    {
      title: '总收入',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 140,
      render: (value: number) => (
        <span style={{ color: '#52c41a', fontWeight: 600, fontSize: 16 }}>
          ¥{value.toLocaleString()}
        </span>
      ),
      sorter: true,
      defaultSortOrder: 'descend' as const, // 默认按总收入降序排序
    },
    {
      title: '客户数量',
      dataIndex: 'customerCount',
      key: 'customerCount',
      width: 100,
      render: (value: number) => (
        <span style={{ color: '#722ed1', fontWeight: 500 }}>{value}个</span>
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px 24px',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.25)',
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
          📊 员工业绩统计详情
        </Title>
      </div>

      {/* 统计概览 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)' }}>
            <Statistic
              title="员工总数"
              value={data?.list?.length || 0}
              suffix="人"
              valueStyle={{ color: '#667eea', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)' }}>
            <Statistic
              title="总收入"
              value={data?.summary?.totalRevenue || 0}
              prefix="¥"
              valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)' }}>
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
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)' }}>
            <Statistic
              title="业绩冠军"
              value={data?.summary?.topPerformer || '暂无'}
              valueStyle={{ color: '#fa8c16', fontSize: 20, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Space size="large" wrap>
          <div>
            <span style={{ marginRight: 8 }}>查询月份：</span>
            <DatePicker
              picker="month"
              value={dayjs(selectedMonth)}
              onChange={handleMonthChange}
              allowClear={false}
            />
          </div>
          <Search
            placeholder="搜索员工姓名"
            allowClear
            style={{ width: 200 }}
            onSearch={handleEmployeeSearch}
            onChange={e => {
              if (!e.target.value) {
                handleEmployeeSearch('')
              }
            }}
            prefix={<SearchOutlined />}
          />
          <Search
            placeholder="搜索部门"
            allowClear
            style={{ width: 200 }}
            onSearch={handleDepartmentSearch}
            onChange={e => {
              if (!e.target.value) {
                handleDepartmentSearch('')
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
          rowKey="employeeName"
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

export default EmployeePerformanceDetail
