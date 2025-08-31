import React, { useState, useMemo } from 'react'
import { Row, Col, Space, Typography, Spin, Alert } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { isAdminUser } from '../../utils/permissionUtils'
import { useReportsDashboard } from './hooks/useReportsDashboard'
import StatisticCard from './components/StatisticCard'
import EmployeePerformanceChart from './components/EmployeePerformanceChart'
import AccountantDistributionChart from './components/AccountantDistributionChart'
import ChurnTrendChart from './components/ChurnTrendChart'
import NewCustomerChart from './components/NewCustomerChart'
import CustomerLevelChart from './components/CustomerLevelChart'
import AgencyFeeDecreaseList from './components/AgencyFeeDecreaseList'
import ExpiringCustomersList from './components/ExpiringCustomersList'
import DateRangeFilter from './components/DateRangeFilter'

import RefreshButton from './components/RefreshButton'

const { Title } = Typography

const Reports: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // 检查用户是否为管理员
  const isAdmin = isAdminUser(user)

  // 筛选参数状态
  const [filterParams, setFilterParams] = useState({
    month: new Date().toISOString().slice(0, 7), // 当前月份 YYYY-MM
    year: new Date().getFullYear(),
    threshold: 500,
  })

  // 获取仪表盘数据
  const { dashboardData, isLoading, error, refreshAll, rawData } = useReportsDashboard(filterParams)

  // 处理日期筛选变化
  const handleDateFilterChange = (value: { month?: string; year?: number }) => {
    setFilterParams(prev => ({
      ...prev,
      ...value,
    }))
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="数据加载失败"
          description={error.message || '请稍后重试'}
          type="error"
          showIcon
          action={<RefreshButton onRefresh={refreshAll} />}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* 页面标题和操作栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px 32px',
          borderRadius: 20,
          boxShadow: '0 12px 40px rgba(102, 126, 234, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Title level={2} style={{ margin: 0, color: '#ffffff', fontWeight: 600 }}>
          📊 报表管理 - 业务数据概览
        </Title>
        <Space>
          <DateRangeFilter value={filterParams} onChange={handleDateFilterChange} />
          <RefreshButton onRefresh={refreshAll} loading={isLoading} />
        </Space>
      </div>

      {/* 统计卡片行 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard
            title="代理费减少客户"
            value={dashboardData.summary.agencyFeeDecreaseCount}
            type="decrease"
            loading={isLoading}
            tooltip="今年比去年代理费减少≥500元的客户数量"
            suffix="个"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard
            title="到期客户"
            value={dashboardData.summary.expiringCustomersCount}
            type="expiry"
            loading={isLoading}
            tooltip="代理服务已到期的客户数量"
            suffix="个"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard
            title="流失客户"
            value={dashboardData.summary.churnedCustomersCount}
            type="churn"
            loading={isLoading}
            tooltip="工商状态已注销或税务状态已流失的客户数量"
            suffix="个"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard
            title="员工业绩总额"
            value={dashboardData.summary.totalEmployeeRevenue}
            type="revenue"
            loading={isLoading}
            tooltip="本月员工已审核通过的费用总额"
            suffix="元"
            precision={0}
          />
        </Col>
      </Row>

      {/* 员工业绩图表 */}
      <Row style={{ marginBottom: 32 }}>
        <Col span={24}>
          <EmployeePerformanceChart
            data={dashboardData.charts.employeePerformance}
            loading={isLoading}
            onViewMore={() => navigate('/reports/employee-performance')}
          />
        </Col>
      </Row>

      {/* 图表行 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {/* 记账会计负责客户分布 - 仅管理员可见 */}
        {isAdmin && (
          <Col xs={24} lg={12}>
            <AccountantDistributionChart
              data={dashboardData.charts.accountantDistribution}
              loading={isLoading}
              onViewMore={() => navigate('/reports/accountant-client')}
            />
          </Col>
        )}
        <Col xs={24} lg={isAdmin ? 12 : 24}>
          <ChurnTrendChart
            data={dashboardData.charts.churnTrend}
            loading={isLoading}
            onViewMore={() => navigate('/reports/customer-churn')}
          />
        </Col>
      </Row>

      {/* 第三行图表 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={12}>
          <NewCustomerChart
            data={dashboardData.charts.newCustomer}
            loading={isLoading}
            onViewMore={() => navigate('/reports/new-customer')}
          />
        </Col>
        <Col xs={24} lg={12}>
          <CustomerLevelChart
            data={dashboardData.charts.customerLevel}
            loading={isLoading}
            onViewMore={() => navigate('/reports/customer-level')}
          />
        </Col>
      </Row>

      {/* 列表行 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <AgencyFeeDecreaseList
            data={dashboardData.lists.agencyFeeDecreaseCustomers}
            loading={isLoading}
            onViewMore={() => navigate('/reports/agency-fee-analysis')}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ExpiringCustomersList
            data={dashboardData.lists.expiringCustomers}
            loading={isLoading}
            onViewMore={() => navigate('/reports/service-expiry')}
          />
        </Col>
      </Row>

      {/* 全局加载遮罩 */}
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <Spin size="large" />
        </div>
      )}
    </div>
  )
}

export default Reports
