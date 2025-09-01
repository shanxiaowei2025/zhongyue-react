import useSWR from 'swr'
import { getNewCustomerStats } from '../../../api/reports'

interface UseNewCustomerStatsParams {
  year?: number
  month?: number
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}

export const useNewCustomerStats = (params: UseNewCustomerStatsParams = {}) => {
  const { data, error, isLoading, mutate } = useSWR(
    ['new-customer-stats', params],
    () => getNewCustomerStats(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5 * 60 * 1000, // 5分钟内不重复请求
    }
  )

  return {
    data: data?.data,
    error,
    isLoading,
    refresh: mutate,
  }
}
