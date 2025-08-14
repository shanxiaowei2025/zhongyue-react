import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import {
  getEnterpriseList,
  getServiceHistory,
  getExpenseContribution,
  getEnterpriseById,
  searchCustomers,
  getEnterpriseByNameOrCode,
} from '../api/enterpriseService'
import type {
  EnterpriseQueryParams,
  ServiceHistoryQueryParams,
  ExpenseContributionQueryParams,
  CustomerQueryParams,
  Enterprise,
  ServiceHistory,
  ExpenseContribution,
} from '../types/enterpriseService'

// 企业列表请求的SWR键生成函数
const getEnterpriseListKey = (params: EnterpriseQueryParams) =>
  `/enterprise-service/customer?${new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString()}`

// 企业详情请求的SWR键生成函数
const getEnterpriseDetailKey = (id: number) => `/enterprise-service/customer/${id}`

// 服务历程请求的SWR键生成函数
const getServiceHistoryKey = (params: ServiceHistoryQueryParams) =>
  `/enterprise-service/service-history?${new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString()}`

// 费用贡献请求的SWR键生成函数
const getExpenseContributionKey = (params: ExpenseContributionQueryParams) =>
  `/enterprise-service/expense-contribution?${new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString()}`

// 企业列表数据的fetcher函数
const enterpriseListFetcher = async (url: string) => {
  const params = new URLSearchParams(url.split('?')[1])
  const queryParams: EnterpriseQueryParams = {}

  for (const [key, value] of params.entries()) {
    if (key === 'page' || key === 'pageSize') {
      queryParams[key] = parseInt(value)
    } else {
      queryParams[key] = value
    }
  }

  const response = await getEnterpriseList(queryParams)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取企业列表失败')
}

// 企业详情数据的fetcher函数
const enterpriseDetailFetcher = async (url: string) => {
  const id = parseInt(url.split('/').pop() || '0')
  const response = await getEnterpriseById(id)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取企业详情失败')
}

// 服务历程数据的fetcher函数
const serviceHistoryFetcher = async (url: string) => {
  const params = new URLSearchParams(url.split('?')[1])
  const queryParams: ServiceHistoryQueryParams = {}

  for (const [key, value] of params.entries()) {
    queryParams[key] = value
  }

  const response = await getServiceHistory(queryParams)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取服务历程失败')
}

// 费用贡献数据的fetcher函数
const expenseContributionFetcher = async (url: string) => {
  const params = new URLSearchParams(url.split('?')[1])
  const queryParams: ExpenseContributionQueryParams = {}

  for (const [key, value] of params.entries()) {
    queryParams[key] = value
  }

  const response = await getExpenseContribution(queryParams)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取费用贡献失败')
}

/**
 * 使用企业列表数据
 */
export const useEnterpriseList = (params: EnterpriseQueryParams) => {
  const key = getEnterpriseListKey(params)
  const { data, error, isLoading } = useSWR(key, enterpriseListFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const refreshEnterpriseList = async () => {
    await mutate(key)
  }

  return {
    enterprises: (data as any)?.data || [],
    pagination: {
      current: (data as any)?.meta?.page || 1,
      pageSize: (data as any)?.meta?.limit || 10,
      total: (data as any)?.total || 0,
    },
    loading: isLoading,
    error,
    refreshEnterpriseList,
  }
}

/**
 * 使用企业详情数据
 */
export const useEnterpriseDetail = (id?: number | null) => {
  const key = id ? getEnterpriseDetailKey(id) : null
  const { data, error, isLoading } = useSWR(key, enterpriseDetailFetcher, {
    revalidateOnFocus: false,
  })

  return {
    enterprise: data,
    loading: isLoading,
    error,
  }
}

/**
 * 使用服务历程数据
 */
export const useServiceHistory = (params?: ServiceHistoryQueryParams | null) => {
  const key = params ? getServiceHistoryKey(params) : null
  const { data, error, isLoading } = useSWR(key, serviceHistoryFetcher, {
    revalidateOnFocus: false,
  })

  return {
    serviceHistory: data || [],
    loading: isLoading,
    error,
  }
}

/**
 * 使用费用贡献数据
 */
export const useExpenseContribution = (params?: ExpenseContributionQueryParams | null) => {
  const key = params ? getExpenseContributionKey(params) : null
  const { data, error, isLoading } = useSWR(key, expenseContributionFetcher, {
    revalidateOnFocus: false,
  })

  return {
    expenseContribution: data,
    loading: isLoading,
    error,
  }
}

/**
 * 企业服务操作方法
 */
export const useEnterpriseOperations = () => {
  // 搜索客户
  const searchCustomersData = async (params: CustomerQueryParams) => {
    try {
      const response = await searchCustomers(params)
      if (response.code === 0) {
        return response.data
      } else {
        throw new Error(response.message || '搜索客户失败')
      }
    } catch (error: any) {
      console.error('搜索客户失败:', error)
      throw error
    }
  }

  // 根据名称或代码查询企业
  const getEnterpriseByNameOrCodeData = async (params: {
    companyName?: string
    unifiedSocialCreditCode?: string
  }) => {
    try {
      const response = await getEnterpriseByNameOrCode(params)
      if (response.code === 0) {
        return (response.data as any)?.data || []
      } else {
        throw new Error(response.message || '查询企业失败')
      }
    } catch (error: any) {
      console.error('查询企业失败:', error)
      throw error
    }
  }

  return {
    searchCustomersData,
    getEnterpriseByNameOrCodeData,
  }
}
