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

    // 显示所有会计（不合并为“其他”），按客户数量降序排列
    const sortedData = [...data].sort((a, b) => b.clientCount - a.clientCount)

    // 生成颜色数组并循环使用以覆盖任意数量的会计
    const baseColors = [
      '#667eea',
      '#ff6b7a',
      '#ffa726',
      '#4bc0c0',
      '#9c27b0',
      '#f44336',
      '#ff9800',
      '#8bc34a',
      '#607d8b',
    ]

    const chartItems = sortedData.map((item, index) => ({
      name: item.accountantName,
      count: item.clientCount,
      color: baseColors[index % baseColors.length] || '#607d8b',
      type: item.accountantType,
    }))

    return {
      labels: chartItems.map(item => item.name),
      datasets: [
        {
          label: '客户数量',
          data: chartItems.map(item => item.count),
          // If all items share the same accountant type, use a uniform chart color per type so charts across pages look consistent.
          // Otherwise fall back to per-bar palette.
          backgroundColor: (() => {
            const firstType = chartItems[0]?.type
            const allSameType = chartItems.every(ci => ci.type === firstType)
            const typeColorMap: Record<string, string> = {
              consultantAccountant: '#667eea',
              bookkeepingAccountant: '#ff6b7a',
              invoiceOfficer: '#ffa726',
            }
            if (allSameType && firstType && typeColorMap[firstType]) {
              return chartItems.map(() => typeColorMap[firstType] + '80')
            }
            return chartItems.map(item => item.color + '80')
          })(),
          borderColor: (() => {
            const firstType = chartItems[0]?.type
            const allSameType = chartItems.every(ci => ci.type === firstType)
            const typeColorMap: Record<string, string> = {
              consultantAccountant: '#667eea',
              bookkeepingAccountant: '#ff6b7a',
              invoiceOfficer: '#ffa726',
            }
            if (allSameType && firstType && typeColorMap[firstType]) {
              return chartItems.map(() => typeColorMap[firstType])
            }
            return chartItems.map(item => item.color)
          })(),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
          // barThickness 将在组件中动态计算以适配大量条目
          // 这里仍然保留属性占位，实际值由外部变量传入（chartOptions 中会应用）
          categoryPercentage: 0.9,
          barPercentage: 0.85,
        },
      ],
    }
  }, [data])

  // 根据数据量和窗口高度计算动态尺寸，使图表在人数多时等比缩小以全部显示
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800
  // 最大容器高度：不超过窗口高度的 70%，也保持合理上限 1000
  const maxContainerHeight = Math.min(Math.max(data.length * 35 + 80, 200), Math.floor(windowHeight * 0.7))
  // 计算每一行（category）可用高度（去掉一些内边距）
  const perCategoryAvailableHeight = Math.floor((Math.max(120, maxContainerHeight) - 80) / Math.max(1, data.length))
  // 初始建议的 bar 粗细（保守计算），并限制最小值
  const suggestedBarThickness = Math.max(6, Math.floor((maxContainerHeight - 80) / Math.max(1, data.length)))
  // 确保 barThickness 不会超过每行高度的一部分（避免覆盖相邻条）
  const computedBarThickness = Math.max(
    6,
    Math.min(suggestedBarThickness, Math.max(6, Math.floor(perCategoryAvailableHeight * 0.85)))
  )
  // 进一步计算最终厚度，优先使用每行高度的 60%（留出空隙）
  const finalBarThickness = Math.max(4, Math.floor(perCategoryAvailableHeight * 0.6))
  // datalabel 与刻度字体随条高缩放，保持可读性
  const computedDatalabelFontSize = Math.max(8, Math.min(14, Math.floor(computedBarThickness * 0.6)))
  const computedYTickFontSize = Math.max(8, Math.min(14, Math.floor(computedBarThickness * 0.55)))

  // 图表配置（使用动态计算值），memoize 避免每次渲染产生新的对象引用导致不必要重绘
  const chartOptions = useMemo(() => {
    return {
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
          // 当条体过细时隐藏 data label，避免重叠和裁切
          display: computedBarThickness >= 10,
          anchor: computedBarThickness >= 12 ? ('end' as const) : ('center' as const),
          align: computedBarThickness >= 12 ? ('right' as const) : ('center' as const),
          formatter: (value: number) => {
            // 在条形内部显示客户数量
            return `${value}个`
          },
          color: '#ffffff',
          font: {
            weight: 'bold' as const,
            size: computedDatalabelFontSize,
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
              size: computedYTickFontSize,
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
  // 这些依赖会在相关尺寸或数据变化时更新 options
  }, [computedBarThickness, computedDatalabelFontSize, computedYTickFontSize])

  const renderedChartData = useMemo(() => {
    if (!chartData) return chartData
    // 注入动态计算的 barThickness 到 dataset 中，保证渲染时使用正确值
    const cloned = {
      ...chartData,
      datasets: chartData.datasets.map(ds => {
        // 计算最终的 maxBarThickness，确保在极端情况下仍然可见
        const finalMax = Math.max(12, Math.floor(perCategoryAvailableHeight * 0.9))
        // 当可用高度很小时，采用更大的间隔：categoryPercentage 低，barPercentage 低
        const smallStyle = perCategoryAvailableHeight < 20
        const categoryPercent = smallStyle ? 0.5 : 0.95
        const barPercent = smallStyle ? 0.6 : 0.9
        const borderOff = smallStyle
        // 最终厚度以 perCategoryAvailableHeight 的 60% 为主，且不超过 finalMax
        const thickness = Math.min(finalBarThickness, finalMax)
        return {
          ...ds,
          barThickness: thickness,
          maxBarThickness: finalMax,
          // 为避免几何重叠，调整占比以留出空隙
          categoryPercentage: categoryPercent,
          barPercentage: barPercent,
          borderWidth: borderOff ? 0 : (ds.borderWidth ?? 1),
          borderRadius: borderOff ? 0 : (ds.borderRadius ?? 4),
        }
      }),
    }
    return cloned
  }, [chartData, computedBarThickness])

  const getChartHeight = (dataLength: number) => {
    if (!dataLength || dataLength <= 0) return 200
    // 使用上面计算的 maxContainerHeight，确保在会计人数多时整体缩小以全部显示
    return Math.min(Math.max(dataLength * 35 + 80, 200), Math.min(1000, Math.floor(window.innerHeight * 0.7)))
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
        // 高度根据会计人数自适应，但限制在窗口高度的比例内
        height: getChartHeight(data.length),
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(255, 107, 122, 0.15)',
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
        <div style={{ height: '100%', overflow: 'hidden' }}>
          {/* 将动态计算的 barThickness 通过 options 传入 dataset 位置 */}
          <Bar
            data={(renderedChartData ?? (chartData ?? { labels: [], datasets: [] })) as any}
            options={chartOptions}
            // 移除 redraw:true，避免 Chart 每次鼠标 hover/移动时被强制重绘
            datasetIdKey="label"
          />
          <style>{`
            /* no-op style placeholder to keep edits focused; actual sizing handled in chartOptions/dataset */
          `}</style>
        </div>
      )}
    </Card>
  )
}

export default AccountantDistributionChart
