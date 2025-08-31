import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import type {
  TableURLParams,
  UseServerTableReturn,
  ServerTableResponse,
} from '../types/serverTable'

interface UseServerTableOptions<T> {
  endpoint: string
  defaultParams?: Partial<TableURLParams>
  apiFunction: (params: any) => Promise<{ data: ServerTableResponse<T> }>
  swrOptions?: {
    revalidateOnFocus?: boolean
    revalidateOnReconnect?: boolean
    dedupingInterval?: number
  }
}

export const useServerTable = <T = any>(
  options: UseServerTableOptions<T>
): UseServerTableReturn<T> => {
  const { endpoint, defaultParams = {}, apiFunction, swrOptions = {} } = options
  const [searchParams, setSearchParams] = useSearchParams()

  // 从URL解析参数，应用默认值
  const urlParams = useMemo((): TableURLParams => {
    const params: TableURLParams = {
      page: parseInt(searchParams.get('page') || String(defaultParams.page || 1)),
      pageSize: parseInt(searchParams.get('pageSize') || String(defaultParams.pageSize || 10)),
      sortField: searchParams.get('sortField') || defaultParams.sortField,
      sortOrder: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || defaultParams.sortOrder,
    }

    // 添加其他筛选参数，优先使用URL参数，然后使用默认参数
    for (const [key, value] of searchParams.entries()) {
      if (!['page', 'pageSize', 'sortField', 'sortOrder'].includes(key)) {
        params[key] = value
      }
    }

    // 应用默认参数中的其他字段（如果URL中没有对应值）
    Object.entries(defaultParams).forEach(([key, value]) => {
      if (
        !['page', 'pageSize', 'sortField', 'sortOrder'].includes(key) &&
        params[key] === undefined
      ) {
        params[key] = value
      }
    })

    return params
  }, [searchParams, defaultParams])

  // 构建API请求参数
  const apiParams = useMemo(() => {
    // 移除undefined值，保持API请求干净
    const cleanParams = Object.entries(urlParams).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, any>
    )

    return cleanParams
  }, [urlParams])

  // SWR数据获取
  const { data, error, isLoading, mutate } = useSWR(
    [endpoint, apiParams],
    () => apiFunction(apiParams),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5 * 60 * 1000, // 5分钟缓存
      ...swrOptions,
    }
  )

  // 更新URL参数的通用函数
  const updateParams = useCallback(
    (updates: Partial<TableURLParams>) => {
      const newParams = new URLSearchParams(searchParams)

      // 应用更新
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          newParams.delete(key)
        } else {
          newParams.set(key, String(value))
        }
      })

      // 如果更新了排序或筛选条件，重置到第一页
      const needsPageReset = Object.keys(updates).some(key => key !== 'page' && key !== 'pageSize')

      if (needsPageReset && !updates.hasOwnProperty('page')) {
        newParams.set('page', '1')
      }

      setSearchParams(newParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  // 重置参数到默认状态
  const resetParams = useCallback(() => {
    const newParams = new URLSearchParams()

    // 应用默认参数
    if (defaultParams.page) newParams.set('page', String(defaultParams.page))
    if (defaultParams.pageSize) newParams.set('pageSize', String(defaultParams.pageSize))
    if (defaultParams.sortField) newParams.set('sortField', defaultParams.sortField)
    if (defaultParams.sortOrder) newParams.set('sortOrder', defaultParams.sortOrder)

    setSearchParams(newParams, { replace: true })
  }, [defaultParams, setSearchParams])

  // Ant Design Table的onChange处理器
  const handleTableChange = useCallback(
    (pagination: any, _filters: any, sorter: any) => {
      const updates: Partial<TableURLParams> = {}

      // 处理分页
      if (pagination.current !== urlParams.page) {
        updates.page = pagination.current
      }
      if (pagination.pageSize !== urlParams.pageSize) {
        updates.pageSize = pagination.pageSize
        updates.page = 1 // 改变页面大小时重置到第一页
      }

      // 处理排序
      if (sorter && sorter.field && sorter.order) {
        updates.sortField = sorter.field
        updates.sortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC'
      } else if (sorter && !sorter.field && !sorter.order) {
        // 取消排序的情况
        updates.sortField = defaultParams.sortField
        updates.sortOrder = defaultParams.sortOrder
      }

      if (Object.keys(updates).length > 0) {
        updateParams(updates)
      }
    },
    [urlParams, updateParams, defaultParams]
  )

  // 筛选处理器
  const handleFilter = useCallback(
    (field: string, value: any) => {
      updateParams({ [field]: value })
    },
    [updateParams]
  )

  // 刷新数据
  const refresh = useCallback(() => {
    mutate()
  }, [mutate])

  return {
    data: data?.data,
    loading: isLoading,
    error,
    urlParams,
    updateParams,
    resetParams,
    handleTableChange,
    handleFilter,
    refresh,
  }
}
