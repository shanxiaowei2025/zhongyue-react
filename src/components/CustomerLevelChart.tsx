import React, { useMemo } from 'react'
import { Card, Empty, Spin } from 'antd'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'react-chartjs-2'
import type { CustomerLevelStatsItem } from '../pages/Reports/types/reports'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels)

interface CustomerLevelChartProps {
  levelStats: CustomerLevelStatsItem[]
  loading?: boolean
  title?: string
}

const CustomerLevelChart: React.FC<CustomerLevelChartProps> = ({
  levelStats = [],
  loading = false,
  title = '客户等级分布',
}) => {
  // 复用客户等级排序逻辑
  const sortedLevelStats = useMemo(() => {
    return levelStats.sort((a, b) => {
      const levelA = a.level
      const levelB = b.level

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
  }, [levelStats])

  // 图表数据配置
  const chartData = useMemo(() => {
    if (!sortedLevelStats || sortedLevelStats.length === 0) {
      return null
    }

    // 生成统一的颜色系统
    const colors = [
      '#667eea', // 主色调蓝紫色
      '#ff6b7a', // 粉红色
      '#ffa726', // 橙色
      '#4bc0c0', // 青色
      '#9c27b0', // 紫色
      '#f44336', // 红色
      '#ff9800', // 深橙色
      '#8bc34a', // 绿色
      '#607d8b', // 蓝灰色
      '#795548', // 棕色
      '#e91e63', // 深粉色
      '#00bcd4', // 青蓝色
      '#ffeb3b', // 黄色
      '#3f51b5', // 深蓝色
      '#009688', // 蒂尔色
      '#ff5722', // 深橙红色
    ]

    const labels = sortedLevelStats.map(item => item.level)
    const counts = sortedLevelStats.map(item => item.count)

    return {
      labels,
      datasets: [
        {
          label: '客户数量',
          data: counts,
          backgroundColor: sortedLevelStats.map((_, index) => colors[index % colors.length] + '80'), // 添加透明度
          borderColor: sortedLevelStats.map((_, index) => colors[index % colors.length]),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    }
  }, [sortedLevelStats])

  // 图表配置选项
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // 柱状图不需要图例
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function (context: any) {
            const index = context[0].dataIndex
            return `${sortedLevelStats[index].level}级客户`
          },
          label: function (context: any) {
            const index = context.dataIndex
            const stats = sortedLevelStats[index]
            return [
              `客户数量: ${stats.count}个`,
              `占比: ${stats.percentage.toFixed(1)}%`,
              `总收入: ¥${stats.totalRevenue.toLocaleString()}`,
              `平均收入: ¥${stats.averageRevenue.toLocaleString()}`,
            ]
          },
        },
      },
      datalabels: {
        display: true,
        anchor: 'end' as const,
        align: 'top' as const,
        formatter: (value: number) => {
          return `${value}个`
        },
        color: '#666',
        font: {
          weight: 'bold' as const,
          size: 11,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
        },
        title: {
          display: true,
          text: '客户等级',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
        },
        ticks: {
          callback: function (value: any) {
            return value + '个'
          },
          font: {
            size: 12,
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
    },
  }

  return (
    <Card
      title={<span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>📊 {title}</span>}
      style={{
        height: 400,
        marginBottom: 24,
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)',
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

export default CustomerLevelChart
