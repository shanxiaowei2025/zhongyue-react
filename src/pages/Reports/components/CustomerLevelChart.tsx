import React, { useMemo } from 'react'
import { Card, Empty, Spin, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import type { CustomerLevelDistributionItem } from '../types/reports'

ChartJS.register(ArcElement, Tooltip, Legend)

interface CustomerLevelChartProps {
  data: CustomerLevelDistributionItem[]
  loading?: boolean
  title?: string
  onViewMore?: () => void
}

const CustomerLevelChart: React.FC<CustomerLevelChartProps> = ({
  data = [],
  loading = false,
  title = '客户等级分布',
  onViewMore,
}) => {
  // 处理图表数据
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null
    }

    // 定义等级颜色
    const levelColors = {
      A级: '#ff4d4f',
      B级: '#fa8c16',
      C级: '#faad14',
      D级: '#52c41a',
      E级: '#1890ff',
      未分级: '#d9d9d9',
    }

    return {
      labels: data.map(item => item.level),
      datasets: [
        {
          data: data.map(item => item.count),
          backgroundColor: data.map(
            item => levelColors[item.level as keyof typeof levelColors] || '#722ed1'
          ),
          borderColor: data.map(
            item => levelColors[item.level as keyof typeof levelColors] || '#722ed1'
          ),
          borderWidth: 2,
          hoverBorderWidth: 3,
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
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value}个客户 (${percentage}%)`
          },
        },
      },
    },
    cutout: '50%', // 环形图的内圆大小
  }

  return (
    <Card
      title={<span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>🎯 {title}</span>}
      extra={
        onViewMore && (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={onViewMore}
            style={{
              color: '#722ed1',
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
        boxShadow: '0 8px 32px rgba(114, 46, 209, 0.15)',
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
          <Doughnut data={chartData} options={chartOptions} />
        </div>
      )}
    </Card>
  )
}

export default CustomerLevelChart
