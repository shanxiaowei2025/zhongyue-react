import React, { useEffect } from 'react'
import { CalendarOutlined } from '@ant-design/icons'
import { getServiceExpiryStats } from '../../api/reports'
import AdvancedServerTable from '../../components/AdvancedServerTable'
import ReportPageLayout from '../../components/ReportPageLayout'
import type { ExpiringCustomerItem } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import type { SummaryMetric, FilterConfig } from '../../types/advancedServerTable'
import dayjs from 'dayjs'
import { useNavigate, useLocation } from 'react-router-dom'

// 用于存储上次访问的报表子页面路径
const LAST_REPORT_SUBPAGE_KEY = 'lastReportSubpage'

const ServiceExpiryDetail: React.FC = () => {
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
  
  // 处理企业名称点击
  const handleCompanyClick = (customerId: number) => {
    // 跳转到客户详情页面，添加state参数记录来源页面
    navigate(`/customers?view=${customerId}`, {
      state: { from: '/reports/service-expiry' }
    })
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

  const columns: ColumnsType<ExpiringCustomerItem> = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      fixed: 'left',
      render: (text: string, record) => (
        <div 
          style={{ fontWeight: 500, color: '#1890ff', cursor: 'pointer' }}
          onClick={() => handleCompanyClick(record.customerId)}
        >
          {text}
        </div>
      ),
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'unifiedSocialCreditCode',
      key: 'unifiedSocialCreditCode',
      width: 180,
      render: (code: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {code === '无' ? <span style={{ color: '#999' }}>无</span> : code}
        </span>
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
      title: '超期天数',
      key: 'daysOverdue',
      dataIndex: 'agencyEndDate', // 使用 agencyEndDate 作为排序字段，因为超期天数是从结束日期计算的
      width: 100,
      sorter: true, // 启用排序
      render: (_, record) => {
        const days = getDaysOverdue(record.agencyEndDate)
        const color =
          days > 90 ? '#ff4d4f' : days > 30 ? '#fa8c16' : days > 0 ? '#faad14' : '#52c41a'
        return <span style={{ color, fontWeight: 500 }}>{days > 0 ? `+${days}` : days}天</span>
      },
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

  // 筛选器配置
  const filters: FilterConfig[] = [
    {
      key: 'companyName',
      type: 'search',
      label: '企业名称',
      placeholder: '请输入企业名称',
      width: 240,
    }
  ]

  const summaryMetrics: SummaryMetric[] = [
    {
      key: 'totalExpiredCustomers',
      title: '总到期客户',
      formatter: (_value: unknown, data: { summary?: { totalExpiredCustomers?: number } }) => {
        return String(data.summary?.totalExpiredCustomers || 0)
      },
      suffix: '个',
      color: '#ff9800',
    },
    {
      key: 'expiringInMonth',
      title: '本月到期',
      formatter: (_value: unknown, data: { summary?: { expiringInMonth?: number } }) => {
        return String(data.summary?.expiringInMonth || 0)
      },
      suffix: '个',
      color: '#1890ff',
    },
    {
      key: 'overdue',
      title: '已逾期',
      formatter: (_value: unknown, data: { summary?: { overdue?: number } }) => {
        return String(data.summary?.overdue || 0)
      },
      suffix: '个',
      color: '#ff4d4f',
    },
  ]

  return (
    <ReportPageLayout
      title="⏰ 代理服务到期客户详情"
      backgroundColor="linear-gradient(135deg, #ffa726 0%, #ff9800 100%)"
      titleColor="#ffffff"
      onBack={handleBackClick}
    >
      <AdvancedServerTable<ExpiringCustomerItem>
        endpoint="/reports/service-expiry-stats"
        columns={columns}
        rowKey="customerId"
        summaryMetrics={summaryMetrics}
        filters={filters}
        apiFunction={getServiceExpiryStats}
        defaultParams={{
          sortField: 'agencyEndDate', // 默认按代理结束日期排序
          sortOrder: 'ASC', // 升序排序（结束日期越早，超期天数越多，即按超期天数降序）
        }}
        tableProps={{
          scroll: { x: 1000 },
          size: 'middle' as const,
        }}
      />
      <style>{`
        .row-severe { background-color: #fff2f0; }
        .row-overdue { background-color: #fff7e6; }
        .row-expired { background-color: #fffbe6; }
      `}</style>
    </ReportPageLayout>
  )
}

export default ServiceExpiryDetail
