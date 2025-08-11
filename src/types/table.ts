import type { ColumnSizingState } from '@tanstack/react-table'

// TanStack Table 相关类型定义
export interface ResizableTableColumn<T = any> {
  id: string
  accessorKey?: keyof T
  accessorFn?: (row: T) => any
  header: string | ((props: any) => React.ReactNode)
  cell?: (props: any) => React.ReactNode
  enableResizing?: boolean
  size?: number
  minSize?: number
  maxSize?: number
  width?: number | string
  fixed?: 'left' | 'right'
  responsive?: string[]
  render?: (text: any, record: T, index: number) => React.ReactNode
}

// 列宽状态类型
export interface TableColumnSizing {
  [key: string]: ColumnSizingState
}

// 可拖拽表格配置
export interface ResizableTableProps<T = any> {
  columns: ResizableTableColumn<T>[]
  dataSource: T[]
  rowKey: string | ((record: T) => string)
  pagination?: any
  loading?: boolean
  scroll?: { x?: number | string; y?: number | string }
  size?: 'small' | 'middle' | 'large'
  sticky?: boolean | { offsetHeader?: number }
  className?: string
  tableKey?: string // 用于存储列宽状态的唯一标识
}

// 拖拽句柄属性
export interface ResizeHandleProps {
  onMouseDown: (event: React.MouseEvent) => void
  onTouchStart?: (event: React.TouchEvent) => void
  className?: string
}
