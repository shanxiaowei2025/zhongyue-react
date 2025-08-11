import React from 'react'
import { Tooltip } from 'antd'
import type { Header } from '@tanstack/react-table'
import type { ResizeHandleProps } from '../types/table'

// 拖拽句柄组件
const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onMouseDown,
  onTouchStart,
  className = '',
}) => {
  return (
    <div
      className={`absolute right-0 top-0 h-full w-2 cursor-col-resize bg-gray-400 hover:bg-blue-500 transition-colors ${className}`}
      style={{
        userSelect: 'none',
        touchAction: 'none',
        opacity: 0.7,
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    />
  )
}

// 可拖拽的表头组件
interface ResizableTableHeaderProps<T> {
  header: Header<T, unknown>
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function ResizableTableHeader<T>({
  header,
  children,
  className = '',
  style = {},
}: ResizableTableHeaderProps<T>) {
  const canResize = header.column.getCanResize()
  const isResizing = header.column.getIsResizing()

  return (
    <th
      key={header.id}
      colSpan={header.colSpan}
      style={{
        width: header.getSize(),
        position: 'relative',
        ...(isResizing ? { backgroundColor: '#e6f7ff' } : {}),
        ...style,
      }}
      className={`ant-table-cell ant-table-cell-ellipsis ${className} ${
        isResizing ? 'ant-table-cell-resizing' : ''
      }`}
    >
      <div className="ant-table-column-title" style={{ position: 'relative' }}>
        {children}

        {canResize && (
          <Tooltip title="拖拽调整列宽" placement="top">
            <ResizeHandle
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={isResizing ? 'bg-blue-500' : ''}
            />
          </Tooltip>
        )}
      </div>
    </th>
  )
}

export default ResizableTableHeader
