import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import {
  getTaxVerificationList,
  getTaxVerificationDetail,
  createTaxVerification,
  updateTaxVerification,
  deleteTaxVerification,
} from '../api/taxVerification'
import type {
  TaxVerificationQueryParams,
  CreateTaxVerificationDto,
  TaxVerification,
} from '../types/taxVerification'

// 税务核查列表请求的SWR键生成函数
const getTaxVerificationListKey = (params?: TaxVerificationQueryParams) => {
  if (!params) return '/enterprise-service/tax-verification'
  const searchParams = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  )
  return `/enterprise-service/tax-verification?${searchParams.toString()}`
}

// 税务核查详情请求的SWR键生成函数
const getTaxVerificationDetailKey = (id: number) => `/enterprise-service/tax-verification/${id}`

// 税务核查列表数据的fetcher函数
const taxVerificationListFetcher = async (url: string) => {
  const params = new URLSearchParams(url.split('?')[1])
  const queryParams: TaxVerificationQueryParams = {}

  for (const [key, value] of params.entries()) {
    if (key === 'page' || key === 'pageSize') {
      queryParams[key] = parseInt(value)
    } else {
      queryParams[key] = value
    }
  }

  const response = await getTaxVerificationList(queryParams)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取税务核查列表失败')
}

// 税务核查详情数据的fetcher函数
const taxVerificationDetailFetcher = async (url: string) => {
  const id = parseInt(url.split('/').pop() || '0')
  const response = await getTaxVerificationDetail(id)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取税务核查详情失败')
}

/**
 * 使用税务核查列表数据
 */
export const useTaxVerificationList = (params?: TaxVerificationQueryParams) => {
  const key = getTaxVerificationListKey(params)
  const { data, error, isLoading } = useSWR(key, taxVerificationListFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const refreshTaxVerificationList = async () => {
    await mutate(key)
  }

  return {
    data: (data as any)?.items || [],
    pagination: {
      current: (data as any)?.page || 1,
      pageSize: (data as any)?.pageSize || 10,
      total: (data as any)?.total || 0,
    },
    loading: isLoading,
    error,
    refreshTaxVerificationList,
  }
}

/**
 * 使用税务核查详情数据
 */
export const useTaxVerificationDetail = (id?: number | null) => {
  const key = id ? getTaxVerificationDetailKey(id) : null
  const { data, error, isLoading } = useSWR(key, taxVerificationDetailFetcher, {
    revalidateOnFocus: false,
  })

  return {
    data,
    loading: isLoading,
    error,
  }
}

/**
 * 税务核查操作方法
 */
export const useTaxVerificationOperations = () => {
  // 创建税务核查记录
  const createRecord = async (data: CreateTaxVerificationDto) => {
    try {
      const response = await createTaxVerification(data)
      if (response.code === 0) {
        message.success('创建成功')
        // 清除相关缓存
        await mutate(
          key => typeof key === 'string' && key.includes('/enterprise-service/tax-verification'),
          undefined,
          {
            revalidate: true,
          }
        )
        return response.data
      } else {
        message.error(response.message || '创建失败')
        throw new Error(response.message || '创建失败')
      }
    } catch (error: any) {
      console.error('创建税务核查记录失败:', error)
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          message.error(error.response.data.message.join(', '))
        } else {
          message.error(error.response.data.message)
        }
      } else if (!error.message.includes('创建失败')) {
        message.error('创建失败，请重试')
      }
      throw error
    }
  }

  // 更新税务核查记录
  const updateRecord = async (id: number, data: Partial<CreateTaxVerificationDto>) => {
    try {
      const response = await updateTaxVerification(id, data)
      if (response.code === 0) {
        message.success('更新成功')
        // 清除相关缓存
        await mutate(
          key => typeof key === 'string' && key.includes('/enterprise-service/tax-verification'),
          undefined,
          {
            revalidate: true,
          }
        )
        return response.data
      } else {
        message.error(response.message || '更新失败')
        throw new Error(response.message || '更新失败')
      }
    } catch (error: any) {
      console.error('更新税务核查记录失败:', error)
      throw error
    }
  }

  // 删除税务核查记录
  const deleteRecord = async (id: number) => {
    try {
      const response = await deleteTaxVerification(id)
      if (response.code === 0) {
        message.success('删除成功')
        // 清除相关缓存
        await mutate(
          key => typeof key === 'string' && key.includes('/enterprise-service/tax-verification'),
          undefined,
          {
            revalidate: true,
          }
        )
        return true
      } else {
        message.error(response.message || '删除失败')
        return false
      }
    } catch (error: any) {
      console.error('删除税务核查记录失败:', error)
      message.error('删除失败，请重试')
      return false
    }
  }

  return {
    createRecord,
    updateRecord,
    deleteRecord,
  }
}
