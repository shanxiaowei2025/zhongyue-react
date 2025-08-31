// 服务端驱动表格的核心类型定义

import type { ColumnsType } from 'antd/es/table'

// 表格元数据配置
export interface TableMetadata {
  // 支持排序的字段列表
  sortableFields: string[]
  // 默认排序配置
  defaultSort: {
    field: string
    order: 'ASC' | 'DESC'
  }
  // 支持的筛选字段配置
  filterableFields: Array<{
    field: string
    type: 'text' | 'select' | 'date' | 'dateRange' | 'month'
    options?: Array<{ label: string; value: string }>
  }>
  // 分页配置
  pagination: {
    defaultPageSize: number
    pageSizeOptions: number[]
    showSizeChanger: boolean
    showQuickJumper: boolean
  }
}

// URL参数接口
export interface TableURLParams {
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
  [key: string]: any // 其他筛选参数
}

// API响应数据结构
export interface ServerTableResponse<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary?: Record<string, any>
}

// Hook返回值接口
export interface UseServerTableReturn<T = any> {
  data: ServerTableResponse<T> | undefined
  loading: boolean
  error: any
  // URL参数操作
  urlParams: TableURLParams
  updateParams: (updates: Partial<TableURLParams>) => void
  resetParams: () => void
  // 表格事件处理器
  handleTableChange: (pagination: any, filters: any, sorter: any) => void
  // 筛选器处理器
  handleFilter: (field: string, value: any) => void
  // 刷新数据
  refresh: () => void
}

// 服务端表格组件Props
export interface ServerTableProps<T = any> {
  // API相关
  endpoint: string
  metadataEndpoint?: string
  // 表格配置
  columns: ColumnsType<T>
  rowKey: string | ((record: T) => string)
  // 默认参数
  defaultParams?: Partial<TableURLParams>
  // 自定义渲染
  renderFilters?: (
    metadata: TableMetadata,
    onFilter: (field: string, value: any) => void
  ) => React.ReactNode
  renderSummary?: (data: ServerTableResponse<T>) => React.ReactNode
  // 事件回调
  onDataChange?: (data: ServerTableResponse<T>) => void
  // 表格属性透传
  tableProps?: any
}

// 筛选器组件Props
export interface FilterComponentProps {
  metadata: TableMetadata
  urlParams: TableURLParams
  onFilter: (field: string, value: any) => void
}
