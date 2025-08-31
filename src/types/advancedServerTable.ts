// 增强版服务端表格的类型系统
import type { ReactNode } from 'react'
import type { ColumnsType } from 'antd/es/table'
import type { ServerTableResponse } from './serverTable'

// 筛选器类型
export type FilterType = 'select' | 'search' | 'dateRange' | 'month' | 'year' | 'number'

// 筛选器配置
export interface FilterConfig {
  key: string
  type: FilterType
  label: string
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  defaultValue?: any
  width?: number
  allowClear?: boolean
}

// 统计指标类型
export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max'

// 统计指标配置
export interface SummaryMetric {
  key: string
  title: string
  field?: string // 数据字段名，如果不提供则使用key
  aggregation?: AggregationType // 聚合类型，默认count
  formatter?: 'currency' | 'percentage' | 'number' | ((value: any, data?: any) => string)
  color?: string
  prefix?: string
  suffix?: string
  precision?: number
}

// 增强版服务端表格配置
export interface AdvancedServerTableConfig<T = any> {
  // 基础配置
  endpoint: string
  columns: ColumnsType<T>
  rowKey: string | ((record: T) => string)

  // 默认参数
  defaultParams?: Record<string, any>

  // 筛选配置
  filters?: FilterConfig[]

  // 统计配置
  summaryMetrics?: SummaryMetric[]

  // 图表配置
  chartComponent?: (data: ServerTableResponse<T>) => ReactNode

  // 自定义渲染
  renderHeader?: () => ReactNode
  renderFooter?: () => ReactNode

  // API函数
  apiFunction: (params: Record<string, any>) => Promise<{ data: ServerTableResponse<T> }>

  // 表格属性
  tableProps?: any
}

// 筛选器组件Props
export interface FilterBarProps {
  filters: FilterConfig[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
}

// 自动统计组件Props
export interface AutoSummaryProps<T = any> {
  data: ServerTableResponse<T>
  metrics: SummaryMetric[]
}

// 报表页面布局Props
export interface ReportPageLayoutProps {
  title: string
  subtitle?: string
  backgroundColor?: string
  titleColor?: string
  onBack?: () => void
  children: ReactNode
}

// 增强版Hook返回值
export interface UseAdvancedServerTableReturn<T = any> {
  // 数据
  data: ServerTableResponse<T> | undefined
  loading: boolean
  error: any

  // URL参数
  urlParams: Record<string, any>

  // 操作函数
  updateParams: (updates: Record<string, any>) => void
  resetParams: () => void
  refresh: () => void

  // 表格事件处理器
  handleTableChange: (pagination: any, filters: any, sorter: any) => void

  // 筛选器处理器
  handleFilterChange: (key: string, value: any) => void
}
