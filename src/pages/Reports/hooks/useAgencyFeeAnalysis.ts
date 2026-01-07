import useSWR from 'swr'
import { getAgencyFeeAnalysis } from '../../../api/reports'
import type { AgencyFeeAnalysisData } from '../types/reports'

interface UseAgencyFeeAnalysisParams {
  year?: number
  threshold?: number
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
  _ts?: number
}

// SWR key生成函数
const getAgencyFeeAnalysisKey = (params: UseAgencyFeeAnalysisParams) => {
  return ['agency-fee-analysis', params]
}

// 数据获取函数
const agencyFeeAnalysisFetcher = async ([, params]: [string, UseAgencyFeeAnalysisParams]) => {
  try {
    const response = await getAgencyFeeAnalysis(params)
    if (response.code === 0 && response.data) {
      return response.data
    } else {
      throw new Error(response.message || '获取代理费分析数据失败')
    }
  } catch (error) {
    console.error('获取代理费分析数据失败:', error)
    throw error
  }
}

export const useAgencyFeeAnalysis = (params: UseAgencyFeeAnalysisParams = {}) => {
  const {
    year = new Date().getFullYear(),
    threshold = 500,
    page = 1,
    pageSize = 10,
    sortField,
    sortOrder,
  } = params

  const validParams = { year, threshold, page, pageSize, sortField, sortOrder }

  const { data, error, isLoading, mutate } = useSWR<AgencyFeeAnalysisData>(
    getAgencyFeeAnalysisKey(validParams),
    agencyFeeAnalysisFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // 5分钟内不重复请求
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
