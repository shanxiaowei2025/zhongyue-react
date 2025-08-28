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
}

const NewCustomerChart: React.FC<NewCustomerChartProps> = ({
  data = [],
  loading = false,
  title = '新增客户统计',
  onViewMore,
}) => {
  // 处理图表数据
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null
    }

    // 生成最近6个月的月份列表（包含当前月份）
    const months = []
    const now = new Date()

    console.log('当前时间:', now.toISOString())
    console.log('当前年月:', now.getFullYear(), now.getMonth() + 1) // getMonth()返回0-11，所以+1

    // 从5个月前开始，到当前月份结束，共6个月
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      // 使用本地时间格式化，避免时区问题
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const monthStr = `${year}-${month}`
      months.push(monthStr) // 按时间顺序添加
      console.log(`i=${i}, date=${date.toISOString()}, monthStr=${monthStr}`)
    }

    console.log('生成的月份列表:', months)
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
  }, [data])

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
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.x}个`
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
          stepSize: 1,
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
      bodyStyle={{
        padding: '24px',
        height: 'calc(100% - 57px)', // 减去标题高度
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
