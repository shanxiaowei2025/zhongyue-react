import React from 'react'
import { Table, Card } from 'antd'
import { useServerTable } from '../hooks/useServerTable'
import type { ServerTableProps, ServerTableResponse } from '../types/serverTable'

const ServerTable = <T extends Record<string, any> = any>({
  endpoint,
  columns,
  rowKey,
  defaultParams,
  renderSummary,
  onDataChange,
  tableProps = {},
  apiFunction,
}: ServerTableProps<T> & {
  apiFunction: (params: Record<string, any>) => Promise<{ data: ServerTableResponse<T> }>
}) => {
  const { data, loading, urlParams, handleTableChange } = useServerTable<T>({
    endpoint,
    defaultParams,
    apiFunction,
  })

  // 数据变化时通知父组件
  React.useEffect(() => {
    if (data && onDataChange) {
      onDataChange(data)
    }
  }, [data, onDataChange])

  // 构建表格的分页配置
  const paginationConfig = React.useMemo(() => {
    if (!data) return false

    return {
      current: urlParams.page || 1,
      pageSize: urlParams.pageSize || 10,
      total: data.total || 0,
      showSizeChanger: false,
      showQuickJumper: true,
      showTotal: (total: number) => {
        const startIndex = ((urlParams.page || 1) - 1) * (urlParams.pageSize || 10) + 1
        const endIndex = Math.min((urlParams.page || 1) * (urlParams.pageSize || 10), total)
        return `第 ${startIndex}-${endIndex} 条，共 ${total} 条`
      },

    }
  }, [data, urlParams])

  // 为表格列添加排序状态
  const columnsWithSort = React.useMemo(() => {
    return columns.map(column => {
      if (column.sorter && 'dataIndex' in column) {
        return {
          ...column,
          sortOrder:
            urlParams.sortField === column.dataIndex && urlParams.sortOrder
              ? urlParams.sortOrder === 'DESC'
                ? 'descend'
                : 'ascend'
              : null,
        }
      }
      return column
    })
  }, [columns, urlParams.sortField, urlParams.sortOrder])

  return (
    <div>
      {/* 渲染概览信息 */}
      {renderSummary && data && renderSummary(data)}

      {/* 主表格 */}
      <Card style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
        <Table
          columns={columnsWithSort}
          dataSource={data?.list || []}
          rowKey={rowKey}
          loading={loading}
          pagination={paginationConfig}
          onChange={handleTableChange}
          sortDirections={['descend', 'ascend']}
          scroll={{ x: 1000 }}
          size="middle"
          {...tableProps}
        />
      </Card>
    </div>
  )
}

export default ServerTable
