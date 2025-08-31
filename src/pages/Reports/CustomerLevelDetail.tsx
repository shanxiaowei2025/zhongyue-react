import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TrophyOutlined } from '@ant-design/icons'
import { getCustomerLevelDistribution } from '../../api/reports'
import { useCustomerLevelDistribution } from './hooks/useCustomerLevelDistribution'
import AdvancedServerTable from '../../components/AdvancedServerTable'
import ReportPageLayout from '../../components/ReportPageLayout'
import CustomerLevelChart from '../../components/CustomerLevelChart'
import type { CustomerLevelItem } from './types/reports'
import type { ColumnsType } from 'antd/es/table'
import type { SummaryMetric, FilterConfig } from '../../types/advancedServerTable'

const CustomerLevelDetail: React.FC = () => {
  const [searchParams] = useSearchParams()

  // 从URL参数获取当前筛选条件
  const currentYear = searchParams.get('year') || new Date().getFullYear().toString()
  const currentMonth = searchParams.get('month') || null

  // 使用hook获取客户等级数据
  const { data: levelData } = useCustomerLevelDistribution({
    year: parseInt(currentYear),
    month: currentMonth ? parseInt(currentMonth) : undefined,
    page: 1,
    pageSize: 1, // 只需要levelStats数据，不需要详细列表
  })

  // 生成动态选项
  const [levelOptions, setLevelOptions] = useState<Array<{ label: string; value: string }>>([])

  // 监听数据变化，更新选项
  useEffect(() => {
    if (levelData?.levelStats && levelData.levelStats.length > 0) {
      const options = levelData.levelStats.map((stat: any) => ({
        label: `${stat.level} (${stat.count}个)`,
        value: stat.level,
      }))

      // 使用排序函数
      const sortedOptions = sortLevelOptions(options)
      setLevelOptions(sortedOptions)
    } else {
      // 提供fallback选项
      setLevelOptions([
        { label: 'AA', value: 'AA' },
        { label: 'AB', value: 'AB' },
        { label: 'AC', value: 'AC' },
        { label: 'BA', value: 'BA' },
        { label: 'BB', value: 'BB' },
        { label: 'BC', value: 'BC' },
        { label: 'CA', value: 'CA' },
        { label: 'CB', value: 'CB' },
        { label: 'CC', value: 'CC' },
        { label: 'DA', value: 'DA' },
        { label: 'DB', value: 'DB' },
        { label: 'DC', value: 'DC' },
        { label: 'DD', value: 'DD' },
      ])
    }
  }, [levelData])

  // 自定义等级排序函数
  const sortLevelOptions = (options: Array<{ label: string; value: string }>) => {
    return options.sort((a, b) => {
      const levelA = a.value
      const levelB = b.value

      // 正则匹配字母等级格式 (如: AA, AB, BA, CC 等)
      const letterLevelRegex = /^[A-D][A-D]$/
      const isLetterA = letterLevelRegex.test(levelA)
      const isLetterB = letterLevelRegex.test(levelB)

      // 如果都是字母等级，按字典序排序
      if (isLetterA && isLetterB) {
        return levelA.localeCompare(levelB)
      }

      // 如果都是中文等级，保持原顺序
      if (!isLetterA && !isLetterB) {
        return 0
      }

      // 字母等级排在前面，中文等级排在后面
      return isLetterA ? -1 : 1
    })
  }

  // 获取等级颜色配置
  const getLevelColor = (level: string) => {
    const colors = {
      A级: '#ff4d4f',
      B级: '#fa8c16',
      C级: '#faad14',
      D级: '#52c41a',
      E级: '#1890ff',
      未分级: '#d9d9d9',
    }
    return colors[level as keyof typeof colors] || '#722ed1'
  }

  // 表格列配置
  const columns: ColumnsType<CustomerLevelItem> = [
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
      title: '客户等级',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      render: (level: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TrophyOutlined style={{ color: getLevelColor(level), marginRight: 8 }} />
          <span style={{ fontWeight: 600, color: getLevelColor(level), fontSize: 16 }}>
            {level}
          </span>
        </div>
      ),
      sorter: true,
    },
    {
      title: '贡献金额',
      dataIndex: 'contributionAmount',
      key: 'contributionAmount',
      width: 140,
      render: (amount: string) => {
        const numAmount = parseFloat(amount) || 0
        return (
          <span style={{ color: '#52c41a', fontWeight: 500 }}>¥{numAmount.toLocaleString()}</span>
        )
      },
      sorter: true,
    },
  ]

  // 统计指标配置
  const summaryMetrics: SummaryMetric[] = [
    {
      key: 'totalCustomers',
      title: '客户总数',
      formatter: (value: any, data: any) => {
        return data.summary?.totalCustomers || 0
      },
      suffix: '个',
      color: '#722ed1',
    },
    {
      key: 'totalRevenue',
      title: '总收入',
      formatter: (value: any, data: any) => {
        return data.summary?.totalRevenue || 0
      },
      prefix: '¥',
      color: '#52c41a',
    },
  ]

  // 筛选器配置
  const filters: FilterConfig[] = [
    {
      key: 'year',
      type: 'year',
      label: '年份',
      defaultValue: new Date().getFullYear(),
      allowClear: false,
    },
    {
      key: 'month',
      type: 'select',
      label: '月份',
      placeholder: '全年',
      allowClear: true,
      options: [
        { label: '1月', value: 1 },
        { label: '2月', value: 2 },
        { label: '3月', value: 3 },
        { label: '4月', value: 4 },
        { label: '5月', value: 5 },
        { label: '6月', value: 6 },
        { label: '7月', value: 7 },
        { label: '8月', value: 8 },
        { label: '9月', value: 9 },
        { label: '10月', value: 10 },
        { label: '11月', value: 11 },
        { label: '12月', value: 12 },
      ],
    },
    {
      key: 'level',
      type: 'select',
      label: '客户等级',
      placeholder: '全部等级',
      allowClear: true,
      options: levelOptions,
    },
  ]

  return (
    <ReportPageLayout
      title="🎯 客户等级分布详情"
      backgroundColor="linear-gradient(135deg, #722ed1 0%, #531dab 100%)"
      titleColor="#ffffff"
    >
      <AdvancedServerTable<CustomerLevelItem>
        endpoint="/reports/customer-level-distribution"
        columns={columns}
        rowKey="customerId"
        defaultParams={{
          year: new Date().getFullYear(),
        }}
        summaryMetrics={summaryMetrics}
        filters={filters}
        apiFunction={getCustomerLevelDistribution}
        chartComponent={data => (
          <CustomerLevelChart levelStats={data.levelStats || []} title="客户等级分布图" />
        )}
        tableProps={{
          scroll: { x: 1000 },
          size: 'middle' as const,
        }}
      />
    </ReportPageLayout>
  )
}

export default CustomerLevelDetail
