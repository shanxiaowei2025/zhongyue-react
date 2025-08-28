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
import type { EmployeePerformanceItem } from '../types/reports'

// 注册Chart.js组件
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface EmployeePerformanceChartProps {
  data: EmployeePerformanceItem[]
  loading?: boolean
  title?: string
  onViewMore?: () => void
}

const EmployeePerformanceChart: React.FC<EmployeePerformanceChartProps> = ({
  data = [],
  loading = false,
  title = '员工业绩对比',
  onViewMore,
}) => {
  // 处理图表数据
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null
    }

    // 按总业绩排序，取前10名员工数据
    const sortedEmployees = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue)
    const topEmployees = sortedEmployees.slice(0, 10)

    return {
      labels: topEmployees.map(item => item.employeeName),
      datasets: [
        {
          label: '新增业务',
          data: topEmployees.map(item => item.newCustomerRevenue),
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: '#667eea',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: '续费业务',
          data: topEmployees.map(item => item.renewalRevenue),
          backgroundColor: 'rgba(255, 107, 122, 0.8)',
          borderColor: '#ff6b7a',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: '其他业务',
          data: topEmployees.map(item => item.otherRevenue),
          backgroundColor: 'rgba(255, 167, 38, 0.8)',
          borderColor: '#ffa726',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
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
          label: function (context: any) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ¥${value.toLocaleString()}`
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return '¥' + value.toLocaleString()
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
      title={<span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>📊 {title}</span>}
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
        height: 400,
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

export default EmployeePerformanceChart
