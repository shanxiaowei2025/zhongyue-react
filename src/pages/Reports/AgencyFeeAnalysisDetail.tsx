import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Tag } from 'antd'
import { ArrowDownOutlined } from '@ant-design/icons'
import { getAgencyFeeAnalysis } from '../../api/reports'
import AdvancedServerTable from '../../components/AdvancedServerTable'
import ReportPageLayout from '../../components/ReportPageLayout'
import type { AgencyFeeDecreaseCustomer } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import type { FilterConfig, SummaryMetric } from '../../types/advancedServerTable'

// 用于存储上次访问的报表子页面路径
const LAST_REPORT_SUBPAGE_KEY = 'lastReportSubpage'

const AgencyFeeAnalysisDetail: React.FC = () => {
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

  const filters: FilterConfig[] = [
    {
      key: 'threshold',
      type: 'select',
      label: '减少阈值',
      placeholder: '选择阈值',
      defaultValue: 500,
      width: 120,
      options: [
        { label: '≥300元', value: 300 },
        { label: '≥500元', value: 500 },
        { label: '≥1000元', value: 1000 },
        { label: '≥2000元', value: 2000 },
      ],
    },
    {
      key: 'year',
      type: 'year',
      label: '对比年份',
      placeholder: '选择年份',
      defaultValue: new Date().getFullYear(),
      width: 120,
    },
  ]

  const summaryMetrics: SummaryMetric[] = [
    {
      key: 'affectedCustomers',
      title: '减少客户总数',
      formatter: (_value: unknown, data: { summary?: { affectedCustomers?: number } }) => {
        return String(data.summary?.affectedCustomers || 0)
      },
      suffix: '个',
      color: '#ff4757',
    },
    {
      key: 'totalDecrease',
      title: '总减少金额',
      formatter: (_value: unknown, data: { summary?: { totalDecrease?: number } }) => {
        return `¥${(data.summary?.totalDecrease || 0).toLocaleString()}`
      },
      color: '#ff4757',
    },
    {
      key: 'averageDecrease',
      title: '平均减少金额',
      formatter: (_value: unknown, data: { summary?: { averageDecrease?: number } }) => {
        return `¥${Math.round(data.summary?.averageDecrease || 0).toLocaleString()}`
      },
      color: '#ff4757',
    },
  ]

  const defaultParams = {
    threshold: 500,
    year: new Date().getFullYear(),
  }

  return (
    <ReportPageLayout
      title="💰 代理费变动分析详情"
      backgroundColor="linear-gradient(135deg, #1890ff 0%, #096dd9 100%)"
      titleColor="#ffffff"
      onBack={handleBackClick}
    >
      <AdvancedServerTable<AgencyFeeDecreaseCustomer>
        endpoint="/reports/agency-fee-analysis"
        columns={columns}
        rowKey="customerId"
        defaultParams={defaultParams}
        filters={filters}
        summaryMetrics={summaryMetrics}
        apiFunction={getAgencyFeeAnalysis}
        tableProps={{
          scroll: { x: 1200 },
          size: 'middle' as const,
        }}
      />
    </ReportPageLayout>
  )
}

export default AgencyFeeAnalysisDetail
