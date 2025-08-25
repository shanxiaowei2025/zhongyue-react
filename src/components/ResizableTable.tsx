import React, { useMemo } from 'react'
import { Spin } from 'antd'
import { flexRender } from '@tanstack/react-table'
import { useResizableTable } from '../hooks/useResizableTable'
import ResizableTableHeader from './ResizableTableHeader'
import type { ResizableTableProps } from '../types/table'

export function ResizableTable<T extends Record<string, any>>({
  columns,
  dataSource,
  pagination,
  loading = false,
  className = '',
  tableKey = 'resizable-table',
}: ResizableTableProps<T>) {
  // 创建默认列宽配置
  const defaultColumnSizing = useMemo(() => {
    const sizing: Record<string, number> = {}
    columns.forEach(col => {
      if (col.size) {
        sizing[col.id] = col.size
      }
    })
    return sizing
  }, [columns])

  const { table } = useResizableTable({
    columns,
    data: dataSource,
    tableKey,
    defaultColumnSizing,
  })

  // 获取列的固定位置样式
  const getColumnStyle = (header: any) => {
    const column = header.column
    const isPinned = column.getIsPinned()

    if (isPinned === 'left') {
      return {
        position: 'sticky' as const,
        left: column.getStart(),
        zIndex: 10,
        backgroundColor: 'white',
        boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
      }
    }

    if (isPinned === 'right') {
      return {
        position: 'sticky' as const,
        right: column.getAfter(),
        zIndex: 10,
        backgroundColor: 'white',
        boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.1)',
      }
    }

    return {}
  }

  // 渲染表格
  const renderTable = () => {
    const headerGroups = table.getHeaderGroups()
    const rowModel = table.getRowModel()

    return (
      <div className={`ant-table-wrapper ${className}`}>
        <div className="table-container">
          <div className="ant-table ant-table-default">
            <div className="ant-table-container">
              <div className="ant-table-content">
                <table
                  style={{
                    width: table.getTotalSize(),
                    tableLayout: 'fixed',
                  }}
                >
                  <thead className="ant-table-thead">
                    {headerGroups.map(headerGroup => (
                      <tr key={headerGroup.id} className="ant-table-row">
                        {headerGroup.headers.map(header => {
                          const column = header.column
                          const isPinned = column.getIsPinned()
                          const columnStyle = getColumnStyle(header)

                          return (
                            <ResizableTableHeader
                              key={header.id}
                              header={header}
                              style={columnStyle}
                              className={`${column.getCanResize() ? 'resizable-header' : ''} ${
                                isPinned === 'left'
                                  ? 'fixed-left'
                                  : isPinned === 'right'
                                    ? 'fixed-right'
                                    : ''
                              }`}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(column.columnDef.header, header.getContext())}
                            </ResizableTableHeader>
                          )
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="ant-table-tbody">
                    {rowModel.rows.map(row => (
                      <tr key={row.id} className="ant-table-row ant-table-row-level-0">
                        {row.getVisibleCells().map(cell => {
                          const column = cell.column
                          const isPinned = column.getIsPinned()
                          const header = table
                            .getHeaderGroups()[0]
                            ?.headers.find(h => h.id === column.id)
                          const columnStyle = header ? getColumnStyle(header) : {}

                          return (
                            <td
                              key={cell.id}
                              style={{
                                width: column.getSize(),
                                maxWidth: column.getSize(),
                                ...columnStyle,
                              }}
                              className={`ant-table-cell ${
                                isPinned === 'left'
                                  ? 'fixed-left'
                                  : isPinned === 'right'
                                    ? 'fixed-right'
                                    : ''
                              }`}
                            >
                              <div
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {flexRender(column.columnDef.cell, cell.getContext())}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧独立分页 */}
        {pagination && <div className="pagination-container">{pagination}</div>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="resizable-table-container">
      <style>
        {`
          .resizable-table-container {
            position: relative;
          }
          
          .resizable-header {
            position: relative;
            user-select: none;
          }
          
          .ant-table-cell-resizing {
            background-color: #f0f0f0 !important;
            border-right: 2px solid #1890ff !important;
          }
          
          /* 表格容器 */
          .table-container {
            position: relative;
            overflow-x: auto;
            max-width: 100%;
            width: 100%;
          }
          
          /* 确保表格有足够宽度触发滚动 */
          .resizable-table-container .ant-table {
            min-width: 1200px;
          }
          
          /* 分页容器 - 独立显示在右侧 */
          .pagination-container {
            position: absolute;
            top: 100%;
            right: 0;
            z-index: 15;
            background: white;
            padding: 16px 0;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            width: 100%;
          }
          
          /* 固定列样式 */
          .fixed-left,
          .fixed-right {
            position: sticky !important;
            z-index: 10;
            background: white !important;
          }
          
          .fixed-left {
            box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
          }
          
          .fixed-right {
            box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
          }
          
          /* 固定列中的拖拽句柄需要更高的z-index */
          .fixed-left .resizable-header,
          .fixed-right .resizable-header {
            position: relative;
            z-index: 11;
          }
          
          /* 确保固定列在悬停时保持正确的背景色 */
          .resizable-table-container .ant-table-tbody > tr:hover > td.fixed-left,
          .resizable-table-container .ant-table-tbody > tr:hover > td.fixed-right {
            background: #fafafa !important;
          }
          
          /* 确保固定列表头背景 */
          .resizable-table-container .ant-table-thead > tr > th.fixed-left,
          .resizable-table-container .ant-table-thead > tr > th.fixed-right {
            background: #fafafa !important;
          }
          
          /* 表格样式 - 去掉纵向边框 */
          .resizable-table-container .ant-table-container > .ant-table-content > table > thead > tr > th {
            border-bottom: 1px solid #f0f0f0;
            background: #fafafa;
            font-weight: 500;
            padding: 14px 16px;
            text-align: left;
          }
          
          .resizable-table-container .ant-table-container > .ant-table-content > table > tbody > tr > td {
            border-bottom: 1px solid #f0f0f0;
            padding: 14px 16px;
          }
          
          /* 悬停效果 */
          .resizable-table-container .ant-table-tbody > tr:hover > td {
            background: #fafafa;
          }
          
          /* 确保内容不会溢出 */
          .resizable-table-container .ant-table-tbody > tr > td {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          /* 表格容器样式 */
          .resizable-table-container table {
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
          }
          
          /* 修复边框问题 - 去掉外边框 */
          .resizable-table-container .ant-table-container {
            border: none;
            border-radius: 0;
          }
          
          .resizable-table-container .ant-table-thead > tr:first-child > th:first-child {
            border-top-left-radius: 0;
          }
          
          .resizable-table-container .ant-table-thead > tr:first-child > th:last-child {
            border-top-right-radius: 0;
          }
          
        `}
      </style>
      {renderTable()}
    </div>
  )
}

export default ResizableTable
