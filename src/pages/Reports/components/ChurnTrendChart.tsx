import React, { useMemo } from 'react'
import { Card, Empty, Spin, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { CustomerChurnStatsItem } from '../types/reports'

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ChurnTrendChartProps {
  data: CustomerChurnStatsItem[]
  loading?: boolean
  title?: string
  onViewMore?: () => void
}

const ChurnTrendChart: React.FC<ChurnTrendChartProps> = ({
  data = [],
  loading = false,
  title = '客户流失趋势',
  onViewMore,
}) => {
  // 处理图表数据
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null
    }

    // 按时间排序
    const sortedData = [...data].sort((a, b) => a.period.localeCompare(b.period))

    return {
      labels: sortedData.map(item => item.period),
      datasets: [
        {
          label: '总流失客户',
          data: sortedData.map(item => item.churnCount),
          borderColor: '#ff6b7a',
          backgroundColor: 'rgba(255, 107, 122, 0.15)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: '#ff6b7a',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
        {
          label: '企业注销',
          data: sortedData.map(item => item.cancelledEnterpriseCount),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.15)',
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
        {
          label: '税务流失',
          data: sortedData.map(item => item.lostBusinessCount),
          borderColor: '#ffa726',
          backgroundColor: 'rgba(255, 167, 38, 0.15)',
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#ffa726',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
      ],
    }
  }, [data])

  // 图表配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: { dataset: { label?: string }; parsed: { y: number } }) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${value}个客户`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          // 移除固定stepSize，让Chart.js自动计算合适的刻度间隔
          // stepSize: 1, // 这会在数据量大时生成过多刻度
          maxTicksLimit: 10, // 限制最大刻度数量
          callback: function (value: number | string) {
            // 确保显示整数刻度
            if (Number.isInteger(Number(value))) {
              return value + '个'
            }
            return ''
          },
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
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
              color: '#ffa726',
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
        boxShadow: '0 8px 32px rgba(255, 167, 38, 0.15)',
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
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </Card>
  )
}

export default ChurnTrendChart
