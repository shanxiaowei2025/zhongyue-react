import React from 'react'
import { Table, Card } from 'antd'
import { useServerTable } from '../hooks/useServerTable'
import AutoSummary from './AutoSummary'
import FilterBar from './FilterBar'
import type { AdvancedServerTableConfig } from '../types/advancedServerTable'

const AdvancedServerTable = <T extends Record<string, any> = any>({
  endpoint,
  columns,
  rowKey,
  defaultParams = {},
  filters = [],
  summaryMetrics = [],
  chartComponent,
  renderHeader,
  renderFooter,
  apiFunction,
  tableProps = {},
}: AdvancedServerTableConfig<T>) => {
  const { data, loading, urlParams, handleTableChange, handleFilter } = useServerTable<T>({
    endpoint,
    defaultParams,
    apiFunction,
  })

  // 构建表格的分页配置
  const paginationConfig = React.useMemo(() => {
    if (!data) return false

    return {
      current: urlParams.page || 1,
      pageSize: urlParams.pageSize || 10,
      total: data.total || 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number) => {
        const startIndex = ((urlParams.page || 1) - 1) * (urlParams.pageSize || 10) + 1
        const endIndex = Math.min((urlParams.page || 1) * (urlParams.pageSize || 10), total)
        return `第 ${startIndex}-${endIndex} 条，共 ${total} 条`
      },
      pageSizeOptions: ['10', '20', '50', '100'],
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
      {/* 自定义头部 */}
      {renderHeader && renderHeader()}

      {/* 自动统计概览 */}
      {data && summaryMetrics.length > 0 && <AutoSummary data={data} metrics={summaryMetrics} />}

      {/* 图表渲染区域 */}
      {data && chartComponent && chartComponent(data)}

      {/* 智能筛选条 */}
      {filters.length > 0 && (
        <FilterBar filters={filters} values={urlParams} onChange={handleFilter} />
      )}

      {/* 数据表格 */}
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

      {/* 自定义底部 */}
      {renderFooter && renderFooter()}
    </div>
  )
}

export default AdvancedServerTable
