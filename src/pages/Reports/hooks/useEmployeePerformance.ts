import useSWR from 'swr'
import { getEmployeePerformance } from '../../../api/reports'
import type { EmployeePerformanceData } from '../types/reports'

interface UseEmployeePerformanceParams {
  month?: string
  employeeName?: string
  department?: string
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
  _ts?: number
}

// SWR key生成函数
const getEmployeePerformanceKey = (params: UseEmployeePerformanceParams) => {
  return ['employee-performance', params]
}

// 数据获取函数
const employeePerformanceFetcher = async ([, params]: [string, UseEmployeePerformanceParams]) => {
  try {
    const response = await getEmployeePerformance(params)
    if (response.code === 0 && response.data) {
      return response.data
    } else {
      throw new Error(response.message || '获取员工业绩数据失败')
    }
  } catch (error) {
    console.error('获取员工业绩数据失败:', error)
    throw error
  }
}

export const useEmployeePerformance = (params: UseEmployeePerformanceParams = {}) => {
  const {
    month = new Date().toISOString().slice(0, 7), // 默认当前月份 YYYY-MM
    employeeName,
    department,
    page,
    pageSize,
    sortField,
    sortOrder,
  } = params

  // 设置默认排序（如果没有指定排序字段，默认按总收入降序）
  const finalSortField = sortField || 'totalRevenue'
  const finalSortOrder = sortOrder || 'DESC'

  // 过滤掉undefined值，确保缓存key一致性
  const validParams = Object.fromEntries(
    Object.entries({
      month,
      employeeName,
      department,
      page,
      pageSize,
      sortField: finalSortField,
      sortOrder: finalSortOrder,
    }).filter(([_, value]) => value !== undefined && value !== null && value !== '')
  )

  const { data, error, isLoading, mutate } = useSWR<EmployeePerformanceData>(
    getEmployeePerformanceKey(validParams),
    employeePerformanceFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 1000, // 减少缓存时间，确保分页请求能正常发送
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
