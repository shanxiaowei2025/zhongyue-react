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
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'react-chartjs-2'
import type { AccountantClientStatsItem } from '../types/reports'

// 注册Chart.js组件
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels)

interface AccountantDistributionChartProps {
  data: AccountantClientStatsItem[]
  loading?: boolean
  title?: string
  onViewMore?: () => void
}

const AccountantDistributionChart: React.FC<AccountantDistributionChartProps> = ({
  data = [],
  loading = false,
  title = '记账会计负责客户分布',
  onViewMore,
}) => {
  // 处理图表数据
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null
    }

    // API已经只返回记账会计数据，按客户数量排序，取前8名，其余归为"其他"
    const sortedData = [...data].sort((a, b) => b.clientCount - a.clientCount)
    const topAccountants = sortedData.slice(0, 8)
    const otherAccountants = sortedData.slice(8)

    // 调试信息
    console.log('记账会计总数:', data.length)
    console.log(
      '前8名:',
      topAccountants.map(item => `${item.accountantName}(${item.clientCount})`)
    )
    console.log('其他会计数量:', otherAccountants.length)
    console.log(
      '其他会计:',
      otherAccountants.map(item => `${item.accountantName}(${item.clientCount})`)
    )

    // 生成颜色数组
    const colors = [
      '#667eea',
      '#ff6b7a',
      '#ffa726',
      '#4bc0c0',
      '#9c27b0',
      '#f44336',
      '#ff9800',
      '#8bc34a',
      '#607d8b', // 其他的颜色
    ]

    const chartItems = topAccountants.map((item, index) => ({
      name: item.accountantName,
      count: item.clientCount,
      color: colors[index] || '#607d8b',
    }))

    // 如果有其他会计师，添加到图表中
    if (otherAccountants.length > 0) {
      const otherCount = otherAccountants.reduce((sum, item) => sum + item.clientCount, 0)
      chartItems.push({
        name: `其他(${otherAccountants.length}人)`,
        count: otherCount,
        color: colors[8] || '#607d8b',
      })
    }

    return {
      labels: chartItems.map(item => item.name),
      datasets: [
        {
          label: '客户数量',
          data: chartItems.map(item => item.count),
          backgroundColor: chartItems.map(item => item.color + '80'), // 添加透明度
          borderColor: chartItems.map(item => item.color),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    }
  }, [data])

  // 图表配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const, // 关键：设置为水平条形图
    plugins: {
      legend: {
        display: false, // 条形图不需要图例
      },
      tooltip: {
        callbacks: {
          label: function (context: { parsed: { x?: number } }) {
            const value = context.parsed.x || 0
            return `客户数量: ${value}个`
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
          size: 12,
        },
        padding: {
          right: 8,
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
          callback: function (value: number | string) {
            // 确保显示整数刻度
            if (Number.isInteger(Number(value))) {
              return value + '个'
            }
            return ''
          },
        },
        title: {
          display: true,
          text: '客户数量',
          font: {
            size: 12,
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
            size: 12,
          },
          maxRotation: 0,
          minRotation: 0,
        },
        title: {
          display: true,
          text: '会计姓名',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
    },
  }

  return (
    <Card
      title={<span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>🥧 {title}</span>}
      extra={
        onViewMore && (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={onViewMore}
            style={{
              color: '#667eea',
              fontWeight: 500,
              padding: 0,
            }}
          >
            查看更多
          </Button>
        )
      }
      style={{
        height: 400, // 固定高度，与其他图表组件保持一致
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(255, 107, 122, 0.15)',
        border: 'none',
        background: '#ffffff',
      }}
      styles={{
        body: {
          padding: '24px',
          height: 'calc(100% - 57px)', // 减去标题高度，与其他图表组件保持一致
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

export default AccountantDistributionChart
