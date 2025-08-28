import React, { useState, useMemo } from 'react'
import { Card, Tag, Button, Space, Typography, Row, Col, Statistic, Input } from 'antd'
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAccountantClientStats } from './hooks/useAccountantClientStats'
import type { AccountantClientStatsItem } from './types/reports'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ChartDataLabels
)

const { Title } = Typography
const { Search } = Input

const AccountantClientDetail: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [sortField, setSortField] = useState<string | undefined>('clientCount')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC' | undefined>('DESC')

  const { data, isLoading } = useAccountantClientStats({
    page: 1,
    pageSize: 99999, // 设置足够大的pageSize，确保所有数据在一页显示
    sortField,
    sortOrder,
    accountantName: searchText || undefined, // 添加搜索参数
  })

  // 搜索条件改变
  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  // 统计数据 - 使用后端返回的summary数据，如果没有则计算
  const stats = data?.summary
    ? {
        totalClients: data.summary.totalClients,
        consultantClients: (data?.list || [])
          .filter(item => item.accountantType === 'consultantAccountant')
          .reduce((sum, item) => sum + item.clientCount, 0),
        bookkeepingClients: (data?.list || [])
          .filter(item => item.accountantType === 'bookkeepingAccountant')
          .reduce((sum, item) => sum + item.clientCount, 0),
        invoiceClients: (data?.list || [])
          .filter(item => item.accountantType === 'invoiceOfficer')
          .reduce((sum, item) => sum + item.clientCount, 0),
      }
    : (data?.list || []).reduce(
        (acc, item) => {
          acc.totalClients += item.clientCount
          if (item.accountantType === 'consultantAccountant')
            acc.consultantClients += item.clientCount
          if (item.accountantType === 'bookkeepingAccountant')
            acc.bookkeepingClients += item.clientCount
          if (item.accountantType === 'invoiceOfficer') acc.invoiceClients += item.clientCount
          return acc
        },
        { totalClients: 0, consultantClients: 0, bookkeepingClients: 0, invoiceClients: 0 }
      )

  // 按类型分组的图表数据处理
  const chartDataByType = useMemo(() => {
    if (!data?.list || data.list.length === 0) {
      return {
        consultantAccountants: null,
        bookkeepingAccountants: null,
        invoiceOfficers: null,
      }
    }

    // 按会计类型分组，并根据搜索条件过滤
    const filteredData = searchText
      ? data.list.filter(
          item =>
            item.accountantName.toLowerCase().includes(searchText.toLowerCase()) ||
            item.department?.toLowerCase().includes(searchText.toLowerCase())
        )
      : data.list

    const consultantAccountants = filteredData.filter(
      item => item.accountantType === 'consultantAccountant'
    )
    const bookkeepingAccountants = filteredData.filter(
      item => item.accountantType === 'bookkeepingAccountant'
    )
    const invoiceOfficers = filteredData.filter(item => item.accountantType === 'invoiceOfficer')

    // 创建顾问会计图表数据
    const consultantChartData =
      consultantAccountants.length > 0
        ? {
            labels: consultantAccountants.map(item => item.accountantName),
            datasets: [
              {
                label: '客户数量',
                data: consultantAccountants.map(item => item.clientCount),
                backgroundColor: '#667eea80',
                borderColor: '#667eea',
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          }
        : null

    // 创建记账会计图表数据
    const bookkeepingChartData =
      bookkeepingAccountants.length > 0
        ? {
            labels: bookkeepingAccountants.map(item => item.accountantName),
            datasets: [
              {
                label: '客户数量',
                data: bookkeepingAccountants.map(item => item.clientCount),
                backgroundColor: '#ff6b7a80',
                borderColor: '#ff6b7a',
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          }
        : null

    // 创建开票员图表数据
    const invoiceChartData =
      invoiceOfficers.length > 0
        ? {
            labels: invoiceOfficers.map(item => item.accountantName),
            datasets: [
              {
                label: '客户数量',
                data: invoiceOfficers.map(item => item.clientCount),
                backgroundColor: '#ffa72680',
                borderColor: '#ffa726',
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          }
        : null

    return {
      consultantAccountants: consultantChartData,
      bookkeepingAccountants: bookkeepingChartData,
      invoiceOfficers: invoiceChartData,
    }
  }, [data?.list, searchText])

  // 动态计算图表高度的函数
  const getChartHeight = (dataLength: number) => {
    if (dataLength === 0) return 200
    // 每个条形至少需要35px高度，最小200px，最大600px
    return Math.min(Math.max(dataLength * 35 + 80, 200), 600)
  }

  // 图表配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const, // 关键：设置为水平条形图
    plugins: {
      legend: {
        display: false, // 水平条形图不需要图例
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `客户数量: ${context.parsed.x}个`
          },
        },
      },
      datalabels: {
        display: true,
        anchor: 'end' as const,
        align: 'right' as const,
        formatter: (value: number) => {
          // 在条形内部显示客户数量
          return `${value}个`
        },
        color: '#ffffff',
        font: {
          weight: 'bold' as const,
          size: 11,
        },
        padding: {
          right: 6,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
        },
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: '客户数量',
          font: {
            size: 11,
            weight: 'bold' as const,
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 0,
          minRotation: 0,
        },
        title: {
          display: true,
          text: '会计姓名',
          font: {
            size: 11,
            weight: 'bold' as const,
          },
        },
      },
    },
  }

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
          🥧 会计负责客户统计详情
        </Title>
      </div>

      {/* 统计概览 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(82, 196, 26, 0.15)' }}>
            <Statistic
              title="客户总数"
              value={stats.totalClients}
              suffix="个"
              valueStyle={{ color: '#52c41a', fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)' }}>
            <Statistic
              title="顾问会计已分配客户"
              value={stats.consultantClients}
              suffix="个"
              valueStyle={{ color: '#667eea', fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(255, 107, 122, 0.15)' }}>
            <Statistic
              title="记账会计已分配客户"
              value={stats.bookkeepingClients}
              suffix="个"
              valueStyle={{ color: '#ff6b7a', fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(255, 167, 38, 0.15)' }}>
            <Statistic
              title="开票员已分配客户"
              value={stats.invoiceClients}
              suffix="个"
              valueStyle={{ color: '#ffa726', fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索 */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Search
          placeholder="搜索会计姓名或部门"
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

      {/* 数据图表 - 分三个独立图表显示 */}
      <Row gutter={[24, 24]}>
        {/* 顾问会计图表 */}
        <Col xs={24} lg={8}>
          <Card
            title="顾问会计负责客户分布"
            style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)' }}
          >
            <div
              style={{
                height: `${getChartHeight(
                  chartDataByType.consultantAccountants?.labels?.length || 0
                )}px`,
                padding: '10px',
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <span>加载中...</span>
                </div>
              ) : !chartDataByType.consultantAccountants ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <span>暂无顾问会计数据</span>
                </div>
              ) : (
                <Bar data={chartDataByType.consultantAccountants} options={chartOptions} />
              )}
            </div>
          </Card>
        </Col>

        {/* 记账会计图表 */}
        <Col xs={24} lg={8}>
          <Card
            title="记账会计负责客户分布"
            style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(255, 107, 122, 0.15)' }}
          >
            <div
              style={{
                height: `${getChartHeight(
                  chartDataByType.bookkeepingAccountants?.labels?.length || 0
                )}px`,
                padding: '10px',
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <span>加载中...</span>
                </div>
              ) : !chartDataByType.bookkeepingAccountants ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <span>暂无记账会计数据</span>
                </div>
              ) : (
                <Bar data={chartDataByType.bookkeepingAccountants} options={chartOptions} />
              )}
            </div>
          </Card>
        </Col>

        {/* 开票员图表 */}
        <Col xs={24} lg={8}>
          <Card
            title="开票员负责客户分布"
            style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(255, 167, 38, 0.15)' }}
          >
            <div
              style={{
                height: `${getChartHeight(chartDataByType.invoiceOfficers?.labels?.length || 0)}px`,
                padding: '10px',
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <span>加载中...</span>
                </div>
              ) : !chartDataByType.invoiceOfficers ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <span>暂无开票员数据</span>
                </div>
              ) : (
                <Bar data={chartDataByType.invoiceOfficers} options={chartOptions} />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AccountantClientDetail
