import useSWR from 'swr'
import { getCustomerLevelDistribution } from '../../../api/reports'

interface UseCustomerLevelDistributionParams {
  year?: number
  month?: number
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
  _ts?: number
}

export const useCustomerLevelDistribution = (params: UseCustomerLevelDistributionParams = {}) => {
  const { data, error, isLoading, mutate } = useSWR(
    ['customer-level-distribution', params],
    () => getCustomerLevelDistribution(params),
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
