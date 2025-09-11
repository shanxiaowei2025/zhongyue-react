import React, { useMemo, useEffect } from 'react'
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
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useEmployeePerformance } from './hooks/useEmployeePerformance'
import type { EmployeePerformanceItem } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input

// 用于存储上次访问的报表子页面路径
const LAST_REPORT_SUBPAGE_KEY = 'lastReportSubpage'

const EmployeePerformanceDetail: React.FC = () => {
  // 添加导航钩子
  const navigate = useNavigate()
  const location = useLocation()
  
  // 保存当前路径，以便从其他页面返回时能回到这里
  useEffect(() => {
    // 保存完整的路径和查询参数
    const fullPath = location.pathname + location.search
    localStorage.setItem(LAST_REPORT_SUBPAGE_KEY, fullPath)
  }, [location.pathname, location.search])
  
  // 处理返回按钮点击
  const handleBackClick = () => {
    // 清除localStorage中保存的路径，这样就不会被重定向回来
    localStorage.removeItem(LAST_REPORT_SUBPAGE_KEY)
    // 导航到报表主页，添加force=true参数强制显示主页
    navigate('/reports?force=true')
  }

  const [searchParams, setSearchParams] = useSearchParams()

  // 🚀 简化URL参数解析，统一命名
  const urlParams = useMemo(() => {
    const employeeSearch = searchParams.get('employeeSearch') || ''
    const departmentSearch = searchParams.get('departmentSearch') || ''
    const selectedMonth = searchParams.get('selectedMonth') || dayjs().format('YYYY-MM')
    const currentPage = parseInt(searchParams.get('currentPage') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const sortField = searchParams.get('sortField') || ''
    const sortOrder = (searchParams.get('sortOrder') as 'ASC' | 'DESC') || ''

    return {
      employeeSearch,
      departmentSearch,
      selectedMonth,
      currentPage,
      pageSize,
      sortField,
      sortOrder,
    }
  }, [searchParams])

  const {
    employeeSearch,
    departmentSearch,
    selectedMonth,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
  } = urlParams

  // 🚀 极简URL参数更新函数，零映射逻辑
  const updateUrlParams = (updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        newParams.set(key, String(value))
      } else {
        newParams.delete(key)
      }
    })

    setSearchParams(newParams, { replace: true })
  }

  const { data, isLoading } = useEmployeePerformance({
    month: selectedMonth,
    page: currentPage,
    pageSize,
    employeeName: employeeSearch || undefined,
    department: departmentSearch || undefined,
    sortField: sortField || 'totalRevenue', // 后端需要默认排序
    sortOrder: sortOrder || 'DESC',
  })

  // 员工搜索条件改变时重置到第一页
  const handleEmployeeSearch = (value: string) => {
    updateUrlParams({
      employeeSearch: value,
      currentPage: 1,
    })
  }

  // 部门搜索条件改变时重置到第一页
  const handleDepartmentSearch = (value: string) => {
    updateUrlParams({
      departmentSearch: value,
      currentPage: 1,
    })
  }

  // 月份改变时重置到第一页
  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    updateUrlParams({
      selectedMonth: date?.format('YYYY-MM') || dayjs().format('YYYY-MM'),
      currentPage: 1,
    })
  }

  // 🚀 彻底简化：零逻辑状态管理，完全依赖后端
  const handleTableChange: TableProps<EmployeePerformanceItem>['onChange'] = (
    pagination,
    _,
    sorter
  ) => {
    const updates: Record<string, string | number> = {}

    // 分页：直接映射，零判断
    if (pagination.current !== undefined) {
      updates.currentPage = pagination.current
    }
    if (pagination.pageSize !== undefined) {
      updates.pageSize = pagination.pageSize
      // 页面大小变化重置页码
      if (pagination.pageSize !== pageSize) {
        updates.currentPage = 1
      }
    }

    // 排序：直接映射，零状态判断
    if (sorter && !Array.isArray(sorter)) {
      if (sorter.field && sorter.order) {
        // 有排序：直接设置
        updates.sortField = sorter.field as string
        updates.sortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC'
      } else {
        // 取消排序：清空参数让后端返回默认排序
        updates.sortField = ''
        updates.sortOrder = ''
      }
    }

    // 直接更新，零条件判断
    updateUrlParams(updates)
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
      // 🚀 移除动态sortOrder，让Table完全自主管理UI状态
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
      // 🚀 移除动态sortOrder，让Table完全自主管理UI状态
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
      // 🚀 移除动态sortOrder，让Table完全自主管理UI状态
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
      // 🚀 移除动态sortOrder，让Table完全自主管理UI状态
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
      // 🚀 移除动态sortOrder，让Table完全自主管理UI状态
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
          onClick={handleBackClick}
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
          // 🚀 完全受控：不强制任何排序状态，让Table自主管理UI
          showSorterTooltip={false}
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
