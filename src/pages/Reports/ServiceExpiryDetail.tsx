import React from 'react'
import { Tag } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import { getServiceExpiryStats } from '../../api/reports'
import AdvancedServerTable from '../../components/AdvancedServerTable'
import ReportPageLayout from '../../components/ReportPageLayout'
import type { ExpiringCustomerItem } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import type { SummaryMetric } from '../../types/advancedServerTable'
import dayjs from 'dayjs'

const ServiceExpiryDetail: React.FC = () => {
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
      render: (text: string) => <div style={{ fontWeight: 500, color: '#262626' }}>{text}</div>,
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
      width: 100,
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

  const summaryMetrics: SummaryMetric[] = [
    {
      key: 'totalExpiredCustomers',
      title: '总到期客户',
      formatter: (value: any, data: any) => {
        return data.summary?.totalExpiredCustomers || 0
      },
      suffix: '个',
      color: '#ff9800',
    },
    {
      key: 'expiringInMonth',
      title: '本月到期',
      formatter: (value: any, data: any) => {
        return data.summary?.expiringInMonth || 0
      },
      suffix: '个',
      color: '#1890ff',
    },
    {
      key: 'overdue',
      title: '已逾期',
      formatter: (value: any, data: any) => {
        return data.summary?.overdue || 0
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
    >
      <AdvancedServerTable<ExpiringCustomerItem>
        endpoint="/reports/service-expiry-stats"
        columns={columns}
        rowKey="customerId"
        summaryMetrics={summaryMetrics}
        apiFunction={getServiceExpiryStats}
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
