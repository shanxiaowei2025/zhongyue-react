import useSWR from 'swr'
import { getAccountantClientStats } from '../../../api/reports'
import type { AccountantClientData } from '../types/reports'

interface UseAccountantClientStatsParams {
  accountantType?: string
  accountantName?: string
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}

// SWR key生成函数
const getAccountantClientStatsKey = (params: UseAccountantClientStatsParams) => {
  return ['accountant-client-stats', params]
}

// 数据获取函数
const accountantClientStatsFetcher = async ([, params]: [
  string,
  UseAccountantClientStatsParams,
]) => {
  try {
    const response = await getAccountantClientStats(params)
    if (response.code === 0 && response.data) {
      return response.data
    } else {
      throw new Error(response.message || '获取会计客户统计数据失败')
    }
  } catch (error) {
    console.error('获取会计客户统计数据失败:', error)
    throw error
  }
}

export const useAccountantClientStats = (params: UseAccountantClientStatsParams = {}) => {
  const { accountantType, accountantName, page, pageSize, sortField, sortOrder } = params

  const validParams = { accountantType, accountantName, page, pageSize, sortField, sortOrder }

  const { data, error, isLoading, mutate } = useSWR<AccountantClientData>(
    getAccountantClientStatsKey(validParams),
    accountantClientStatsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 60 * 1000, // 10分钟内不重复请求
      errorRetryCount: 2,
    }
  )

  // 刷新数据
  const refresh = () => {
    mutate()
  }

  return {
    data,
    isLoading,
    error,
    refresh,
  }
}
