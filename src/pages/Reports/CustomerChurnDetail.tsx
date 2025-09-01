import React, { useMemo } from 'react'
import { Card, Table, Tag, Button, Space, Typography, Row, Col, Statistic, Select } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCustomerChurnStats } from './hooks/useCustomerChurnStats'
import type { ChurnedCustomerItem } from './types/reports'
import type { ColumnsType, TableProps } from 'antd/es/table'
import dayjs from 'dayjs'
import {
  BUSINESS_STATUS_MAP,
  ENTERPRISE_STATUS_MAP,
  BUSINESS_STATUS_COLOR_MAP,
  ENTERPRISE_STATUS_COLOR_MAP,
} from '../../constants'

const { Title, Text } = Typography
const { Option } = Select

const CustomerChurnDetail: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // 从URL参数获取所有状态
  const urlParams = useMemo(() => {
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const page = searchParams.get('page')
    const pageSize = searchParams.get('pageSize')
    const sortField = searchParams.get('sortField')
    const sortOrder = searchParams.get('sortOrder')

    return {
      selectedYear: year ? parseInt(year) : dayjs().year(),
      selectedMonth: month ? parseInt(month) : undefined,
      currentPage: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 10,
      sortField: sortField || undefined, // 允许无排序状态
      sortOrder: (sortOrder as 'ASC' | 'DESC') || undefined, // 允许无排序状态
    }
  }, [searchParams])

  const { selectedYear, selectedMonth, currentPage, pageSize, sortField, sortOrder } = urlParams

  const { data, isLoading } = useCustomerChurnStats({
    year: selectedYear,
    month: selectedMonth,
    page: currentPage,
    pageSize,
    sortField,
    sortOrder,
  })

  // 更新URL参数的辅助函数
  const updateUrlParams = (newParams: {
    selectedYear?: number
    selectedMonth?: number | undefined
    currentPage?: number
    pageSize?: number
    sortField?: string
    sortOrder?: 'ASC' | 'DESC'
  }) => {
    const updatedParams = new URLSearchParams(searchParams)

    // 映射内部状态名到URL参数名
    const paramMapping = {
      selectedYear: 'year',
      selectedMonth: 'month',
      currentPage: 'page',
      pageSize: 'pageSize',
      sortField: 'sortField',
      sortOrder: 'sortOrder',
    }

    Object.entries(newParams).forEach(([key, value]) => {
      const urlKey = paramMapping[key as keyof typeof paramMapping]
      if (value !== undefined && value !== null) {
        updatedParams.set(urlKey, value.toString())
      } else {
        updatedParams.delete(urlKey)
      }
    })

    setSearchParams(updatedParams, { replace: true })
  }

  // 处理表格变化（分页、排序）
  const handleTableChange: TableProps<ChurnedCustomerItem>['onChange'] = (
    pagination,
    _filters,
    sorter
  ) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Table change:', {
        pagination,
        sorter,
        'sorter.field': !Array.isArray(sorter) ? sorter?.field : sorter?.[0]?.field,
        'sorter.order': !Array.isArray(sorter) ? sorter?.order : sorter?.[0]?.order,
        'Object.keys(sorter)': Object.keys(sorter || {}),
        currentPage,
        pageSize,
        sortField,
        sortOrder,
      }) // 详细调试日志
    }

    // 检测是否是取消排序的情况
    const isCurrentlySorted = sortField && sortOrder
    const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter
    const hasNewSorting = currentSorter && currentSorter.field && currentSorter.order
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
    if (hasNewSorting && currentSorter) {
      // 有明确的排序字段和排序方向
      updateUrlParams({
        sortField: currentSorter.field as string,
        sortOrder: currentSorter.order === 'ascend' ? 'ASC' : 'DESC',
        currentPage: pagination.current || 1, // 排序时使用当前页或重置到第一页
      })
    } else if (isCancelingSorting) {
      // 取消排序：当前有排序但新的sorter没有有效排序
      if (process.env.NODE_ENV === 'development') {
        console.log('取消排序:', { sortField, sortOrder })
      }
      // 完全移除排序参数，让表格回到无排序状态
      const updatedParams = new URLSearchParams(searchParams)
      updatedParams.delete('sortField')
      updatedParams.delete('sortOrder')
      updatedParams.set('page', '1') // 取消排序时重置到第一页
      setSearchParams(updatedParams, { replace: true })
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

  // 处理年份变化
  const handleYearChange = (year: number) => {
    updateUrlParams({
      selectedYear: year,
      currentPage: 1, // 重置到第一页
    })
  }

  // 处理月份变化
  const handleMonthChange = (month: number | undefined) => {
    updateUrlParams({
      selectedMonth: month,
      currentPage: 1, // 重置到第一页
    })
  }

  const getChurnReasonColor = (reason: string) => {
    if (reason.includes('注销')) return 'red'
    if (reason.includes('流失')) return 'orange'
    if (reason.includes('暂停')) return 'blue'
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
      // 动态设置排序状态
      sortOrder:
        sortField === 'churnDate' && sortOrder
          ? sortOrder === 'DESC'
            ? 'descend'
            : 'ascend'
          : null,
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
      render: (status: string) => {
        const displayText =
          ENTERPRISE_STATUS_MAP[status as keyof typeof ENTERPRISE_STATUS_MAP] || status
        const color =
          ENTERPRISE_STATUS_COLOR_MAP[status as keyof typeof ENTERPRISE_STATUS_COLOR_MAP] ||
          'default'
        return <Tag color={color}>{displayText}</Tag>
      },
    },
    {
      title: '税务状态',
      dataIndex: 'currentBusinessStatus',
      key: 'currentBusinessStatus',
      width: 100,
      render: (status: string) => {
        const displayText =
          BUSINESS_STATUS_MAP[status as keyof typeof BUSINESS_STATUS_MAP] || status
        const color =
          BUSINESS_STATUS_COLOR_MAP[status as keyof typeof BUSINESS_STATUS_COLOR_MAP] || 'default'
        return <Tag color={color}>{displayText}</Tag>
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

      {/* 筛选条件 */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Space size="large" wrap>
          <Text style={{ fontSize: '16px', fontWeight: 500, color: '#262626' }}>
            截止统计时间：
          </Text>
          <div>
            <span style={{ marginRight: 8 }}>年份：</span>
            <Select value={selectedYear} onChange={handleYearChange} style={{ width: 100 }}>
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
              onChange={handleMonthChange}
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

export default CustomerChurnDetail
