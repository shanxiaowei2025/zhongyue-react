import useSWR from 'swr'
import { getServiceExpiryStats } from '../../../api/reports'
import type { ServiceExpiryData } from '../types/reports'

interface UseServiceExpiryStatsParams {
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
  companyName?: string
}

// SWR key生成函数
const getServiceExpiryStatsKey = (params: UseServiceExpiryStatsParams) => {
  return ['service-expiry-stats', params]
}

// 数据获取函数
const serviceExpiryStatsFetcher = async ([, params]: [string, UseServiceExpiryStatsParams]) => {
  try {
    const response = await getServiceExpiryStats(params)
    if (response.code === 0 && response.data) {
      return response.data
    } else {
      throw new Error(response.message || '获取服务到期统计数据失败')
    }
  } catch (error) {
    console.error('获取服务到期统计数据失败:', error)
    throw error
  }
}

export const useServiceExpiryStats = (params: UseServiceExpiryStatsParams = {}) => {
  const { page, pageSize, sortField, sortOrder, companyName } = params

  const validParams = { page, pageSize, sortField, sortOrder, companyName }

  const { data, error, isLoading, mutate } = useSWR<ServiceExpiryData>(
    getServiceExpiryStatsKey(validParams),
    serviceExpiryStatsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 15 * 60 * 1000, // 15分钟内不重复请求
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
