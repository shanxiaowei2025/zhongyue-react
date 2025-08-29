import useSWR from 'swr'
import { getCustomerChurnStats } from '../../../api/reports'
import type { CustomerChurnData } from '../types/reports'

interface UseCustomerChurnStatsParams {
  year?: number
  month?: number
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}

// SWR key生成函数
const getCustomerChurnStatsKey = (params: UseCustomerChurnStatsParams) => {
  return ['customer-churn-stats', params]
}

// 数据获取函数
const customerChurnStatsFetcher = async ([, params]: [string, UseCustomerChurnStatsParams]) => {
  try {
    const response = await getCustomerChurnStats(params)
    if (response.code === 0 && response.data) {
      return response.data
    } else {
      throw new Error(response.message || '获取客户流失统计数据失败')
    }
  } catch (error) {
    console.error('获取客户流失统计数据失败:', error)
    throw error
  }
}

export const useCustomerChurnStats = (params: UseCustomerChurnStatsParams = {}) => {
  const { year = new Date().getFullYear(), month, page, pageSize, sortField, sortOrder } = params

  // 清理参数对象，移除undefined值，确保SWR缓存键正确
  const validParams = Object.fromEntries(
    Object.entries({
      year,
      ...(month !== undefined && { month }),
      page,
      pageSize,
      sortField,
      sortOrder,
    }).filter(([_, value]) => value !== undefined)
  )

  const { data, error, isLoading, mutate } = useSWR<CustomerChurnData>(
    getCustomerChurnStatsKey(validParams),
    customerChurnStatsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 1000, // 1秒内不重复请求，确保用户交互响应及时
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
