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
  Select,
} from 'antd'
import { ArrowLeftOutlined, ArrowDownOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAgencyFeeAnalysis } from './hooks/useAgencyFeeAnalysis'
import type { AgencyFeeDecreaseCustomer } from './types/reports'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

const AgencyFeeAnalysisDetail: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [threshold, setThreshold] = useState(500)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortField, setSortField] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC' | undefined>()

  const { data, isLoading, error } = useAgencyFeeAnalysis({
    threshold,
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

    // 优先处理排序
    if (hasNewSorting) {
      // 有明确的排序字段和排序方向
      setSortField(sorter.field)
      setSortOrder(sorter.order === 'ascend' ? 'ASC' : 'DESC')
      setCurrentPage(1) // 排序时重置到第一页
      if (pagination.pageSize && pagination.pageSize !== pageSize) {
        setPageSize(pagination.pageSize)
      }
    } else if (isCancelingSorting) {
      // 取消排序：当前有排序但新的sorter没有有效排序
      if (process.env.NODE_ENV === 'development') {
        console.log('取消排序:', { sortField, sortOrder })
      }
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

  const columns: ColumnsType<AgencyFeeDecreaseCustomer> = [
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
      title: '今年代理费',
      dataIndex: 'currentYearFee',
      key: 'currentYearFee',
      width: 120,
      render: (value: number) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>¥{value.toLocaleString()}</span>
      ),
      sorter: true,
    },
    {
      title: '去年代理费',
      dataIndex: 'previousYearFee',
      key: 'previousYearFee',
      width: 120,
      render: (value: number) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>¥{value.toLocaleString()}</span>
      ),
      sorter: true,
    },
    {
      title: '减少金额',
      dataIndex: 'decreaseAmount',
      key: 'decreaseAmount',
      width: 120,
      render: (value: number) => (
        <Tag color="red" icon={<ArrowDownOutlined />}>
          ¥{value.toLocaleString()}
        </Tag>
      ),
      sorter: true,
    },
    {
      title: '减少比例',
      dataIndex: 'decreaseRate',
      key: 'decreaseRate',
      width: 100,
      render: (value: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{value.toFixed(1)}%</span>
      ),
      sorter: true,
    },
    {
      title: '顾问会计',
      dataIndex: 'consultantAccountant',
      key: 'consultantAccountant',
      width: 120,
      render: (text: string) => text || '未分配',
    },
    {
      title: '记账会计',
      dataIndex: 'bookkeepingAccountant',
      key: 'bookkeepingAccountant',
      width: 120,
      render: (text: string) => text || '未分配',
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
          background: 'linear-gradient(135deg, #ff6b7a 0%, #ff4757 100%)',
          padding: '20px 24px',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(255, 71, 87, 0.25)',
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
          📉 代理费收费变化分析详情
        </Title>
      </div>

      {/* 统计概览 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(255, 71, 87, 0.15)' }}>
            <Statistic
              title="减少客户总数"
              value={data?.total || 0}
              suffix="个"
              valueStyle={{ color: '#ff4757', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(255, 71, 87, 0.15)' }}>
            <Statistic
              title="总减少金额"
              value={(data?.list || []).reduce((sum, item) => sum + item.decreaseAmount, 0)}
              prefix="¥"
              valueStyle={{ color: '#ff4757', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(255, 71, 87, 0.15)' }}>
            <Statistic
              title="平均减少金额"
              value={
                (data?.list || []).length > 0
                  ? (data?.list || []).reduce((sum, item) => sum + item.decreaseAmount, 0) /
                    (data?.list || []).length
                  : 0
              }
              prefix="¥"
              precision={0}
              valueStyle={{ color: '#ff4757', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Space size="large" wrap>
          <div>
            <span style={{ marginRight: 8 }}>减少阈值：</span>
            <Select value={threshold} onChange={setThreshold} style={{ width: 120 }}>
              <Option value={300}>≥300元</Option>
              <Option value={500}>≥500元</Option>
              <Option value={1000}>≥1000元</Option>
              <Option value={2000}>≥2000元</Option>
            </Select>
          </div>
          <Search
            placeholder="搜索企业名称、信用代码、会计姓名"
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
            total: data?.total || 0,
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

export default AgencyFeeAnalysisDetail
