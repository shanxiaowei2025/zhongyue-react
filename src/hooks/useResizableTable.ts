import { useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type ColumnDef,
  type ColumnSizingState,
  type ColumnPinningState,
} from '@tanstack/react-table'
import { usePageStates } from '../store/pageStates'
import type { ResizableTableColumn } from '../types/table'

interface UseResizableTableOptions<T> {
  columns: ResizableTableColumn<T>[]
  data: T[]
  tableKey?: string
  defaultColumnSizing?: ColumnSizingState
}

export function useResizableTable<T extends Record<string, any>>({
  columns,
  data,
  tableKey = 'default',
  defaultColumnSizing = {},
}: UseResizableTableOptions<T>) {
  const { getState, setState } = usePageStates()

  // 从 pageStates 恢复列宽状态
  const savedColumnSizing = getState(`${tableKey}_columnSizing`) || defaultColumnSizing

  // 从 pageStates 恢复固定列状态，或根据列定义创建初始状态
  const getInitialColumnPinning = useCallback((): ColumnPinningState => {
    const saved = getState(`${tableKey}_columnPinning`)
    if (saved) return saved

    // 根据列定义创建初始固定状态
    const leftPinned: string[] = []
    const rightPinned: string[] = []

    columns.forEach(col => {
      if (col.fixed === 'left') {
        leftPinned.push(col.id)
      } else if (col.fixed === 'right') {
        rightPinned.push(col.id)
      }
    })

    return {
      left: leftPinned.length > 0 ? leftPinned : undefined,
      right: rightPinned.length > 0 ? rightPinned : undefined,
    }
  }, [columns, getState, tableKey])

  const savedColumnPinning = getInitialColumnPinning()

  // 创建 TanStack Table 列定义
  const columnHelper = createColumnHelper<T>()

  const tanstackColumns = useMemo(() => {
    return columns.map(col => {
      const baseColumn: ColumnDef<T> = {
        id: col.id,
        header: typeof col.header === 'string' ? col.header : col.header,
        enableResizing: col.enableResizing ?? false,
        enablePinning: col.fixed ? true : false,
        size: col.size ?? 150,
        minSize: col.minSize ?? 50,
        maxSize: col.maxSize ?? Number.MAX_SAFE_INTEGER,
      }

      // 处理访问器
      if (col.accessorKey) {
        return columnHelper.accessor(col.accessorKey as any, {
          ...baseColumn,
          cell: col.cell || (({ getValue }) => getValue()),
        })
      } else if (col.accessorFn) {
        return columnHelper.accessor(col.accessorFn, {
          ...baseColumn,
          cell: col.cell || (({ getValue }) => getValue()),
        })
      } else {
        return columnHelper.display({
          ...baseColumn,
          cell: col.cell || (() => null),
        })
      }
    })
  }, [columns, columnHelper])

  // 列宽变化回调
  const handleColumnSizingChange = useCallback(
    (updaterOrValue: any) => {
      const newColumnSizing =
        typeof updaterOrValue === 'function' ? updaterOrValue(savedColumnSizing) : updaterOrValue

      // 保存到 pageStates
      setState(`${tableKey}_columnSizing`, newColumnSizing)
    },
    [savedColumnSizing, setState, tableKey]
  )

  // 固定列变化回调
  const handleColumnPinningChange = useCallback(
    (updaterOrValue: any) => {
      const newColumnPinning =
        typeof updaterOrValue === 'function' ? updaterOrValue(savedColumnPinning) : updaterOrValue

      // 保存到 pageStates
      setState(`${tableKey}_columnPinning`, newColumnPinning)
    },
    [savedColumnPinning, setState, tableKey]
  )

  // 创建表格实例
  const table = useReactTable({
    data,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    enableColumnPinning: true,
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    state: {
      columnSizing: savedColumnSizing,
      columnPinning: savedColumnPinning,
    },
    onColumnSizingChange: handleColumnSizingChange,
    onColumnPinningChange: handleColumnPinningChange,
    defaultColumn: {
      size: 150,
      minSize: 50,
      maxSize: Number.MAX_SAFE_INTEGER,
    },
  })

  // 重置列宽
  const resetColumnSizing = useCallback(() => {
    table.resetColumnSizing()
    setState(`${tableKey}_columnSizing`, {})
  }, [table, setState, tableKey])

  return {
    table,
    columnSizing: savedColumnSizing,
    columnPinning: savedColumnPinning,
    resetColumnSizing,
  }
}
