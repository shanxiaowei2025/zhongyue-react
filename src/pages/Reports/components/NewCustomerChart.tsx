import React, { useMemo } from 'react'
import { Card, Empty, Spin, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { MonthlyNewCustomerStats } from '../types/reports'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface NewCustomerChartProps {
  data: MonthlyNewCustomerStats[]
  loading?: boolean
  title?: string
  onViewMore?: () => void
  selectedMonth?: string // 用户选择的月份，格式：YYYY-MM
}

const NewCustomerChart: React.FC<NewCustomerChartProps> = ({
  data = [],
  loading = false,
  title = '新增客户统计',
  onViewMore,
  selectedMonth,
}) => {
  // 处理图表数据
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null
    }

    // 确定6个月范围的结束月份
    let endMonth: string

    if (selectedMonth) {
      // 如果传入了选择的月份，使用选择的月份作为结束月份
      endMonth = selectedMonth
    } else {
      // 否则从数据中找到最晚的月份，或使用当前月份
      const dataMonths = data.map(item => item.month).sort()
      if (dataMonths.length > 0) {
        endMonth = dataMonths[dataMonths.length - 1]
      } else {
        const now = new Date()
        endMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      }
    }

    // 基于结束月份生成固定的6个月列表
    const months = []
    const end = new Date(`${endMonth}-01`)

    // 从结束月份向前推5个月，生成6个月的列表
    for (let i = 5; i >= 0; i--) {
      const current = new Date(end)
      current.setMonth(current.getMonth() - i)
      const year = current.getFullYear()
      const month = String(current.getMonth() + 1).padStart(2, '0')
      const monthStr = `${year}-${month}`
      months.push(monthStr)
    }

    console.log('生成的固定6个月列表:', months)
    console.log('结束月份:', endMonth)
    console.log(
      'API返回的数据月份:',
      data.map(item => item.month)
    )

    // 创建月份数据映射
    const monthDataMap = data.reduce(
      (acc, item) => {
        acc[item.month] = item
        return acc
      },
      {} as Record<string, (typeof data)[0]>
    )

    // 为每个月份填充数据，没有数据的月份设为0
    const monthlyData = months.map(month => ({
      month,
      totalCount: monthDataMap[month]?.totalCount || 0,
    }))

    // 反转数据，让最新月份在上方
    const reversedData = [...monthlyData].reverse()

    return {
      labels: reversedData.map(item => {
        // 将YYYY-MM格式转换为更友好的显示格式
        const [year, month] = item.month.split('-')
        return `${year}年${parseInt(month)}月`
      }),
      datasets: [
        {
          label: '新增客户数量',
          data: reversedData.map(item => item.totalCount),
          backgroundColor: '#52c41a80',
          borderColor: '#52c41a',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    }
  }, [data, selectedMonth])

  // 图表配置 - 横向柱状图
  const chartOptions = {
    indexAxis: 'y' as const, // 设置为横向
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: unknown) {
            const ctx = context as { dataset: { label: string }; parsed: { x: number } }
            return `${ctx.dataset.label}: ${ctx.parsed.x}个`
          },
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
          // 移除固定stepSize，让Chart.js自动计算合适的刻度间隔
          // stepSize: 1, // 这会在数据量大时生成过多刻度
          maxTicksLimit: 10, // 限制最大刻度数量
          callback: function (value: string | number): string {
            // 确保显示整数刻度
            const numValue = Number(value)
            if (Number.isInteger(numValue)) {
              return numValue.toString()
            }
            return ''
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <Card
      title={<span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>📈 {title}</span>}
      extra={
        onViewMore && (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={onViewMore}
            style={{
              color: '#52c41a',
              fontWeight: 500,
              padding: 0,
            }}
          >
            查看更多
          </Button>
        )
      }
      style={{
        height: 400,
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(82, 196, 26, 0.15)',
        border: 'none',
        background: '#ffffff',
      }}
      styles={{
        body: {
          padding: '24px',
          height: 'calc(100% - 57px)', // 减去标题高度
        },
      }}
    >
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Spin size="large" />
        </div>
      ) : !chartData ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Empty description="暂无数据" />
        </div>
      ) : (
        <div style={{ height: '100%' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </Card>
  )
}

export default NewCustomerChart
